-- ISOKO migration 021: expose explicit identity verification in public product shop JSON.
-- Existing public shop view and product columns are retained; only a nested JSON field is added.
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
    jsonb_build_object('id', s.id, 'owner_id', s.owner_id, 'slug', s.slug, 'name', s.name, 'logo_path', s.logo_key, 'cover_path', s.cover_key, 'about', s.about, 'whatsapp', s.whatsapp, 'phone', s.phone, 'district_id', s.district_id, 'sector_id', s.sector_id, 'district_name', s.district_name, 'sector_name', s.sector_name, 'landmark', s.landmark, 'hours_text', s.hours_text, 'delivery_text', s.delivery_text, 'product_limit', s.product_limit, 'plan', s.plan, 'plan_expires_at', s.plan_expires_at, 'created_at', s.created_at, 'approved_at', owner.approved_at, 'status', owner.status, 'identity_status', owner.identity_status, 'active_product_count', ( SELECT count(*)::integer AS count
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
  WHERE (p.status = ANY (ARRAY['active'::text, 'sold_out'::text])) AND owner.status = 'approved'::text;
INSERT INTO public.schema_migrations(version)
VALUES ('021_public_product_identity_status')
ON CONFLICT (version) DO NOTHING;
