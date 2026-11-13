-- Additive RLS and least-privilege grants for the isolated Neon setup branch.
ALTER TABLE profiles ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dedup ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_rate ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles FOR SELECT TO authenticated
USING (auth_user_id = auth.user_id()::text OR EXISTS (
  SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'
));
CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated
USING (auth_user_id = auth.user_id()::text)
WITH CHECK (auth_user_id = auth.user_id()::text);
CREATE POLICY profiles_admin_all ON profiles FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

CREATE POLICY kyc_select_own_or_admin ON seller_kyc FOR SELECT TO authenticated
USING (seller_id IN (SELECT id FROM profiles WHERE auth_user_id=auth.user_id()::text)
  OR EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY kyc_admin_update ON seller_kyc FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

CREATE POLICY shops_select_owner ON shops FOR SELECT TO authenticated
USING (owner_id IN (SELECT id FROM profiles WHERE auth_user_id=auth.user_id()::text)
  OR EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY shops_update_owner ON shops FOR UPDATE TO authenticated
USING (owner_id IN (SELECT id FROM profiles WHERE auth_user_id=auth.user_id()::text))
WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE auth_user_id=auth.user_id()::text));
CREATE POLICY shops_admin_all ON shops FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

CREATE POLICY products_select_owner_or_public ON products FOR SELECT TO authenticated
USING (
  shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id=s.owner_id WHERE p.auth_user_id=auth.user_id()::text)
  OR (status IN ('active','sold_out') AND shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id=s.owner_id WHERE p.status='approved'))
  OR EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved')
);
CREATE POLICY products_insert_owner ON products FOR INSERT TO authenticated
WITH CHECK (shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id=s.owner_id WHERE p.auth_user_id=auth.user_id()::text AND p.status IN ('pending','approved')));
CREATE POLICY products_update_owner ON products FOR UPDATE TO authenticated
USING (shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id=s.owner_id WHERE p.auth_user_id=auth.user_id()::text))
WITH CHECK (shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id=s.owner_id WHERE p.auth_user_id=auth.user_id()::text));
CREATE POLICY products_delete_owner ON products FOR DELETE TO authenticated
USING (shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id=s.owner_id WHERE p.auth_user_id=auth.user_id()::text));
CREATE POLICY products_admin_all ON products FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

CREATE POLICY product_images_select ON product_images FOR SELECT TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id
  WHERE (owner.auth_user_id=auth.user_id()::text) OR (p.status IN ('active','sold_out') AND owner.status='approved'))
  OR EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY product_images_insert ON product_images FOR INSERT TO authenticated
WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text));
CREATE POLICY product_images_update ON product_images FOR UPDATE TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text))
WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text));
CREATE POLICY product_images_delete ON product_images FOR DELETE TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text));

CREATE POLICY product_variants_select ON product_variants FOR SELECT TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id
  WHERE owner.auth_user_id=auth.user_id()::text OR (p.status IN ('active','sold_out') AND owner.status='approved'))
  OR EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY product_variants_insert ON product_variants FOR INSERT TO authenticated
WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text));
CREATE POLICY product_variants_update ON product_variants FOR UPDATE TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text))
WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text));
CREATE POLICY product_variants_delete ON product_variants FOR DELETE TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text));

CREATE POLICY price_history_select ON price_history FOR SELECT TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id
  WHERE owner.auth_user_id=auth.user_id()::text OR (p.status IN ('active','sold_out') AND owner.status='approved')));
CREATE POLICY price_history_insert ON price_history FOR INSERT TO authenticated
WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text));

CREATE POLICY reports_admin_select ON reports FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY reports_admin_update ON reports FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

CREATE POLICY subscribers_admin_select ON subscribers FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY subscribers_admin_update ON subscribers FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

CREATE POLICY product_daily_stats_owner_select ON product_daily_stats FOR SELECT TO authenticated
USING (product_id IN (SELECT p.id FROM products p JOIN shops s ON s.id=p.shop_id JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text)
  OR EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY shop_daily_stats_owner_select ON shop_daily_stats FOR SELECT TO authenticated
USING (shop_id IN (SELECT s.id FROM shops s JOIN profiles owner ON owner.id=s.owner_id WHERE owner.auth_user_id=auth.user_id()::text)
  OR EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

CREATE POLICY synonyms_admin_all ON synonyms FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY settings_admin_all ON settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY campaigns_admin_all ON campaigns FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));
CREATE POLICY audit_log_admin_select ON audit_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles me WHERE me.auth_user_id=auth.user_id()::text AND me.role='admin' AND me.status='approved'));

GRANT SELECT (id,role,full_name,phone,whatsapp,status,status_reason,approved_by,approved_at,terms_version,terms_accepted_at,created_at,auth_user_id)
  ON profiles TO authenticated;
GRANT UPDATE (full_name,whatsapp) ON profiles TO authenticated;
GRANT SELECT,UPDATE ON shops TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON products,product_images,product_variants TO authenticated;
GRANT SELECT,INSERT ON price_history TO authenticated;
GRANT SELECT (seller_id,full_name_on_id,business_type,phone_verified_at,whatsapp_verified_at,submitted_at,reviewed_at,reviewed_by,review_notes)
  ON seller_kyc TO authenticated;
GRANT SELECT,UPDATE ON reports TO authenticated;
GRANT SELECT,UPDATE ON subscribers TO authenticated;
GRANT SELECT ON product_daily_stats,shop_daily_stats TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON synonyms,settings,campaigns TO authenticated;
GRANT SELECT ON audit_log TO authenticated;
