-- Final least-privilege policies for the ISOKO Neon Data API.
-- This migration removes recursive administrator policies and makes all sensitive writes RPC-only.

CREATE OR REPLACE FUNCTION public.is_isoko_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.user_id()::text
      AND role = 'admin'
      AND status = 'approved'
  );
$function$;
REVOKE ALL ON FUNCTION public.is_isoko_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_isoko_admin() TO authenticated;

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles FOR SELECT TO authenticated
USING (auth_user_id = auth.user_id()::text OR public.is_isoko_admin());
DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles FOR ALL TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());

DROP POLICY IF EXISTS kyc_select_own_or_admin ON seller_kyc;
CREATE POLICY kyc_select_own_or_admin ON seller_kyc FOR SELECT TO authenticated
USING (
  seller_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.user_id()::text)
  OR public.is_isoko_admin()
);
DROP POLICY IF EXISTS kyc_admin_update ON seller_kyc;
CREATE POLICY kyc_admin_update ON seller_kyc FOR UPDATE TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());

DROP POLICY IF EXISTS shops_admin_all ON shops;
CREATE POLICY shops_admin_all ON shops FOR ALL TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());
DROP POLICY IF EXISTS products_admin_all ON products;
CREATE POLICY products_admin_all ON products FOR ALL TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());

DROP POLICY IF EXISTS reports_admin_select ON reports;
CREATE POLICY reports_admin_select ON reports FOR SELECT TO authenticated USING (public.is_isoko_admin());
DROP POLICY IF EXISTS reports_admin_update ON reports;
CREATE POLICY reports_admin_update ON reports FOR UPDATE TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());

DROP POLICY IF EXISTS subscribers_admin_select ON subscribers;
CREATE POLICY subscribers_admin_select ON subscribers FOR SELECT TO authenticated USING (public.is_isoko_admin());
DROP POLICY IF EXISTS subscribers_admin_update ON subscribers;
CREATE POLICY subscribers_admin_update ON subscribers FOR UPDATE TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());

DROP POLICY IF EXISTS synonyms_admin_all ON synonyms;
CREATE POLICY synonyms_admin_all ON synonyms FOR ALL TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());
DROP POLICY IF EXISTS settings_admin_all ON settings;
CREATE POLICY settings_admin_all ON settings FOR ALL TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());
DROP POLICY IF EXISTS campaigns_admin_all ON campaigns;
CREATE POLICY campaigns_admin_all ON campaigns FOR ALL TO authenticated
USING (public.is_isoko_admin())
WITH CHECK (public.is_isoko_admin());
DROP POLICY IF EXISTS audit_log_admin_select ON audit_log;
CREATE POLICY audit_log_admin_select ON audit_log FOR SELECT TO authenticated USING (public.is_isoko_admin());

-- Sellers may edit descriptive shop details, but cannot approve themselves,
-- change the free plan, expand product limits, or change owner/status fields.
REVOKE UPDATE ON shops FROM authenticated;
GRANT UPDATE (
  name, about, whatsapp, phone, district_id, sector_id,
  district_name, sector_name, landmark, hours_text, delivery_text
) ON shops TO authenticated;
GRANT SELECT ON shops TO authenticated;

-- Product mutations must pass through ownership-, validation-, inventory-,
-- and product-limit-aware RPCs. Direct table writes are disabled.
REVOKE INSERT, UPDATE, DELETE ON products FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON product_images FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON product_variants FROM authenticated;
REVOKE INSERT ON price_history FROM authenticated;
REVOKE UPDATE ON reports FROM authenticated;
REVOKE UPDATE ON seller_kyc FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit_log FROM authenticated;

-- RPCs with explicit ownership/admin checks execute as their controlled owner.
ALTER FUNCTION public.create_seller_product_v1(jsonb) SECURITY DEFINER;
ALTER FUNCTION public.create_seller_product_v1(jsonb) SET search_path TO pg_catalog, public, auth;
ALTER FUNCTION public.update_seller_product_v1(text,jsonb) SECURITY DEFINER;
ALTER FUNCTION public.update_seller_product_v1(text,jsonb) SET search_path TO pg_catalog, public, auth;
ALTER FUNCTION public.copy_seller_product_v1(text) SECURITY DEFINER;
ALTER FUNCTION public.copy_seller_product_v1(text) SET search_path TO pg_catalog, public, auth;
ALTER FUNCTION public.delete_seller_product_v1(text) SECURITY DEFINER;
ALTER FUNCTION public.delete_seller_product_v1(text) SET search_path TO pg_catalog, public, auth;
ALTER FUNCTION public.admin_review_seller_v1(text,text,text,boolean,boolean) SECURITY DEFINER;
ALTER FUNCTION public.admin_review_seller_v1(text,text,text,boolean,boolean) SET search_path TO pg_catalog, public, auth;
ALTER FUNCTION public.admin_moderate_product_v1(text,text,text) SECURITY DEFINER;
ALTER FUNCTION public.admin_moderate_product_v1(text,text,text) SET search_path TO pg_catalog, public, auth;
ALTER FUNCTION public.admin_resolve_report_v1(text,text,text,boolean) SECURITY DEFINER;
ALTER FUNCTION public.admin_resolve_report_v1(text,text,text,boolean) SET search_path TO pg_catalog, public, auth;

-- Prevent duplicate subscriptions when shop_id is NULL as well as when following a shop.
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_kind_external_shop_unique
  ON subscribers(kind, external_id, shop_id) NULLS NOT DISTINCT;

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
  IF p_kind NOT IN ('push','email','shop_follow') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_KIND_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_external_id IS NULL OR length(trim(p_external_id))<3 OR length(p_external_id)>500 THEN
    RAISE EXCEPTION 'SUBSCRIPTION_ID_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_kind='shop_follow' AND NOT EXISTS(
    SELECT 1 FROM public.shops s JOIN public.profiles p ON p.id=s.owner_id
    WHERE s.id=p_shop_id AND p.status='approved'
  ) THEN RAISE EXCEPTION 'SHOP_NOT_FOUND' USING ERRCODE='P0002'; END IF;

  IF p_unsubscribe THEN
    UPDATE public.subscribers SET unsubscribed_at=now()
    WHERE kind=p_kind AND external_id=trim(p_external_id)
      AND shop_id IS NOT DISTINCT FROM p_shop_id;
    RETURN jsonb_build_object('ok',true,'unsubscribed',true);
  END IF;

  INSERT INTO public.subscribers(
    id,kind,external_id,district_id,top_category_id,shop_id,consent_at,consent_version,unsubscribed_at
  ) VALUES (
    'sub-' || replace(gen_random_uuid()::text,'-',''),p_kind,trim(p_external_id),
    p_district_id,p_top_category_id,p_shop_id,now(),COALESCE(p_consent_version,'1.0'),NULL
  )
  ON CONFLICT(kind,external_id,shop_id) DO UPDATE SET
    district_id=EXCLUDED.district_id,
    top_category_id=EXCLUDED.top_category_id,
    consent_at=now(),
    consent_version=EXCLUDED.consent_version,
    unsubscribed_at=NULL
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok',true,'id',v_id);
END;
$function$;
