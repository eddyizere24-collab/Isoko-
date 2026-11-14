-- ISOKO Phase 2: seller-owned hide/unhide for a product.
-- Keep the previous state so sold-out products are not accidentally reactivated.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_hidden_previous_status TEXT;

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.products'::regclass
      AND conname='products_seller_hidden_previous_status_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_seller_hidden_previous_status_check
      CHECK (
        seller_hidden_previous_status IS NULL OR
        seller_hidden_previous_status IN ('draft','active','sold_out')
      );
  END IF;
END;
$constraint$;

CREATE OR REPLACE FUNCTION public.set_seller_product_visibility_v1(
  p_product_id TEXT,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_user_id TEXT := auth.user_id()::text;
  v_seller_id TEXT;
  v_seller_name TEXT;
  v_seller_status TEXT;
  v_shop_status TEXT;
  v_product_status TEXT;
  v_hidden_reason TEXT;
  v_previous_status TEXT;
  v_next_status TEXT;
BEGIN
  IF v_user_id IS NULL OR v_user_id='' THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000';
  END IF;

  IF p_action NOT IN ('hide','unhide') THEN
    RAISE EXCEPTION 'ACTION_INVALID' USING ERRCODE='22023';
  END IF;

  SELECT owner.id, owner.full_name, owner.status, s.status,
         product.status, product.hidden_reason, product.seller_hidden_previous_status
  INTO v_seller_id, v_seller_name, v_seller_status, v_shop_status,
       v_product_status, v_hidden_reason, v_previous_status
  FROM public.products product
  JOIN public.shops s ON s.id=product.shop_id
  JOIN public.profiles owner ON owner.id=s.owner_id
  WHERE product.id=p_product_id
    AND owner.auth_user_id=v_user_id
    AND owner.role='seller'
  FOR UPDATE OF product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND_OR_FORBIDDEN' USING ERRCODE='P0002';
  END IF;

  IF p_action='hide' THEN
    IF v_product_status='hidden' THEN
      RAISE EXCEPTION 'PRODUCT_ALREADY_HIDDEN' USING ERRCODE='22023';
    END IF;
    IF v_product_status NOT IN ('active','draft','sold_out') THEN
      RAISE EXCEPTION 'PRODUCT_STATUS_NOT_HIDABLE' USING ERRCODE='22023';
    END IF;

    v_next_status := 'hidden';
    UPDATE public.products
    SET seller_hidden_previous_status=v_product_status,
        status='hidden',
        hidden_reason='Yahishwe n’umucuruzi',
        updated_at=now()
    WHERE id=p_product_id;
  ELSE
    IF v_product_status<>'hidden'
       OR v_hidden_reason IS DISTINCT FROM 'Yahishwe n’umucuruzi'
       OR v_previous_status IS NULL THEN
      RAISE EXCEPTION 'PRODUCT_NOT_HIDDEN_BY_OWNER' USING ERRCODE='22023';
    END IF;
    IF v_seller_status<>'approved' OR v_shop_status<>'approved' THEN
      RAISE EXCEPTION 'SELLER_SHOP_NOT_ACTIVE' USING ERRCODE='42501';
    END IF;

    v_next_status := v_previous_status;
    UPDATE public.products
    SET status=v_previous_status,
        hidden_reason=NULL,
        seller_hidden_previous_status=NULL,
        updated_at=now()
    WHERE id=p_product_id;
  END IF;

  INSERT INTO public.audit_log(
    id,actor_id,actor_name,action,target_type,target_id,details,created_at
  ) VALUES (
    'audit-' || replace(gen_random_uuid()::text,'-',''),
    v_seller_id,v_seller_name,
    CASE WHEN p_action='hide' THEN 'seller_product_hidden' ELSE 'seller_product_unhidden' END,
    'product',p_product_id,
    jsonb_build_object('previous_status',v_product_status,'status',v_next_status),
    now()
  );

  RETURN jsonb_build_object('ok',true,'status',v_next_status);
END;
$function$;

REVOKE ALL ON FUNCTION public.set_seller_product_visibility_v1(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_seller_product_visibility_v1(text,text) TO authenticated;

INSERT INTO public.schema_migrations(version)
VALUES ('014_seller_product_visibility')
ON CONFLICT (version) DO NOTHING;
