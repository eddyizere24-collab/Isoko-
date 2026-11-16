-- ISOKO migration 022: bind product image keys to the owning seller.
-- The API derives storage prefixes from authenticated seller profiles. RPC callers
-- must not be able to attach another seller's public image object to their products.
-- This is additive and does not rewrite existing product/image rows.

CREATE OR REPLACE FUNCTION public.create_seller_product_v1(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
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
  v_image_prefix TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000'; END IF;
  SELECT p.* INTO v_profile FROM public.profiles p WHERE p.auth_user_id=v_user_id AND p.role='seller';
  IF NOT FOUND THEN RAISE EXCEPTION 'SELLER_PROFILE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  SELECT s.* INTO v_shop FROM public.shops s WHERE s.owner_id=v_profile.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'SELLER_SHOP_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  v_image_prefix := 'products/' || v_profile.id || '/';

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
    IF left(v_image->>'path_full', length(v_image_prefix)) <> v_image_prefix
      OR left(v_image->>'path_thumb', length(v_image_prefix)) <> v_image_prefix THEN
      RAISE EXCEPTION 'PRODUCT_IMAGE_OWNERSHIP_INVALID' USING ERRCODE='42501';
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
$function$


CREATE OR REPLACE FUNCTION public.update_seller_product_v1(p_product_id text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_user_id TEXT := auth.user_id()::text;
  v_product RECORD;
  v_price INTEGER;
  v_old_price INTEGER;
  v_image JSONB;
  v_variant JSONB;
  v_image_prefix TEXT;
BEGIN
  SELECT p.*, s.owner_id AS seller_owner_id INTO v_product
  FROM public.products p
  JOIN public.shops s ON s.id=p.shop_id
  JOIN public.profiles owner ON owner.id=s.owner_id
  WHERE p.id=p_product_id AND owner.auth_user_id=v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND_OR_FORBIDDEN' USING ERRCODE='P0002'; END IF;
  v_image_prefix := 'products/' || v_product.seller_owner_id || '/';

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
      IF left(v_image->>'path_full', length(v_image_prefix)) <> v_image_prefix
        OR left(v_image->>'path_thumb', length(v_image_prefix)) <> v_image_prefix THEN
        RAISE EXCEPTION 'PRODUCT_IMAGE_OWNERSHIP_INVALID' USING ERRCODE='42501';
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
$function$


INSERT INTO public.schema_migrations(version)
VALUES ('022_product_image_owner_prefix')
ON CONFLICT (version) DO NOTHING;
