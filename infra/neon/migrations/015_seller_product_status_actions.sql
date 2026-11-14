-- ISOKO Phase 2: seller-owned sold-out and restore workflow.
-- This RPC supplies the actions already presented in the seller product list.
CREATE OR REPLACE FUNCTION public.set_seller_product_status_v1(
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
  v_next_status TEXT;
BEGIN
  IF v_user_id IS NULL OR v_user_id='' THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000';
  END IF;
  IF p_action NOT IN ('mark_sold','restore') THEN
    RAISE EXCEPTION 'ACTION_INVALID' USING ERRCODE='22023';
  END IF;

  SELECT owner.id, owner.full_name, owner.status, s.status, product.status
  INTO v_seller_id, v_seller_name, v_seller_status, v_shop_status, v_product_status
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

  IF p_action='mark_sold' THEN
    IF v_product_status<>'active' THEN
      RAISE EXCEPTION 'PRODUCT_NOT_ACTIVE' USING ERRCODE='22023';
    END IF;
    v_next_status := 'sold_out';
    UPDATE public.products
    SET status='sold_out', sold_out_at=now(), updated_at=now()
    WHERE id=p_product_id;
  ELSE
    IF v_product_status NOT IN ('sold_out','draft') THEN
      RAISE EXCEPTION 'PRODUCT_STATUS_NOT_RESTORABLE' USING ERRCODE='22023';
    END IF;
    IF v_seller_status='approved' AND v_shop_status='approved' THEN
      v_next_status := 'active';
    ELSE
      v_next_status := 'draft';
    END IF;
    UPDATE public.products
    SET status=v_next_status, sold_out_at=NULL, updated_at=now()
    WHERE id=p_product_id;
  END IF;

  INSERT INTO public.audit_log(
    id,actor_id,actor_name,action,target_type,target_id,details,created_at
  ) VALUES (
    'audit-' || replace(gen_random_uuid()::text,'-',''),
    v_seller_id,v_seller_name,
    CASE WHEN p_action='mark_sold' THEN 'seller_product_marked_sold' ELSE 'seller_product_restored' END,
    'product',p_product_id,
    jsonb_build_object('previous_status',v_product_status,'status',v_next_status),
    now()
  );

  RETURN jsonb_build_object('ok',true,'status',v_next_status);
END;
$function$;

REVOKE ALL ON FUNCTION public.set_seller_product_status_v1(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_seller_product_status_v1(text,text) TO authenticated;

INSERT INTO public.schema_migrations(version)
VALUES ('015_seller_product_status_actions')
ON CONFLICT (version) DO NOTHING;
