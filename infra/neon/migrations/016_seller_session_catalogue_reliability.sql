-- ISOKO Phase 3: unblock authenticated seller sessions and remove the 150-item ceiling.
-- Additive and safe for existing accounts. The profile fields were added in migration 013,
-- but the authenticated column grant list from migration 004 was not extended.
GRANT SELECT (email, email_verified, identity_status) ON public.profiles TO authenticated;

-- Sellers can maintain a real catalogue of at least 200 products. Keep the plan cap
-- configurable through settings, with a generous default rather than silently stopping at 150.
ALTER TABLE public.shops ALTER COLUMN product_limit SET DEFAULT 5000;
UPDATE public.shops SET product_limit = 5000 WHERE product_limit < 5000;
UPDATE public.settings SET value = to_jsonb(5000) WHERE key = 'DEFAULT_PRODUCT_LIMIT';

INSERT INTO public.schema_migrations(version)
VALUES ('016_seller_session_catalogue_reliability')
ON CONFLICT (version) DO NOTHING;
