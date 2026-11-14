-- ISOKO Phase 1: minimal seller account + store creation.
-- Email/password identifies the account. WhatsApp is the seller contact number.
-- Identity/KYC is a separate, optional later profile-completion step.
-- No national ID, TIN, selfie or KYC image is collected by this flow.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS identity_status TEXT NOT NULL DEFAULT 'unverified';

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_identity_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_identity_status_check
      CHECK (identity_status IN ('unverified','pending','verified','rejected'));
  END IF;
END;
$constraint$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_unique
  ON public.profiles (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0;

CREATE OR REPLACE FUNCTION public.register_basic_seller_v1(
  p_shop_name TEXT,
  p_phone TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_terms_accepted BOOLEAN DEFAULT FALSE,
  p_terms_version TEXT DEFAULT '1.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, neon_auth
AS $function$
DECLARE
  v_auth_user_id TEXT := auth.user_id()::text;
  v_email TEXT;
  v_auth_name TEXT;
  v_email_verified BOOLEAN := FALSE;
  v_seller_id TEXT;
  v_shop_id TEXT;
  v_slug TEXT;
  v_profile JSONB;
  v_shop JSONB;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;

  IF COALESCE(p_terms_accepted, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'TERMS_REQUIRED' USING ERRCODE = '22023';
  END IF;

  IF p_phone !~ '^2507[0-9]{8}$' THEN
    RAISE EXCEPTION 'RWANDA_PHONE_INVALID' USING ERRCODE = '22023';
  END IF;

  IF p_shop_name IS NULL OR length(trim(p_shop_name)) < 2 THEN
    RAISE EXCEPTION 'SHOP_NAME_REQUIRED' USING ERRCODE = '22023';
  END IF;

  SELECT u.email, u.name, u."emailVerified"
    INTO v_email, v_auth_name, v_email_verified
  FROM neon_auth."user" u
  WHERE u.id = v_auth_user_id::uuid;

  IF NOT FOUND OR v_email IS NULL OR length(trim(v_email)) < 5 THEN
    RAISE EXCEPTION 'ACCOUNT_EMAIL_REQUIRED' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = v_auth_user_id OR p.phone = p_phone
  ) THEN
    RAISE EXCEPTION 'ACCOUNT_ALREADY_REGISTERED' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE lower(p.email) = lower(v_email)
  ) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_REGISTERED' USING ERRCODE = '23505';
  END IF;

  v_seller_id := 'prof-seller-' || replace(gen_random_uuid()::text, '-', '');
  v_shop_id := 'shop-' || replace(gen_random_uuid()::text, '-', '');
  v_slug := left(
    trim(both '-' from regexp_replace(lower(trim(p_shop_name)), '[^a-z0-9]+', '-', 'g')),
    24
  );
  IF v_slug = '' THEN
    v_slug := 'iduka';
  END IF;
  IF EXISTS (SELECT 1 FROM public.shops s WHERE s.slug = v_slug) THEN
    v_slug := left(v_slug, 18) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;

  -- The profiles trigger consumes the authenticated 24-hour registration draft
  -- created by start_seller_registration_v1 before this function is called.
  INSERT INTO public.profiles (
    id, auth_user_id, role, full_name, phone, whatsapp, email, email_verified,
    identity_status, status, status_reason, approved_by, approved_at,
    terms_version, terms_accepted_at, created_at, password_hash
  ) VALUES (
    v_seller_id, v_auth_user_id, 'seller',
    COALESCE(NULLIF(trim(p_full_name), ''), NULLIF(trim(v_auth_name), ''), left(trim(p_shop_name), 120)),
    p_phone, p_phone, lower(trim(v_email)), COALESCE(v_email_verified, FALSE),
    'unverified', 'approved', NULL, NULL, now(),
    COALESCE(p_terms_version, '1.0'), now(), now(), NULL
  );

  INSERT INTO public.shops (
    id, owner_id, slug, name, logo_key, cover_key, about, whatsapp, phone,
    district_id, sector_id, district_name, sector_name, landmark, hours_text,
    delivery_text, product_limit, plan, plan_expires_at, status, created_at
  ) VALUES (
    v_shop_id, v_seller_id, v_slug, left(trim(p_shop_name), 40),
    NULL, NULL, '', p_phone, p_phone,
    NULL, NULL, 'Ntiharashyirwaho', NULL, '', '', '',
    COALESCE((
      SELECT (value #>> '{}')::INTEGER
      FROM public.settings WHERE key = 'DEFAULT_PRODUCT_LIMIT'
    ), 150),
    'free', NULL, 'approved', now()
  );

  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, details, created_at
  ) VALUES (
    'audit-' || replace(gen_random_uuid()::text, '-', ''),
    v_seller_id,
    COALESCE(NULLIF(trim(p_full_name), ''), NULLIF(trim(v_auth_name), ''), left(trim(p_shop_name), 120)),
    'seller_registered_basic',
    'seller',
    v_seller_id,
    jsonb_build_object(
      'shop_id', v_shop_id,
      'identity_status', 'unverified',
      'email_verified', COALESCE(v_email_verified, FALSE)
    ),
    now()
  );

  SELECT to_jsonb(p) - 'password_hash' - 'auth_user_id'
    INTO v_profile
  FROM public.profiles p WHERE p.id = v_seller_id;

  SELECT to_jsonb(s)
    INTO v_shop
  FROM public.v_public_shops s
  WHERE s.id = v_shop_id;

  RETURN jsonb_build_object('profile', v_profile, 'shop', v_shop);
END;
$function$;

REVOKE ALL ON FUNCTION public.register_basic_seller_v1(text,text,text,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_basic_seller_v1(text,text,text,boolean,text) TO authenticated;

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
   WHERE pr.shop_id = s.id AND pr.status = 'active') AS active_product_count,
  p.identity_status
FROM public.shops s
JOIN public.profiles p ON p.id = s.owner_id
WHERE p.status = 'approved';


INSERT INTO public.schema_migrations(version)
VALUES ('013_basic_seller_onboarding')
ON CONFLICT (version) DO NOTHING;
