-- ISOKO migration 018: abuse controls and bounded cleanup for public RPC tables.
-- Additive and idempotent. Does not change existing RLS/grants or product writes.
--
-- Rate limit scope: 30 subscribe/update attempts per hour per SHA-256(kind + stable browser/contact identifier).
-- Shop follows use a persistent, per-browser anonymous identifier, not a shared shop ID.
-- This does not claim IP-level protection: browser-callable Neon RPCs do not expose
-- a trustworthy client IP here. A future edge proxy/Turnstile integration can add it.
--
-- Cleanup runs opportunistically at most once per hour when report, subscription,
-- or marketplace-event RPCs are called. It removes only abuse-control/dedup rows
-- older than two days; it does not delete reports, subscriber records, analytics,
-- shop data, or customer data.
--
-- Rollback:
-- 1. Restore create_public_report_v1 and track_marketplace_event_v1 from
--    005_marketplace_rpc.sql.
-- 2. Restore subscribe_updates_v1 from 007_final_privileges_and_admin_policies.sql.
-- 3. DROP FUNCTION public.cleanup_isoko_abuse_data_v1();
-- 4. DROP TABLE public.subscription_rate;
-- 5. DROP TABLE public.isoko_maintenance_state;
-- No existing customer or marketplace rows need to be restored.

CREATE TABLE IF NOT EXISTS public.isoko_maintenance_state (
  maintenance_key TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT '-infinity'
);

INSERT INTO public.isoko_maintenance_state (maintenance_key)
VALUES ('abuse_cleanup')
ON CONFLICT (maintenance_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.subscription_rate (
  rate_key TEXT PRIMARY KEY,
  rate_count INTEGER NOT NULL DEFAULT 0 CHECK (rate_count >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_rate_updated_idx
  ON public.subscription_rate(updated_at);

-- These tables are internal implementation details, not client-readable tables.
REVOKE ALL ON TABLE public.isoko_maintenance_state FROM PUBLIC, anonymous, authenticated;
REVOKE ALL ON TABLE public.subscription_rate FROM PUBLIC, anonymous, authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_isoko_abuse_data_v1()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_last_run TIMESTAMPTZ;
  v_events INTEGER := 0;
  v_reports INTEGER := 0;
  v_subscriptions INTEGER := 0;
BEGIN
  -- Avoid making high-volume public event traffic contend on the cleanup tables.
  IF NOT pg_try_advisory_xact_lock(1814418018::BIGINT) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;

  INSERT INTO public.isoko_maintenance_state (maintenance_key)
  VALUES ('abuse_cleanup')
  ON CONFLICT (maintenance_key) DO NOTHING;

  SELECT last_run_at INTO v_last_run
  FROM public.isoko_maintenance_state
  WHERE maintenance_key = 'abuse_cleanup'
  FOR UPDATE;

  IF v_last_run > NOW() - INTERVAL '1 hour' THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;

  DELETE FROM public.event_dedup
  WHERE created_at < NOW() - INTERVAL '2 days';
  GET DIAGNOSTICS v_events = ROW_COUNT;

  DELETE FROM public.report_rate
  WHERE updated_at < NOW() - INTERVAL '2 days';
  GET DIAGNOSTICS v_reports = ROW_COUNT;

  DELETE FROM public.subscription_rate
  WHERE updated_at < NOW() - INTERVAL '2 days';
  GET DIAGNOSTICS v_subscriptions = ROW_COUNT;

  UPDATE public.isoko_maintenance_state
  SET last_run_at = NOW()
  WHERE maintenance_key = 'abuse_cleanup';

  RETURN jsonb_build_object(
    'ok', true,
    'event_dedup_deleted', v_events,
    'report_rate_deleted', v_reports,
    'subscription_rate_deleted', v_subscriptions
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.cleanup_isoko_abuse_data_v1() FROM PUBLIC, anonymous, authenticated;

CREATE OR REPLACE FUNCTION public.create_public_report_v1(
  p_target_type TEXT,p_target_id TEXT,p_type TEXT,p_details TEXT,
  p_reporter_phone TEXT DEFAULT NULL,p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_id TEXT := 'report-' || replace(gen_random_uuid()::text,'-','');
  v_key TEXT;
  v_count INTEGER;
  v_name TEXT;
BEGIN
  IF p_target_type NOT IN ('product','shop') THEN
    RAISE EXCEPTION 'REPORT_TARGET_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_type NOT IN ('counterfeit','fake_price','fake_photo','scam','prohibited','other') THEN
    RAISE EXCEPTION 'REPORT_TYPE_INVALID' USING ERRCODE='22023';
  END IF;
  IF length(trim(COALESCE(p_details,''))) < 5 OR length(p_details) > 1200 THEN
    RAISE EXCEPTION 'REPORT_DETAILS_INVALID' USING ERRCODE='22023';
  END IF;

  IF p_target_type='product' THEN
    SELECT name INTO v_name FROM public.products WHERE id=p_target_id;
  ELSE
    SELECT name INTO v_name FROM public.shops WHERE id=p_target_id;
  END IF;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'REPORT_TARGET_NOT_FOUND' USING ERRCODE='P0002';
  END IF;

  PERFORM public.cleanup_isoko_abuse_data_v1();

  v_key := encode(digest(COALESCE(p_session_id,'anonymous') || '|' || p_target_id,'sha256'),'hex');
  INSERT INTO public.report_rate(rate_key,rate_count,updated_at)
  VALUES(v_key,1,NOW())
  ON CONFLICT(rate_key) DO UPDATE
    SET rate_count=CASE
          WHEN public.report_rate.updated_at < NOW()-INTERVAL '1 hour' THEN 1
          ELSE public.report_rate.rate_count+1
        END,
        updated_at=NOW();
  SELECT rate_count INTO v_count FROM public.report_rate WHERE rate_key=v_key;
  IF v_count > 3 THEN
    RAISE EXCEPTION 'REPORT_RATE_LIMIT' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.reports(id,target_type,target_id,target_name,type,details,reporter_phone,session_hash,status)
  VALUES(v_id,p_target_type,p_target_id,v_name,p_type,trim(p_details),NULLIF(p_reporter_phone,''),v_key,'new');

  RETURN jsonb_build_object('id',v_id,'status','new');
END;
$function$;

CREATE OR REPLACE FUNCTION public.subscribe_updates_v1(
  p_kind TEXT,p_external_id TEXT,p_district_id INTEGER DEFAULT NULL,
  p_top_category_id INTEGER DEFAULT NULL,p_shop_id TEXT DEFAULT NULL,
  p_unsubscribe BOOLEAN DEFAULT FALSE,p_consent_version TEXT DEFAULT '1.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_id TEXT;
  v_rate_key TEXT;
  v_rate_count INTEGER;
BEGIN
  IF p_kind NOT IN ('push','email','shop_follow') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_KIND_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_external_id IS NULL OR length(trim(p_external_id)) < 3 OR length(p_external_id) > 500 THEN
    RAISE EXCEPTION 'SUBSCRIPTION_ID_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_kind='shop_follow' AND NOT EXISTS(
    SELECT 1 FROM public.shops s JOIN public.profiles p ON p.id=s.owner_id
    WHERE s.id=p_shop_id AND p.status='approved'
  ) THEN
    RAISE EXCEPTION 'SHOP_NOT_FOUND' USING ERRCODE='P0002';
  END IF;

  PERFORM public.cleanup_isoko_abuse_data_v1();

  IF p_unsubscribe THEN
    UPDATE public.subscribers SET unsubscribed_at=NOW()
    WHERE kind=p_kind AND external_id=trim(p_external_id)
      AND shop_id IS NOT DISTINCT FROM p_shop_id;
    RETURN jsonb_build_object('ok',true,'unsubscribed',true);
  END IF;

  v_rate_key := encode(digest(p_kind || '|' || trim(p_external_id),'sha256'),'hex');
  INSERT INTO public.subscription_rate(rate_key,rate_count,window_started_at,updated_at)
  VALUES(v_rate_key,1,NOW(),NOW())
  ON CONFLICT(rate_key) DO UPDATE SET
    rate_count=CASE
      WHEN public.subscription_rate.window_started_at <= NOW()-INTERVAL '1 hour' THEN 1
      ELSE public.subscription_rate.rate_count+1
    END,
    window_started_at=CASE
      WHEN public.subscription_rate.window_started_at <= NOW()-INTERVAL '1 hour' THEN NOW()
      ELSE public.subscription_rate.window_started_at
    END,
    updated_at=NOW()
  RETURNING rate_count INTO v_rate_count;

  IF v_rate_count > 30 THEN
    RAISE EXCEPTION 'SUBSCRIPTION_RATE_LIMIT' USING ERRCODE='22023';
  END IF;

  -- The existing subscribers table intentionally has no UNIQUE constraint.
  -- The rate-key upsert above serializes requests from the same kind/external ID,
  -- so use an owner-scoped SELECT/UPDATE instead of an invalid ON CONFLICT target.
  SELECT s.id INTO v_id
  FROM public.subscribers s
  WHERE s.kind=p_kind
    AND s.external_id=trim(p_external_id)
    AND s.shop_id IS NOT DISTINCT FROM p_shop_id
  ORDER BY s.consent_at DESC, s.id DESC
  LIMIT 1
  FOR UPDATE;

  IF v_id IS NULL THEN
    INSERT INTO public.subscribers(
      id,kind,external_id,district_id,top_category_id,shop_id,consent_at,consent_version,unsubscribed_at
    ) VALUES (
      'sub-' || replace(gen_random_uuid()::text,'-',''),p_kind,trim(p_external_id),
      p_district_id,p_top_category_id,p_shop_id,NOW(),COALESCE(p_consent_version,'1.0'),NULL
    )
    RETURNING id INTO v_id;
  ELSE
    -- Keep one active row for this browser/contact+shop key. Older duplicate rows
    -- are retained for audit history, but are marked unsubscribed, not deleted.
    UPDATE public.subscribers
    SET
      district_id=p_district_id,
      top_category_id=p_top_category_id,
      consent_at=CASE WHEN id=v_id THEN NOW() ELSE consent_at END,
      consent_version=CASE WHEN id=v_id THEN COALESCE(p_consent_version,'1.0') ELSE consent_version END,
      unsubscribed_at=CASE WHEN id=v_id THEN NULL ELSE COALESCE(unsubscribed_at,NOW()) END
    WHERE kind=p_kind
      AND external_id=trim(p_external_id)
      AND shop_id IS NOT DISTINCT FROM p_shop_id;
  END IF;

  RETURN jsonb_build_object('ok',true,'id',v_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_marketplace_event_v1(
  p_type TEXT,p_product_id TEXT DEFAULT NULL,p_shop_id TEXT DEFAULT NULL,p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_dedupe TEXT;
BEGIN
  IF p_type NOT IN ('view','wa_click','call_click','cart_add','share') THEN
    RAISE EXCEPTION 'EVENT_TYPE_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_product_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.products WHERE id=p_product_id) THEN
    RETURN jsonb_build_object('ok',true,'ignored',true);
  END IF;

  PERFORM public.cleanup_isoko_abuse_data_v1();

  v_dedupe := encode(digest(COALESCE(p_session_id,'anonymous')||'|'||p_type||'|'||
    COALESCE(p_product_id,'')||'|'||COALESCE(p_shop_id,'')||'|'||v_day::text,'sha256'),'hex');
  INSERT INTO public.event_dedup(dedup_key) VALUES(v_dedupe) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',true,'duplicate',true);
  END IF;

  IF p_product_id IS NOT NULL THEN
    INSERT INTO public.product_daily_stats(product_id,day,views,wa_clicks,call_clicks,cart_adds,shares)
    VALUES(
      p_product_id,v_day,
      CASE WHEN p_type='view' THEN 1 ELSE 0 END,
      CASE WHEN p_type='wa_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='call_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='cart_add' THEN 1 ELSE 0 END,
      CASE WHEN p_type='share' THEN 1 ELSE 0 END
    )
    ON CONFLICT(product_id,day) DO UPDATE SET
      views=public.product_daily_stats.views+EXCLUDED.views,
      wa_clicks=public.product_daily_stats.wa_clicks+EXCLUDED.wa_clicks,
      call_clicks=public.product_daily_stats.call_clicks+EXCLUDED.call_clicks,
      cart_adds=public.product_daily_stats.cart_adds+EXCLUDED.cart_adds,
      shares=public.product_daily_stats.shares+EXCLUDED.shares;
  END IF;

  IF p_shop_id IS NOT NULL THEN
    INSERT INTO public.shop_daily_stats(shop_id,day,views,wa_clicks,call_clicks,cart_adds,shares)
    VALUES(
      p_shop_id,v_day,
      CASE WHEN p_type='view' THEN 1 ELSE 0 END,
      CASE WHEN p_type='wa_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='call_click' THEN 1 ELSE 0 END,
      CASE WHEN p_type='cart_add' THEN 1 ELSE 0 END,
      CASE WHEN p_type='share' THEN 1 ELSE 0 END
    )
    ON CONFLICT(shop_id,day) DO UPDATE SET
      views=public.shop_daily_stats.views+EXCLUDED.views,
      wa_clicks=public.shop_daily_stats.wa_clicks+EXCLUDED.wa_clicks,
      call_clicks=public.shop_daily_stats.call_clicks+EXCLUDED.call_clicks,
      cart_adds=public.shop_daily_stats.cart_adds+EXCLUDED.cart_adds,
      shares=public.shop_daily_stats.shares+EXCLUDED.shares;
  END IF;

  RETURN jsonb_build_object('ok',true);
END;
$function$;

INSERT INTO public.schema_migrations(version)
VALUES ('018_abuse_hardening')
ON CONFLICT (version) DO NOTHING;
