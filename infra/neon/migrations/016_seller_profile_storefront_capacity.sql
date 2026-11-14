-- Free seller catalogue supports at least 200 products; current launch cap is 500.
ALTER TABLE public.shops ALTER COLUMN product_limit SET DEFAULT 500;
UPDATE public.shops SET product_limit=500 WHERE product_limit<500;
UPDATE public.settings SET value=to_jsonb(500) WHERE key='DEFAULT_PRODUCT_LIMIT';
INSERT INTO public.schema_migrations(version) VALUES ('016_seller_profile_storefront_capacity') ON CONFLICT (version) DO NOTHING;
