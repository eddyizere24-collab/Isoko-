-- ISOKO migration 019: server-enforced daily upload-attempt quota per seller.
-- Additive only. No existing profiles, shops, or image objects are rewritten.
-- Storage uploads must be authenticated and the RPC derives seller identity from Neon Auth.
-- Limit: 30 accepted upload attempts per seller per UTC calendar day.

CREATE TABLE IF NOT EXISTS public.seller_upload_daily_usage (
  seller_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upload_day date NOT NULL,
  upload_count integer NOT NULL DEFAULT 0 CHECK (upload_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, upload_day)
);

ALTER TABLE public.seller_upload_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.seller_upload_daily_usage FROM PUBLIC, anonymous, authenticated;

CREATE OR REPLACE FUNCTION public.consume_seller_upload_quota_v1()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id()::text;
  v_seller_id text;
  v_upload_day date := (now() AT TIME ZONE 'UTC')::date;
  v_count integer;
  v_limit constant integer := 30;
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id = '' THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT p.id
    INTO v_seller_id
    FROM public.profiles p
   WHERE p.auth_user_id = v_auth_user_id
     AND p.role = 'seller'
     AND p.status NOT IN ('rejected', 'suspended')
   LIMIT 1;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'SELLER_PROFILE_NOT_FOUND' USING ERRCODE = '42501';
  END IF;

  -- Counters are attempts, not successful object writes, so repeated failed uploads
  -- cannot be used to bypass the daily server-side abuse limit.
  DELETE FROM public.seller_upload_daily_usage
   WHERE upload_day < v_upload_day - 30;

  INSERT INTO public.seller_upload_daily_usage (seller_id, upload_day, upload_count)
  VALUES (v_seller_id, v_upload_day, 1)
  ON CONFLICT (seller_id, upload_day) DO UPDATE
    SET upload_count = LEAST(public.seller_upload_daily_usage.upload_count + 1, v_limit + 1),
        updated_at = now()
  RETURNING upload_count INTO v_count;

  RETURN jsonb_build_object(
    'allowed', v_count <= v_limit,
    'count', v_count,
    'limit', v_limit,
    'upload_day_utc', v_upload_day
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_seller_upload_quota_v1() FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.consume_seller_upload_quota_v1() TO authenticated;

INSERT INTO public.schema_migrations(version)
VALUES ('019_seller_upload_daily_quota')
ON CONFLICT (version) DO NOTHING;
