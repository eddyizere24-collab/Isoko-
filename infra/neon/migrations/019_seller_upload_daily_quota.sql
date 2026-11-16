-- ISOKO migration 019: per-seller daily quota for public image uploads.
-- Additive. The upload Function calls this RPC before storing seller images.
-- Apply to Production only after owner approval in docs/ops/PRODUCTION_STEPS.md.

CREATE TABLE IF NOT EXISTS public.seller_upload_daily_usage (
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_day date NOT NULL DEFAULT CURRENT_DATE,
  upload_count integer NOT NULL DEFAULT 0 CHECK (upload_count >= 0 AND upload_count <= 30),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, usage_day)
);

ALTER TABLE public.seller_upload_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_upload_daily_usage FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_seller_upload_quota_v1()
RETURNS TABLE (allowed boolean, used integer, daily_limit integer, resets_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_seller_id uuid; v_used integer; v_daily_limit CONSTANT integer := 30;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  SELECT p.id INTO v_seller_id FROM public.profiles p
   WHERE p.auth_user_id = auth.uid() AND p.role = 'seller'
     AND p.status NOT IN ('rejected', 'suspended') LIMIT 1;
  IF v_seller_id IS NULL THEN RAISE EXCEPTION 'SELLER_PROFILE_NOT_FOUND'; END IF;
  INSERT INTO public.seller_upload_daily_usage (seller_id, usage_day, upload_count)
  VALUES (v_seller_id, CURRENT_DATE, 1)
  ON CONFLICT (seller_id, usage_day)
  DO UPDATE SET upload_count = public.seller_upload_daily_usage.upload_count + 1, updated_at = now()
  WHERE public.seller_upload_daily_usage.upload_count < v_daily_limit
  RETURNING upload_count INTO v_used;
  IF v_used IS NULL THEN
    RETURN QUERY SELECT false, v_daily_limit, v_daily_limit, date_trunc('day', now()) + interval '1 day';
  ELSE
    RETURN QUERY SELECT true, v_used, v_daily_limit, date_trunc('day', now()) + interval '1 day';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_seller_upload_quota_v1() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_seller_upload_quota_v1() TO authenticated;
INSERT INTO public.schema_migrations(version) VALUES ('019_seller_upload_daily_quota') ON CONFLICT (version) DO NOTHING;
