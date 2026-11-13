-- Transaction-safe seller, buyer and moderation operations for ISOKO.
-- All routines use the verified Neon Auth JWT and/or the existing RLS policies.

CREATE OR REPLACE FUNCTION public.create_seller_product_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_user_id TEXT := auth.user_id()::text;
  v_profile RECORD;
  v_shop RECORD;
  v_product_id TEXT;
  v_status TEXT;
  v_price INTEGER;
  v_old_price INTEGER;
  v_image JSONB;
  v_variant JSONB;
  v_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000'; END IF;
  SELECT p.* INTO v_profile FROM public.profiles p WHERE p.auth_user_id=v_user_id AND p.role='seller';
  IF NOT FOUND THEN RAISE EXCEPTION 'SELLER_PROFILE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  SELECT s.* INTO v_shop FROM public.shops s WHERE s.owner_id=v_profile.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'SELLER_SHOP_NOT_FOUND' USING ERRCODE='P0002'; END IF;

  v_price := (p_payload->>'price')::INTEGER;
  v_old_price := NULLIF(p_payload->>'old_price','')::INTEGER;
  IF v_price < 500 OR v_price > 5000000 THEN RAISE EXCEPTION 'PRICE_INVALID' USING ERRCODE='22023'; END IF;
  IF v_old_price IS NOT NULL AND v_old_price <= v_price THEN RAISE EXCEPTION 'OLD_PRICE_INVALID' USING ERRCODE='22023'; END IF;
  IF length(trim(COALESCE(p_payload->>'name',''))) < 2 THEN RAISE EXCEPTION 'PRODUCT_NAME_REQUIRED' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id=(p_payload->>'category_id')::INTEGER AND active) THEN
    RAISE EXCEPTION 'CATEGORY_INVALID' USING ERRCODE='22023';
  END IF;
  IF jsonb_typeof(p_payload->'images') <> 'array'
    OR jsonb_array_length(p_payload->'images') < 1
    OR jsonb_array_length(p_payload->'images') > 5 THEN
    RAISE EXCEPTION 'PRODUCT_IMAGES_REQUIRED' USING ERRCODE='22023';
  END IF;
  IF jsonb_typeof(p_payload->'variants') <> 'array'
    OR jsonb_array_length(p_payload->'variants') < 1
    OR jsonb_array_length(p_payload->'variants') > 40 THEN
    RAISE EXCEPTION 'PRODUCT_VARIANTS_REQUIRED' USING ERRCODE='22023';
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.products WHERE shop_id=v_shop.id AND status <> 'expired';
  IF v_count >= v_shop.product_limit THEN RAISE EXCEPTION 'PRODUCT_LIMIT_REACHED' USING ERRCODE='22023'; END IF;

  v_product_id := 'prod-' || replace(gen_random_uuid()::text,'-','');
  v_status := CASE
    WHEN COALESCE((p_payload->>'isDraft')::BOOLEAN,FALSE) OR v_profile.status <> 'approved' OR v_shop.status <> 'approved'
      THEN 'draft'
    ELSE 'active'
  END;

  INSERT INTO public.products(
    id,shop_id,category_id,name,description,price,old_price,condition,brand,authentic,colors,status,hidden_reason,
    created_at,updated_at,last_confirmed_at
  ) VALUES (
    v_product_id,v_shop.id,(p_payload->>'category_id')::INTEGER,
    left(trim(p_payload->>'name'),120),left(COALESCE(p_payload->>'description',''),2000),
    v_price,v_old_price,COALESCE(p_payload->>'condition','new'),NULLIF(trim(p_payload->>'brand'),''),
    COALESCE((p_payload->>'authentic')::BOOLEAN,FALSE),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'colors','[]'::jsonb))),
    v_status,NULL,now(),now(),now()
  );

  FOR v_image IN SELECT value FROM jsonb_array_elements(p_payload->'images')
  LOOP
    IF COALESCE(v_image->>'path_full','') = '' OR COALESCE(v_image->>'path_thumb','') = '' THEN
      RAISE EXCEPTION 'PRODUCT_IMAGE_KEY_INVALID' USING ERRCODE='22023';
    END IF;
    IF (v_image->>'path_full') LIKE 'data:%' OR (v_image->>'path_thumb') LIKE 'data:%' THEN
      RAISE EXCEPTION 'LOCAL_IMAGE_DATA_NOT_ALLOWED' USING ERRCODE='22023';
    END IF;
    INSERT INTO public.product_images(id,product_id,position,path_full,path_thumb,width,height,bytes)
    VALUES (
      'img-' || replace(gen_random_uuid()::text,'-',''),v_product_id,
      COALESCE((v_image->>'position')::INTEGER,0),
      v_image->>'path_full',v_image->>'path_thumb',
      greatest(1,COALESCE((v_image->>'width')::INTEGER,1)),
      greatest(1,COALESCE((v_image->>'height')::INTEGER,1)),
      greatest(0,COALESCE((v_image->>'bytes')::INTEGER,0))
    );
  END LOOP;

  FOR v_variant IN SELECT value FROM jsonb_array_elements(p_payload->'variants')
  LOOP
    INSERT INTO public.product_variants(id,product_id,size_label,color,in_stock,qty)
    VALUES (
      'var-' || replace(gen_random_uuid()::text,'-',''),v_product_id,
      left(trim(v_variant->>'size_label'),30),NULLIF(v_variant->>'color',''),
      COALESCE((v_variant->>'in_stock')::BOOLEAN,TRUE),
      NULLIF(v_variant->>'qty','')::INTEGER
    );
  END LOOP;

  INSERT INTO public.price_history(id,product_id,price)
  VALUES ('price-' || replace(gen_random_uuid()::text,'-',''),v_product_id,v_price);

  RETURN jsonb_build_object('id',v_product_id,'status',v_status,'shop_id',v_shop.id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_seller_product_v1(p_product_id TEXT,p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_user_id TEXT := auth.user_id()::text;
  v_product RECORD;
  v_price INTEGER;
  v_old_price INTEGER;
  v_image JSONB;
  v_variant JSONB;
BEGIN
  SELECT p.* INTO v_product
  FROM public.products p
  JOIN public.shops s ON s.id=p.shop_id
  JOIN public.profiles owner ON owner.id=s.owner_id
  WHERE p.id=p_product_id AND owner.auth_user_id=v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND_OR_FORBIDDEN' USING ERRCODE='P0002'; END IF;

  v_price := COALESCE(NULLIF(p_payload->>'price','')::INTEGER,v_product.price);
  v_old_price := CASE WHEN p_payload ? 'old_price' THEN NULLIF(p_payload->>'old_price','')::INTEGER ELSE v_product.old_price END;
  IF v_price < 500 OR v_price > 5000000 THEN RAISE EXCEPTION 'PRICE_INVALID' USING ERRCODE='22023'; END IF;
  IF v_old_price IS NOT NULL AND v_old_price <= v_price THEN RAISE EXCEPTION 'OLD_PRICE_INVALID' USING ERRCODE='22023'; END IF;

  UPDATE public.products SET
    name=COALESCE(left(trim(p_payload->>'name'),120),name),
    description=COALESCE(left(p_payload->>'description',2000),description),
    price=v_price,
    old_price=v_old_price,
    condition=COALESCE(p_payload->>'condition',condition),
    brand=CASE WHEN p_payload ? 'brand' THEN NULLIF(trim(p_payload->>'brand'),'') ELSE brand END,
    authentic=COALESCE(NULLIF(p_payload->>'authentic','')::BOOLEAN,authentic),
    colors=CASE WHEN p_payload ? 'colors' THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'colors')) ELSE colors END,
    updated_at=now(),
    last_confirmed_at=now()
  WHERE id=p_product_id;

  IF v_price <> v_product.price THEN
    INSERT INTO public.price_history(id,product_id,price)
    VALUES ('price-' || replace(gen_random_uuid()::text,'-',''),p_product_id,v_price);
  END IF;

  IF p_payload ? 'variants' THEN
    DELETE FROM public.product_variants WHERE product_id=p_product_id;
    FOR v_variant IN SELECT value FROM jsonb_array_elements(p_payload->'variants')
    LOOP
      INSERT INTO public.product_variants(id,product_id,size_label,color,in_stock,qty)
      VALUES (
        'var-' || replace(gen_random_uuid()::text,'-',''),p_product_id,
        left(trim(v_variant->>'size_label'),30),NULLIF(v_variant->>'color',''),
        COALESCE((v_variant->>'in_stock')::BOOLEAN,TRUE),NULLIF(v_variant->>'qty','')::INTEGER
      );
    END LOOP;
  END IF;

  IF p_payload ? 'images' THEN
    IF jsonb_typeof(p_payload->'images') <> 'array' OR jsonb_array_length(p_payload->'images') < 1 OR jsonb_array_length(p_payload->'images') > 5 THEN
      RAISE EXCEPTION 'PRODUCT_IMAGES_INVALID' USING ERRCODE='22023';
    END IF;
    DELETE FROM public.product_images WHERE product_id=p_product_id;
    FOR v_image IN SELECT value FROM jsonb_array_elements(p_payload->'images')
    LOOP
      IF COALESCE(v_image->>'path_full','')='' OR COALESCE(v_image->>'path_thumb','')='' THEN
        RAISE EXCEPTION 'PRODUCT_IMAGE_KEY_INVALID' USING ERRCODE='22023';
      END IF;
      INSERT INTO public.product_images(id,product_id,position,path_full,path_thumb,width,height,bytes)
      VALUES (
        'img-' || replace(gen_random_uuid()::text,'-',''),p_product_id,
        COALESCE((v_image->>'position')::INTEGER,0),v_image->>'path_full',v_image->>'path_thumb',
        greatest(1,COALESCE((v_image->>'width')::INTEGER,1)),
        greatest(1,COALESCE((v_image->>'height')::INTEGER,1)),
        greatest(0,COALESCE((v_image->>'bytes')::INTEGER,0))
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('id',p_product_id,'status',v_product.status);
END;
$function$;

CREATE OR REPLACE FUNCTION public.copy_seller_product_v1(p_product_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_product public.products%ROWTYPE;
  v_new_id TEXT := 'prod-' || replace(gen_random_uuid()::text,'-','');
  v_shop RECORD;
BEGIN
  SELECT p.* INTO v_product
  FROM public.products p
  JOIN public.shops s ON s.id=p.shop_id
  JOIN public.profiles owner ON owner.id=s.owner_id
  WHERE p.id=p_product_id AND owner.auth_user_id=auth.user_id()::text;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND_OR_FORBIDDEN' USING ERRCODE='P0002'; END IF;

  SELECT s.* INTO v_shop FROM public.shops s WHERE s.id=v_product.shop_id;
  IF (SELECT COUNT(*) FROM public.products WHERE shop_id=v_shop.id AND status <> 'expired') >= v_shop.product_limit THEN
    RAISE EXCEPTION 'PRODUCT_LIMIT_REACHED' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.products(
    id,shop_id,category_id,name,description,price,old_price,condition,brand,authentic,colors,status,created_at,updated_at,last_confirmed_at
  )
  VALUES (
    v_new_id,v_product.shop_id,v_product.category_id,left(v_product.name || ' (Copy)',120),
    v_product.description,v_product.price,v_product.old_price,v_product.condition,v_product.brand,
    v_product.authentic,v_product.colors,'draft',now(),now(),now()
  );

  INSERT INTO public.product_images(id,product_id,position,path_full,path_thumb,width,height,bytes)
  SELECT 'img-' || replace(gen_random_uuid()::text,'-',''),v_new_id,position,path_full,path_thumb,width,height,bytes
  FROM public.product_images WHERE product_id=p_product_id;

  INSERT INTO public.product_variants(id,product_id,size_label,color,in_stock,qty)
  SELECT 'var-' || replace(gen_random_uuid()::text,'-',''),v_new_id,size_label,color,in_stock,qty
  FROM public.product_variants WHERE product_id=p_product_id;

  INSERT INTO public.price_history(id,product_id,price)
  VALUES ('price-' || replace(gen_random_uuid()::text,'-',''),v_new_id,v_product.price);

  RETURN jsonb_build_object('id',v_new_id,'status','draft');
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_seller_product_v1(p_product_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM public.products p
  USING public.shops s, public.profiles owner
  WHERE p.id=p_product_id AND s.id=p.shop_id AND owner.id=s.owner_id AND owner.auth_user_id=auth.user_id()::text;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count=0 THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND_OR_FORBIDDEN' USING ERRCODE='P0002'; END IF;
  RETURN jsonb_build_object('ok',true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_review_seller_v1(
  p_seller_id TEXT,p_status TEXT,p_reason TEXT DEFAULT NULL,
  p_phone_verified BOOLEAN DEFAULT FALSE,p_whatsapp_verified BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_admin_id TEXT;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles
  WHERE auth_user_id=auth.user_id()::text AND role='admin' AND status='approved';
  IF v_admin_id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_status NOT IN ('approved','needs_changes','rejected','suspended') THEN
    RAISE EXCEPTION 'SELLER_STATUS_INVALID' USING ERRCODE='22023';
  END IF;
  UPDATE public.profiles SET status=p_status,status_reason=NULLIF(p_reason,''),
    approved_by=CASE WHEN p_status='approved' THEN v_admin_id ELSE approved_by END,
    approved_at=CASE WHEN p_status='approved' THEN now() ELSE approved_at END
  WHERE id=p_seller_id AND role='seller';
  IF NOT FOUND THEN RAISE EXCEPTION 'SELLER_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  UPDATE public.shops SET status=p_status WHERE owner_id=p_seller_id;
  UPDATE public.seller_kyc SET
    phone_verified_at=CASE WHEN p_phone_verified THEN now() ELSE phone_verified_at END,
    whatsapp_verified_at=CASE WHEN p_whatsapp_verified THEN now() ELSE whatsapp_verified_at END,
    reviewed_at=now(),reviewed_by=v_admin_id,review_notes=NULLIF(p_reason,'')
  WHERE seller_id=p_seller_id;
  INSERT INTO public.audit_log(id,actor_id,actor_name,action,target_type,target_id,details)
  SELECT 'audit-' || replace(gen_random_uuid()::text,'-',''),v_admin_id,full_name,
    'seller_reviewed','seller',p_seller_id,jsonb_build_object('status',p_status,'reason',p_reason)
  FROM public.profiles WHERE id=v_admin_id;
  RETURN jsonb_build_object('ok',true,'status',p_status);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_moderate_product_v1(p_product_id TEXT,p_action TEXT,p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE v_admin_id TEXT;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles
  WHERE auth_user_id=auth.user_id()::text AND role='admin' AND status='approved';
  IF v_admin_id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_action NOT IN ('hide','restore') THEN RAISE EXCEPTION 'ACTION_INVALID' USING ERRCODE='22023'; END IF;
  UPDATE public.products p SET
    status=CASE WHEN p_action='hide' THEN 'hidden'
      WHEN owner.status='approved' THEN 'active' ELSE 'draft' END,
    hidden_reason=CASE WHEN p_action='hide' THEN left(COALESCE(p_reason,'Yahishwe n’ubuyobozi'),250) ELSE NULL END,
    updated_at=now()
  FROM public.shops s JOIN public.profiles owner ON owner.id=s.owner_id
  WHERE p.id=p_product_id AND p.shop_id=s.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  INSERT INTO public.audit_log(id,actor_id,actor_name,action,target_type,target_id,details)
  SELECT 'audit-' || replace(gen_random_uuid()::text,'-',''),id,full_name,
    'product_moderated','product',p_product_id,jsonb_build_object('action',p_action,'reason',p_reason)
  FROM public.profiles WHERE id=v_admin_id;
  RETURN jsonb_build_object('ok',true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_resolve_report_v1(
  p_report_id TEXT,p_status TEXT,p_resolution TEXT,p_hide_target BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE v_admin_id TEXT; v_report public.reports%ROWTYPE;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles
  WHERE auth_user_id=auth.user_id()::text AND role='admin' AND status='approved';
  IF v_admin_id IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_report FROM public.reports WHERE id=p_report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'REPORT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF p_status NOT IN ('new','in_progress','resolved') THEN RAISE EXCEPTION 'REPORT_STATUS_INVALID' USING ERRCODE='22023'; END IF;
  UPDATE public.reports SET status=p_status,resolution=left(COALESCE(p_resolution,''),1000),
    resolved_by=v_admin_id,resolved_at=CASE WHEN p_status='resolved' THEN now() ELSE NULL END
  WHERE id=p_report_id;
  IF p_hide_target AND p_status='resolved' THEN
    IF v_report.target_type='product' THEN
      UPDATE public.products SET status='hidden',hidden_reason='Yahishwe nyuma ya raporo',updated_at=now()
      WHERE id=v_report.target_id;
    ELSE
      UPDATE public.shops SET status='suspended' WHERE id=v_report.target_id;
      UPDATE public.profiles SET status='suspended',status_reason='Iduka ryahagaritswe nyuma ya raporo'
      WHERE id=(SELECT owner_id FROM public.shops WHERE id=v_report.target_id);
    END IF;
  END IF;
  RETURN jsonb_build_object('ok',true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_public_report_v1(
  p_target_type TEXT,p_target_id TEXT,p_type TEXT,p_details TEXT,
  p_reporter_phone TEXT DEFAULT NULL,p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_id TEXT := 'report-' || replace(gen_random_uuid()::text,'-','');
  v_key TEXT;
  v_count INTEGER;
  v_name TEXT;
BEGIN
  IF p_target_type NOT IN ('product','shop') THEN RAISE EXCEPTION 'REPORT_TARGET_INVALID' USING ERRCODE='22023'; END IF;
  IF p_type NOT IN ('counterfeit','fake_price','fake_photo','scam','prohibited','other') THEN
    RAISE EXCEPTION 'REPORT_TYPE_INVALID' USING ERRCODE='22023';
  END IF;
  IF length(trim(COALESCE(p_details,'')))<5 OR length(p_details)>1200 THEN
    RAISE EXCEPTION 'REPORT_DETAILS_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_target_type='product' THEN
    SELECT name INTO v_name FROM public.products WHERE id=p_target_id;
  ELSE
    SELECT name INTO v_name FROM public.shops WHERE id=p_target_id;
  END IF;
  IF v_name IS NULL THEN RAISE EXCEPTION 'REPORT_TARGET_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  v_key := encode(digest(COALESCE(p_session_id,'anonymous') || '|' || p_target_id,'sha256'),'hex');
  INSERT INTO public.report_rate(rate_key,rate_count,updated_at)
  VALUES(v_key,1,now())
  ON CONFLICT(rate_key) DO UPDATE
    SET rate_count=CASE WHEN public.report_rate.updated_at < now()-interval '1 hour' THEN 1 ELSE public.report_rate.rate_count+1 END,
        updated_at=now();
  SELECT rate_count INTO v_count FROM public.report_rate WHERE rate_key=v_key;
  IF v_count>3 THEN RAISE EXCEPTION 'REPORT_RATE_LIMIT' USING ERRCODE='22023'; END IF;
  INSERT INTO public.reports(id,target_type,target_id,target_name,type,details,reporter_phone,session_hash,status)
  VALUES(v_id,p_target_type,p_target_id,v_name,p_type,trim(p_details),NULLIF(p_reporter_phone,''),v_key,'new');
  RETURN jsonb_build_object('id',v_id,'status','new');
END;
$function$;

CREATE OR REPLACE FUNCTION public.subscribe_updates_v1(
  p_kind TEXT,p_external_id TEXT,p_district_id INTEGER DEFAULT NULL,
  p_top_category_id INTEGER DEFAULT NULL,p_shop_id TEXT DEFAULT NULL,
  p_unsubscribe BOOLEAN DEFAULT FALSE,p_consent_version TEXT DEFAULT '1.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE v_id TEXT;
BEGIN
  IF p_kind NOT IN ('push','email','shop_follow') THEN RAISE EXCEPTION 'SUBSCRIPTION_KIND_INVALID' USING ERRCODE='22023'; END IF;
  IF p_external_id IS NULL OR length(trim(p_external_id))<3 OR length(p_external_id)>500 THEN
    RAISE EXCEPTION 'SUBSCRIPTION_ID_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_kind='shop_follow' AND NOT EXISTS(SELECT 1 FROM public.shops WHERE id=p_shop_id AND status='approved') THEN
    RAISE EXCEPTION 'SHOP_NOT_FOUND' USING ERRCODE='P0002';
  END IF;
  IF p_unsubscribe THEN
    UPDATE public.subscribers SET unsubscribed_at=now()
    WHERE kind=p_kind AND external_id=p_external_id AND (p_shop_id IS NULL OR shop_id=p_shop_id);
    RETURN jsonb_build_object('ok',true,'unsubscribed',true);
  END IF;
  INSERT INTO public.subscribers(
    id,kind,external_id,district_id,top_category_id,shop_id,consent_at,consent_version
  ) VALUES (
    'sub-' || replace(gen_random_uuid()::text,'-',''),p_kind,trim(p_external_id),
    p_district_id,p_top_category_id,p_shop_id,now(),COALESCE(p_consent_version,'1.0')
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok',true,'id',v_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_marketplace_event_v1(
  p_type TEXT,p_product_id TEXT DEFAULT NULL,p_shop_id TEXT DEFAULT NULL,p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE v_day DATE := CURRENT_DATE; v_dedupe TEXT;
BEGIN
  IF p_type NOT IN ('view','wa_click','call_click','cart_add','share') THEN
    RAISE EXCEPTION 'EVENT_TYPE_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_product_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.products WHERE id=p_product_id) THEN
    RETURN jsonb_build_object('ok',true,'ignored',true);
  END IF;
  v_dedupe := encode(digest(COALESCE(p_session_id,'anonymous')||'|'||p_type||'|'||
    COALESCE(p_product_id,'')||'|'||COALESCE(p_shop_id,'')||'|'||v_day::text,'sha256'),'hex');
  INSERT INTO public.event_dedup(dedup_key) VALUES(v_dedupe) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',true,'duplicate',true); END IF;

  IF p_product_id IS NOT NULL THEN
    INSERT INTO public.product_daily_stats(product_id,day,views,wa_clicks,call_clicks,cart_adds,shares)
    VALUES(
      p_product_id,v_day,
      CASE WHEN p_type='view' THEN 1 ELSE 0 END,
      CASE WHEN p_type='wa_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='call_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='cart_add' THEN 1 ELSE 0 END,
      CASE WHEN p_type='share' THEN 1 ELSE 0 END
    )
    ON CONFLICT(product_id,day) DO UPDATE SET
      views=public.product_daily_stats.views+EXCLUDED.views,
      wa_clicks=public.product_daily_stats.wa_clicks+EXCLUDED.wa_clicks,
      call_clicks=public.product_daily_stats.call_clicks+EXCLUDED.call_clicks,
      cart_adds=public.product_daily_stats.cart_adds+EXCLUDED.cart_adds,
      shares=public.product_daily_stats.shares+EXCLUDED.shares;
  END IF;
  IF p_shop_id IS NOT NULL THEN
    INSERT INTO public.shop_daily_stats(shop_id,day,views,wa_clicks,call_clicks,cart_adds,shares)
    VALUES(
      p_shop_id,v_day,
      CASE WHEN p_type='view' THEN 1 ELSE 0 END,
      CASE WHEN p_type='wa_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='call_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='cart_add' THEN 1 ELSE 0 END,
      CASE WHEN p_type='share' THEN 1 ELSE 0 END
    )
    ON CONFLICT(shop_id,day) DO UPDATE SET
      views=public.shop_daily_stats.views+EXCLUDED.views,
      wa_clicks=public.shop_daily_stats.wa_clicks+EXCLUDED.wa_clicks,
      call_clicks=public.shop_daily_stats.call_clicks+EXCLUDED.call_clicks,
      cart_adds=public.shop_daily_stats.cart_adds+EXCLUDED.cart_adds,
      shares=public.shop_daily_stats.shares+EXCLUDED.shares;
  END IF;
  RETURN jsonb_build_object('ok',true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_campaign_v1(p_campaign_id TEXT,p_action TEXT,p_session_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
BEGIN
  IF p_action NOT IN ('impression','click') THEN RAISE EXCEPTION 'CAMPAIGN_ACTION_INVALID' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.campaigns WHERE id=p_campaign_id AND active) THEN
    RETURN jsonb_build_object('ok',true,'ignored',true);
  END IF;
  UPDATE public.campaigns SET
    impressions=impressions+CASE WHEN p_action='impression' THEN 1 ELSE 0 END,
    clicks=clicks+CASE WHEN p_action='click' THEN 1 ELSE 0 END
  WHERE id=p_campaign_id;
  RETURN jsonb_build_object('ok',true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_seller_product_v1(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_seller_product_v1(text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.copy_seller_product_v1(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_seller_product_v1(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_seller_v1(text,text,text,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_product_v1(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report_v1(text,text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_report_v1(text,text,text,text,text,text) TO anonymous,authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_updates_v1(text,text,integer,integer,text,boolean,text) TO anonymous,authenticated;
GRANT EXECUTE ON FUNCTION public.track_marketplace_event_v1(text,text,text,text) TO anonymous,authenticated;
GRANT EXECUTE ON FUNCTION public.track_campaign_v1(text,text,text) TO anonymous,authenticated;
