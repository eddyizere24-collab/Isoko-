-- ISOKO migration 020: align any already-created QA/Production quota RPC to the 30-attempt policy.
-- This is a forward-only function replacement; it does not rewrite quota history or seller data.
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
VALUES ('020_seller_upload_quota_cap_alignment')
ON CONFLICT (version) DO NOTHING;
