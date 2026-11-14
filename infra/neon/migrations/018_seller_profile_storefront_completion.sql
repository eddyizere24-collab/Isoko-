-- ISOKO Phase 4: complete seller identity, storefront branding and 500-item catalogue.
-- Idempotent because the live Production branch has already received part of this schema.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_key TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';

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

GRANT SELECT (email,email_verified,identity_status,bio,avatar_key)
  ON public.profiles TO authenticated;
GRANT UPDATE (bio,avatar_key) ON public.profiles TO authenticated;
GRANT SELECT (social_links) ON public.shops TO authenticated;
GRANT UPDATE (social_links) ON public.shops TO authenticated;

ALTER TABLE public.shops ALTER COLUMN product_limit SET DEFAULT 500;
UPDATE public.shops SET product_limit=500 WHERE product_limit<500;
UPDATE public.settings SET value=to_jsonb(500) WHERE key='DEFAULT_PRODUCT_LIMIT';

DO $view$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='v_public_shops' AND column_name='seller_name'
  ) THEN
    EXECUTE $sql$
      CREATE OR REPLACE VIEW public.v_public_shops AS
      SELECT s.id,s.owner_id,s.slug,s.name,
        CASE WHEN s.logo_key IS NULL THEN NULL::text WHEN s.logo_key LIKE 'http%' THEN s.logo_key
          ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text || regexp_replace(s.logo_key,'^/+',''::text) END AS logo_path,
        CASE WHEN s.cover_key IS NULL THEN NULL::text WHEN s.cover_key LIKE 'http%' THEN s.cover_key
          ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text || regexp_replace(s.cover_key,'^/+',''::text) END AS cover_path,
        s.about,s.whatsapp,s.phone,s.district_id,s.sector_id,s.district_name,s.sector_name,s.landmark,
        s.hours_text,s.delivery_text,s.product_limit,s.plan,s.plan_expires_at,s.created_at,
        p.approved_at,p.status,
        (SELECT count(*)::integer FROM public.products pr WHERE pr.shop_id=s.id AND pr.status='active') AS active_product_count,
        p.identity_status,p.full_name AS seller_name,p.bio AS seller_bio,
        CASE WHEN p.avatar_key IS NULL THEN NULL::text WHEN p.avatar_key LIKE 'http%' THEN p.avatar_key
          ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text || regexp_replace(p.avatar_key,'^/+',''::text) END AS seller_avatar_path,
        s.social_links
      FROM public.shops s JOIN public.profiles p ON p.id=s.owner_id
      WHERE p.status='approved'
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE OR REPLACE VIEW public.v_public_shops AS
      SELECT s.id,s.owner_id,s.slug,s.name,
        CASE WHEN s.logo_key IS NULL THEN NULL::text WHEN s.logo_key LIKE 'http%' THEN s.logo_key
          ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text || regexp_replace(s.logo_key,'^/+',''::text) END AS logo_path,
        CASE WHEN s.cover_key IS NULL THEN NULL::text WHEN s.cover_key LIKE 'http%' THEN s.cover_key
          ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text || regexp_replace(s.cover_key,'^/+',''::text) END AS cover_path,
        s.about,s.whatsapp,s.phone,s.district_id,s.sector_id,s.district_name,s.sector_name,s.landmark,
        s.hours_text,s.delivery_text,s.product_limit,s.plan,s.plan_expires_at,s.created_at,
        p.approved_at,p.status,
        (SELECT count(*)::integer FROM public.products pr WHERE pr.shop_id=s.id AND pr.status='active') AS active_product_count,
        p.identity_status,s.social_links,p.full_name AS seller_name,p.bio AS seller_bio,
        CASE WHEN p.avatar_key IS NULL THEN NULL::text WHEN p.avatar_key LIKE 'http%' THEN p.avatar_key
          ELSE 'https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/'::text || regexp_replace(p.avatar_key,'^/+',''::text) END AS seller_avatar_path
      FROM public.shops s JOIN public.profiles p ON p.id=s.owner_id
      WHERE p.status='approved'
    $sql$;
  END IF;
END;
$view$;
INSERT INTO public.schema_migrations(version)
VALUES ('018_seller_profile_storefront_completion')
ON CONFLICT (version) DO NOTHING;
