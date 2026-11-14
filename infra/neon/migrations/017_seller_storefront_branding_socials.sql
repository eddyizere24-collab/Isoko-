-- ISOKO Phase 3b: seller-owned storefront branding and social links.
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.shops'::regclass AND conname='shops_social_links_object_check'
  ) THEN
    ALTER TABLE public.shops
      ADD CONSTRAINT shops_social_links_object_check
      CHECK (jsonb_typeof(social_links)='object');
  END IF;
END;
$constraint$;

CREATE OR REPLACE VIEW public.v_public_shops AS
SELECT
  s.id,
  s.owner_id,
  s.slug,
  s.name,
  CASE WHEN s.logo_key IS NULL THEN NULL::text
    ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text
      || regexp_replace(s.logo_key, '^/+'::text, ''::text)
  END AS logo_path,
  CASE WHEN s.cover_key IS NULL THEN NULL::text
    ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text
      || regexp_replace(s.cover_key, '^/+'::text, ''::text)
  END AS cover_path,
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
  (SELECT count(*)::integer FROM public.products pr
   WHERE pr.shop_id=s.id AND pr.status='active') AS active_product_count,
  p.identity_status,
  s.social_links
FROM public.shops s
JOIN public.profiles p ON p.id=s.owner_id
WHERE p.status='approved';

INSERT INTO public.schema_migrations(version)
VALUES ('017_seller_storefront_branding_socials')
ON CONFLICT (version) DO NOTHING;
