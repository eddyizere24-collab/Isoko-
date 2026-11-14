-- ISOKO Phase 2: complete seller identity, shop branding, public profile, and 500-item capacity.
-- Additive migration: it does not delete or rewrite existing seller or product records.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_key TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  ALTER COLUMN product_limit SET DEFAULT 500;

DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.shops'::regclass AND conname='shops_social_links_object_check'
  ) THEN
    ALTER TABLE public.shops
      ADD CONSTRAINT shops_social_links_object_check CHECK (jsonb_typeof(social_links)='object');
  END IF;
END;
$constraints$;

-- Extend the owner-only profile columns and shop branding columns.
GRANT SELECT (email,email_verified,identity_status,avatar_key,bio) ON public.profiles TO authenticated;
GRANT UPDATE (full_name,avatar_key,bio) ON public.profiles TO authenticated;
GRANT UPDATE (logo_key,cover_key,social_links) ON public.shops TO authenticated;

-- New stores can publish up to 500 products; raise the free-tier quota without lowering anyone's limit.
INSERT INTO public.settings(key,value) VALUES ('DEFAULT_PRODUCT_LIMIT','500'::jsonb)
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value;
UPDATE public.shops SET product_limit=GREATEST(product_limit,500) WHERE plan='free';

-- Keep object-storage keys, not branch-specific URLs, in public views.
-- The Vite app resolves each key against the configured Production or Preview bucket.
CREATE OR REPLACE VIEW public.v_public_shops AS
SELECT s.id,
    s.owner_id,
    s.slug,
    s.name,
        s.logo_key AS logo_path,
        s.cover_key AS cover_path,
    s.about,
    s.whatsapp,
    s.phone,
    s.district_id,
    s.sector_id,
    s.district_name,
    s.sector_name,
    s.landmark,
    s.hours_text,
    s.delivery_text,
    s.product_limit,
    s.plan,
    s.plan_expires_at,
    s.created_at,
    p.approved_at,
    p.status,
    ( SELECT count(*)::integer AS count
           FROM products pr
          WHERE pr.shop_id = s.id AND pr.status = 'active'::text) AS active_product_count,
    p.identity_status,
    p.full_name AS seller_name,
    p.bio AS seller_bio,
    p.avatar_key AS seller_avatar_path,
    s.social_links
   FROM shops s
     JOIN profiles p ON p.id = s.owner_id
  WHERE p.status = 'approved'::text;;

CREATE OR REPLACE VIEW public.v_public_products AS
SELECT p.id,
    p.shop_id,
    p.category_id,
    p.name,
    p.description,
    p.price,
    p.old_price,
    p.condition,
    p.brand,
    p.authentic,
    p.colors,
    p.status,
    p.hidden_reason,
    p.created_at,
    p.updated_at,
    p.last_confirmed_at,
    p.sold_out_at,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', im.id, 'product_id', im.product_id, 'position', im."position", 'path_full', im.path_full, 'path_thumb', im.path_thumb, 'width', im.width, 'height', im.height, 'bytes', im.bytes) ORDER BY im."position") AS jsonb_agg
           FROM product_images im
          WHERE im.product_id = p.id), '[]'::jsonb) AS images,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', v.id, 'product_id', v.product_id, 'size_label', v.size_label, 'color', v.color, 'in_stock', v.in_stock, 'qty', v.qty) ORDER BY v.size_label) AS jsonb_agg
           FROM product_variants v
          WHERE v.product_id = p.id), '[]'::jsonb) AS variants,
    jsonb_build_object('id', s.id, 'owner_id', s.owner_id, 'slug', s.slug, 'name', s.name, 'logo_path',
        s.logo_key, 'cover_path',
        s.cover_key, 'about', s.about, 'whatsapp', s.whatsapp, 'phone', s.phone, 'district_id', s.district_id, 'sector_id', s.sector_id, 'district_name', s.district_name, 'sector_name', s.sector_name, 'landmark', s.landmark, 'hours_text', s.hours_text, 'delivery_text', s.delivery_text, 'product_limit', s.product_limit, 'plan', s.plan, 'plan_expires_at', s.plan_expires_at, 'created_at', s.created_at, 'approved_at', owner.approved_at, 'status', owner.status, 'active_product_count', ( SELECT count(*)::integer AS count
           FROM products pc
          WHERE pc.shop_id = s.id AND pc.status = 'active'::text), 'seller_name', owner.full_name, 'seller_bio', owner.bio, 'seller_avatar_path', owner.avatar_key, 'social_links', s.social_links) AS shop,
    to_jsonb(c.*) AS category,
        CASE
            WHEN parent.id IS NULL THEN NULL::jsonb
            ELSE to_jsonb(parent.*)
        END AS parent_category,
    COALESCE(( SELECT sum(ds.views)::integer AS sum
           FROM product_daily_stats ds
          WHERE ds.product_id = p.id AND ds.day >= (CURRENT_DATE - '6 days'::interval)), 0) AS views_7d,
    COALESCE(( SELECT sum(ds.wa_clicks)::integer AS sum
           FROM product_daily_stats ds
          WHERE ds.product_id = p.id AND ds.day >= (CURRENT_DATE - '6 days'::interval)), 0) AS wa_clicks_7d,
    COALESCE(( SELECT sum(ds.views + ds.wa_clicks + ds.call_clicks + ds.cart_adds + ds.shares)::integer AS sum
           FROM product_daily_stats ds
          WHERE ds.product_id = p.id AND ds.day >= (CURRENT_DATE - '6 days'::interval)), 0) AS popularity_7d
   FROM products p
     JOIN shops s ON s.id = p.shop_id
     JOIN profiles owner ON owner.id = s.owner_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN categories parent ON parent.id = c.parent_id
  WHERE (p.status = ANY (ARRAY['active'::text, 'sold_out'::text])) AND owner.status = 'approved'::text;;

CREATE OR REPLACE VIEW public.v_public_shop_details AS
SELECT slug,
    jsonb_build_object('shop', to_jsonb(s.*), 'products', COALESCE(( SELECT jsonb_agg(to_jsonb(p.*) ORDER BY p.created_at DESC) AS jsonb_agg
           FROM ( SELECT p_1.id,
                    p_1.shop_id,
                    p_1.category_id,
                    p_1.name,
                    p_1.description,
                    p_1.price,
                    p_1.old_price,
                    p_1.condition,
                    p_1.brand,
                    p_1.authentic,
                    p_1.colors,
                    p_1.status,
                    p_1.hidden_reason,
                    p_1.created_at,
                    p_1.updated_at,
                    p_1.last_confirmed_at,
                    p_1.sold_out_at,
                    p_1.images,
                    p_1.variants,
                    p_1.shop,
                    p_1.category,
                    p_1.parent_category,
                    p_1.views_7d,
                    p_1.wa_clicks_7d,
                    p_1.popularity_7d
                   FROM v_public_products p_1
                  WHERE p_1.shop_id = s.id
                  ORDER BY p_1.created_at DESC
                 LIMIT 500) p), '[]'::jsonb)) AS detail
   FROM v_public_shops s;;

INSERT INTO public.schema_migrations(version)
VALUES ('016_seller_profile_storefront_capacity')
ON CONFLICT (version) DO NOTHING;
