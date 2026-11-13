-- Adds masked repeat-reporter insight to the admin snapshot.
-- Only the last four digits of an explicitly provided reporter phone are returned.
-- Raw phone numbers remain available only in the protected reports admin view.

-- Privacy-safe operational intelligence for the ISOKO administrator.
-- This function returns aggregate marketplace facts only. It never exposes
-- reporter phone numbers, report details, national IDs, KYC object keys, or auth secrets.

CREATE OR REPLACE FUNCTION public.admin_control_center_snapshot_v1()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_isoko_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;

  WITH
  seller_summary AS (
    SELECT
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending,
      COUNT(*) FILTER (WHERE status = 'approved')::INTEGER AS approved,
      COUNT(*) FILTER (WHERE status = 'needs_changes')::INTEGER AS needs_changes,
      COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER AS rejected,
      COUNT(*) FILTER (WHERE status = 'suspended')::INTEGER AS suspended
    FROM public.profiles
    WHERE role = 'seller'
  ),
  shop_summary AS (
    SELECT
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending,
      COUNT(*) FILTER (WHERE status = 'approved')::INTEGER AS approved,
      COUNT(*) FILTER (WHERE status = 'needs_changes')::INTEGER AS needs_changes,
      COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER AS rejected,
      COUNT(*) FILTER (WHERE status = 'suspended')::INTEGER AS suspended
    FROM public.shops
  ),
  product_summary AS (
    SELECT
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE status = 'active')::INTEGER AS active,
      COUNT(*) FILTER (WHERE status = 'draft')::INTEGER AS draft,
      COUNT(*) FILTER (WHERE status = 'sold_out')::INTEGER AS sold_out,
      COUNT(*) FILTER (WHERE status = 'hidden')::INTEGER AS hidden,
      COUNT(*) FILTER (WHERE status = 'expired')::INTEGER AS expired
    FROM public.products
  ),
  report_summary AS (
    SELECT
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE status = 'new')::INTEGER AS new,
      COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER AS in_progress,
      COUNT(*) FILTER (WHERE status = 'resolved')::INTEGER AS resolved
    FROM public.reports
  ),
  report_types AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object('type', report_type, 'count', report_count)
        ORDER BY report_count DESC, report_type
      ),
      '[]'::JSONB
    ) AS rows
    FROM (
      SELECT type AS report_type, COUNT(*)::INTEGER AS report_count
      FROM public.reports
      GROUP BY type
      ORDER BY COUNT(*) DESC, type
      LIMIT 10
    ) q
  ),
  repeat_reporters AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'maskedPhone', '••••' || q.phone_last_four,
          'totalReports', q.total_reports,
          'openReports', q.open_reports
        )
        ORDER BY q.total_reports DESC, q.open_reports DESC
      ),
      '[]'::JSONB
    ) AS rows
    FROM (
      SELECT
        RIGHT(REGEXP_REPLACE(reporter_phone, '[^0-9]', '', 'g'), 4) AS phone_last_four,
        COUNT(*)::INTEGER AS total_reports,
        COUNT(*) FILTER (WHERE status IN ('new', 'in_progress'))::INTEGER AS open_reports
      FROM public.reports
      WHERE NULLIF(TRIM(reporter_phone), '') IS NOT NULL
        AND LENGTH(REGEXP_REPLACE(reporter_phone, '[^0-9]', '', 'g')) >= 4
      GROUP BY REGEXP_REPLACE(reporter_phone, '[^0-9]', '', 'g')
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, phone_last_four
      LIMIT 10
    ) q
  ),
  shop_stats AS (
    SELECT
      shop_id,
      SUM(views)::BIGINT AS views,
      SUM(wa_clicks)::BIGINT AS wa_clicks,
      SUM(call_clicks)::BIGINT AS call_clicks,
      SUM(cart_adds)::BIGINT AS cart_adds,
      SUM(shares)::BIGINT AS shares
    FROM public.shop_daily_stats
    WHERE day >= CURRENT_DATE - 29
    GROUP BY shop_id
  ),
  product_stats AS (
    SELECT
      product_id,
      SUM(views)::BIGINT AS views,
      SUM(wa_clicks)::BIGINT AS wa_clicks,
      SUM(call_clicks)::BIGINT AS call_clicks,
      SUM(cart_adds)::BIGINT AS cart_adds,
      SUM(shares)::BIGINT AS shares
    FROM public.product_daily_stats
    WHERE day >= CURRENT_DATE - 29
    GROUP BY product_id
  ),
  daily_stats AS (
    SELECT
      day,
      SUM(views)::BIGINT AS views,
      SUM(wa_clicks)::BIGINT AS wa_clicks,
      SUM(call_clicks)::BIGINT AS call_clicks,
      SUM(cart_adds)::BIGINT AS cart_adds,
      SUM(shares)::BIGINT AS shares
    FROM public.shop_daily_stats
    WHERE day >= CURRENT_DATE - 29
    GROUP BY day
  ),
  days AS (
    SELECT generate_series(CURRENT_DATE - 29, CURRENT_DATE, INTERVAL '1 day')::DATE AS day
  ),
  report_targets AS (
    SELECT s.id AS shop_id,
           COUNT(*)::INTEGER AS total_reports,
           COUNT(*) FILTER (WHERE r.status IN ('new','in_progress'))::INTEGER AS open_reports
    FROM public.reports r
    JOIN public.shops s ON r.target_type = 'shop' AND r.target_id = s.id
    GROUP BY s.id
    UNION ALL
    SELECT p.shop_id,
           COUNT(*)::INTEGER AS total_reports,
           COUNT(*) FILTER (WHERE r.status IN ('new','in_progress'))::INTEGER AS open_reports
    FROM public.reports r
    JOIN public.products p ON r.target_type = 'product' AND r.target_id = p.id
    GROUP BY p.shop_id
  ),
  shop_reports AS (
    SELECT shop_id,
           SUM(total_reports)::INTEGER AS total_reports,
           SUM(open_reports)::INTEGER AS open_reports
    FROM report_targets
    GROUP BY shop_id
  ),
  activity_summary AS (
    SELECT COALESCE(
      jsonb_agg(jsonb_build_object('action', action, 'count', action_count)
                ORDER BY action_count DESC, action),
      '[]'::JSONB
    ) AS rows
    FROM (
      SELECT action, COUNT(*)::INTEGER AS action_count
      FROM public.audit_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY action
      ORDER BY COUNT(*) DESC, action
      LIMIT 12
    ) q
  ),
  top_shops AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'shopId', q.id,
          'shopName', q.name,
          'sellerName', q.full_name,
          'district', q.district_name,
          'status', q.status,
          'views', q.views,
          'waClicks', q.wa_clicks,
          'callClicks', q.call_clicks,
          'cartAdds', q.cart_adds,
          'shares', q.shares,
          'openReports', q.open_reports,
          'totalReports', q.total_reports
        )
        ORDER BY q.wa_clicks DESC, q.views DESC, q.name
      ),
      '[]'::JSONB
    ) AS rows
    FROM (
      SELECT
        s.id, s.name, owner.full_name, s.district_name, s.status,
        COALESCE(st.views, 0) AS views,
        COALESCE(st.wa_clicks, 0) AS wa_clicks,
        COALESCE(st.call_clicks, 0) AS call_clicks,
        COALESCE(st.cart_adds, 0) AS cart_adds,
        COALESCE(st.shares, 0) AS shares,
        COALESCE(sr.open_reports, 0) AS open_reports,
        COALESCE(sr.total_reports, 0) AS total_reports
      FROM public.shops s
      JOIN public.profiles owner ON owner.id = s.owner_id
      LEFT JOIN shop_stats st ON st.shop_id = s.id
      LEFT JOIN shop_reports sr ON sr.shop_id = s.id
      WHERE s.status = 'approved'
      ORDER BY COALESCE(st.wa_clicks, 0) DESC,
               COALESCE(st.views, 0) DESC,
               s.name
      LIMIT 10
    ) q
  ),
  risk_shops AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'shopId', q.id,
          'shopName', q.name,
          'sellerName', q.full_name,
          'district', q.district_name,
          'shopStatus', q.status,
          'openReports', q.open_reports,
          'totalReports', q.total_reports
        )
        ORDER BY q.open_reports DESC, q.total_reports DESC, q.name
      ),
      '[]'::JSONB
    ) AS rows
    FROM (
      SELECT s.id, s.name, owner.full_name, s.district_name, s.status,
             sr.open_reports, sr.total_reports
      FROM shop_reports sr
      JOIN public.shops s ON s.id = sr.shop_id
      JOIN public.profiles owner ON owner.id = s.owner_id
      WHERE sr.total_reports > 0
      ORDER BY sr.open_reports DESC, sr.total_reports DESC, s.name
      LIMIT 10
    ) q
  ),
  top_products AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'productId', q.id,
          'productName', q.name,
          'shopName', q.shop_name,
          'district', q.district_name,
          'status', q.status,
          'views', q.views,
          'waClicks', q.wa_clicks,
          'cartAdds', q.cart_adds
        )
        ORDER BY q.wa_clicks DESC, q.views DESC, q.name
      ),
      '[]'::JSONB
    ) AS rows
    FROM (
      SELECT
        p.id, p.name, s.name AS shop_name, s.district_name, p.status,
        COALESCE(ps.views, 0) AS views,
        COALESCE(ps.wa_clicks, 0) AS wa_clicks,
        COALESCE(ps.cart_adds, 0) AS cart_adds
      FROM public.products p
      JOIN public.shops s ON s.id = p.shop_id
      LEFT JOIN product_stats ps ON ps.product_id = p.id
      WHERE p.status = 'active' AND s.status = 'approved'
      ORDER BY COALESCE(ps.wa_clicks, 0) DESC,
               COALESCE(ps.views, 0) DESC,
               p.name
      LIMIT 10
    ) q
  ),
  campaign_summary AS (
    SELECT
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE active)::INTEGER AS active,
      COALESCE(SUM(impressions), 0)::BIGINT AS impressions,
      COALESCE(SUM(clicks), 0)::BIGINT AS clicks
    FROM public.campaigns
  ),
  data_coverage AS (
    SELECT
      (SELECT COUNT(*) FROM public.profiles WHERE role = 'seller')::INTEGER AS sellers,
      (SELECT COUNT(*) FROM public.shops)::INTEGER AS shops,
      (SELECT COUNT(*) FROM public.products)::INTEGER AS products,
      (SELECT COUNT(*) FROM public.reports)::INTEGER AS reports,
      (SELECT COUNT(*) FROM public.shop_daily_stats WHERE day >= CURRENT_DATE - 29)::INTEGER AS shop_stat_days,
      (SELECT COUNT(*) FROM public.audit_log)::INTEGER AS audit_entries
  )
  SELECT jsonb_build_object(
    'generatedAt', NOW(),
    'periodDays', 30,
    'sellers', (SELECT to_jsonb(seller_summary) FROM seller_summary),
    'shops', (SELECT to_jsonb(shop_summary) FROM shop_summary),
    'products', (SELECT to_jsonb(product_summary) FROM product_summary),
    'reports', (SELECT to_jsonb(report_summary) FROM report_summary),
    'reportsByType', (SELECT rows FROM report_types),
    'frequentReporters', (SELECT rows FROM repeat_reporters),
    'traffic', jsonb_build_object(
      'views', COALESCE((SELECT SUM(views) FROM daily_stats), 0),
      'waClicks', COALESCE((SELECT SUM(wa_clicks) FROM daily_stats), 0),
      'callClicks', COALESCE((SELECT SUM(call_clicks) FROM daily_stats), 0),
      'cartAdds', COALESCE((SELECT SUM(cart_adds) FROM daily_stats), 0),
      'shares', COALESCE((SELECT SUM(shares) FROM daily_stats), 0)
    ),
    'daily', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'day', to_char(days.day, 'YYYY-MM-DD'),
            'views', COALESCE(daily_stats.views, 0),
            'waClicks', COALESCE(daily_stats.wa_clicks, 0),
            'cartAdds', COALESCE(daily_stats.cart_adds, 0)
          )
          ORDER BY days.day
        ),
        '[]'::JSONB
      )
      FROM days
      LEFT JOIN daily_stats ON daily_stats.day = days.day
    ),
    'topShops', (SELECT rows FROM top_shops),
    'riskShops', (SELECT rows FROM risk_shops),
    'topProducts', (SELECT rows FROM top_products),
    'activityByAction', (SELECT rows FROM activity_summary),
    'campaigns', (SELECT to_jsonb(campaign_summary) FROM campaign_summary),
    'coverage', (SELECT to_jsonb(data_coverage) FROM data_coverage)
  )
  INTO v_result;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_control_center_snapshot_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_control_center_snapshot_v1() FROM anonymous;
GRANT EXECUTE ON FUNCTION public.admin_control_center_snapshot_v1() TO authenticated;
