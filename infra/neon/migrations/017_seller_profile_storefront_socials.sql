-- Seller profile and storefront fields. 018 adds the public view fields.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_key TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;
DO $constraint$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.shops'::regclass AND conname='shops_social_links_object_check') THEN
    ALTER TABLE public.shops ADD CONSTRAINT shops_social_links_object_check CHECK (jsonb_typeof(social_links)='object');
  END IF;
END;
$constraint$;
GRANT SELECT (bio,avatar_key) ON public.profiles TO authenticated;
GRANT UPDATE (bio,avatar_key) ON public.profiles TO authenticated;
INSERT INTO public.schema_migrations(version) VALUES ('017_seller_profile_storefront_socials') ON CONFLICT (version) DO NOTHING;
