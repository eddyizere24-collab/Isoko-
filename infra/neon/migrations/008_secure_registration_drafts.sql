-- Secure short-lived seller registration drafts, so first-time sellers can
-- upload private KYC files before their public seller profile is created.

CREATE TABLE IF NOT EXISTS private.seller_registration_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

REVOKE ALL ON private.seller_registration_drafts FROM PUBLIC;
REVOKE ALL ON private.seller_registration_drafts FROM anonymous;
REVOKE ALL ON private.seller_registration_drafts FROM authenticated;

CREATE OR REPLACE FUNCTION public.start_seller_registration_v1(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_user_id TEXT := auth.user_id()::text;
  v_draft_id UUID;
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000';
  END IF;
  IF p_phone !~ '^2507[0-9]{8}$' THEN
    RAISE EXCEPTION 'RWANDA_PHONE_INVALID' USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id=v_user_id) THEN
    RAISE EXCEPTION 'ACCOUNT_ALREADY_REGISTERED' USING ERRCODE='23505';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone=p_phone) THEN
    RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED' USING ERRCODE='23505';
  END IF;

  INSERT INTO private.seller_registration_drafts(auth_user_id,phone,created_at,expires_at)
  VALUES (v_user_id,p_phone,NOW(),NOW()+INTERVAL '24 hours')
  ON CONFLICT(auth_user_id) DO UPDATE SET
    phone=EXCLUDED.phone,created_at=NOW(),expires_at=NOW()+INTERVAL '24 hours'
  RETURNING id INTO v_draft_id;

  RETURN jsonb_build_object('draft_id',v_draft_id,'expires_in_seconds',86400);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_own_seller_registration_draft_v1()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_draft private.seller_registration_drafts%ROWTYPE;
BEGIN
  IF auth.user_id() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000';
  END IF;
  SELECT * INTO v_draft FROM private.seller_registration_drafts
  WHERE auth_user_id=auth.user_id()::text AND expires_at>NOW();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_DRAFT_NOT_FOUND' USING ERRCODE='P0002';
  END IF;
  RETURN jsonb_build_object('draft_id',v_draft.id,'expires_at',v_draft.expires_at);
END;
$function$;

CREATE OR REPLACE FUNCTION private.consume_seller_registration_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE v_draft_id UUID;
BEGIN
  IF NEW.role='seller' THEN
    DELETE FROM private.seller_registration_drafts
    WHERE auth_user_id=NEW.auth_user_id AND expires_at>NOW()
    RETURNING id INTO v_draft_id;
    IF v_draft_id IS NULL THEN
      RAISE EXCEPTION 'SELLER_REGISTRATION_DRAFT_REQUIRED' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_require_registration_draft ON public.profiles;
CREATE TRIGGER profiles_require_registration_draft
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.consume_seller_registration_draft();

REVOKE ALL ON FUNCTION public.start_seller_registration_v1(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_own_seller_registration_draft_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_seller_registration_v1(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_seller_registration_draft_v1() TO authenticated;
