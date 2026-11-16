-- ISOKO migration 023: add a trusted per-seller upload burst limit.
-- The identity comes from Neon Auth, not a browser-supplied seller ID or session ID.
-- This supplements the 30-attempt UTC daily quota with a 15-attempt rolling 60-second window.

ALTER TABLE public.seller_upload_daily_usage
  ADD COLUMN IF NOT EXISTS window_started_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.seller_upload_daily_usage
  ADD COLUMN IF NOT EXISTS window_count integer NOT NULL DEFAULT 0
  CHECK (window_count >= 0);

CREATE OR REPLACE FUNCTION public.consume_seller_upload_quota_v1()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_auth_user_id text := auth.user_id()::text;
  v_seller_id text;
  v_now timestamptz := clock_timestamp();
  v_upload_day date := (v_now AT TIME ZONE 'UTC')::date;
  v_daily_count integer;
  v_window_count integer;
  v_window_started_at timestamptz;
  v_daily_limit constant integer := 30;
  v_window_limit constant integer := 15;
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

  INSERT INTO public.seller_upload_daily_usage (
    seller_id, upload_day, upload_count, window_started_at, window_count
  )
  VALUES (v_seller_id, v_upload_day, 1, v_now, 1)
  ON CONFLICT (seller_id, upload_day) DO UPDATE
    SET upload_count = LEAST(
          public.seller_upload_daily_usage.upload_count + 1,
          v_daily_limit + 1
        ),
        window_count = CASE
          WHEN public.seller_upload_daily_usage.window_started_at <= v_now - interval '60 seconds'
            THEN 1
          ELSE LEAST(public.seller_upload_daily_usage.window_count + 1, v_window_limit + 1)
        END,
        window_started_at = CASE
          WHEN public.seller_upload_daily_usage.window_started_at <= v_now - interval '60 seconds'
            THEN v_now
          ELSE public.seller_upload_daily_usage.window_started_at
        END,
        updated_at = v_now
  RETURNING upload_count, window_count, window_started_at
       INTO v_daily_count, v_window_count, v_window_started_at;

  RETURN jsonb_build_object(
    'allowed', v_daily_count <= v_daily_limit AND v_window_count <= v_window_limit,
    'count', v_daily_count,
    'limit', v_daily_limit,
    'window_count', v_window_count,
    'window_limit', v_window_limit,
    'reason', CASE
      WHEN v_daily_count > v_daily_limit THEN 'daily'
      WHEN v_window_count > v_window_limit THEN 'rate'
      ELSE NULL
    END,
    'retry_after_seconds', CASE
      WHEN v_window_count > v_window_limit
        THEN GREATEST(
          1,
          CEIL(EXTRACT(EPOCH FROM (v_window_started_at + interval '60 seconds' - v_now)))::integer
        )
      ELSE NULL
    END,
    'upload_day_utc', v_upload_day
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_seller_upload_quota_v1() FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.consume_seller_upload_quota_v1() TO authenticated;

INSERT INTO public.schema_migrations(version)
VALUES ('023_seller_upload_burst_limit')
ON CONFLICT (version) DO NOTHING;
