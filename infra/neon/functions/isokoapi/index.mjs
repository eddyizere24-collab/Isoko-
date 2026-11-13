import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the ISOKO Neon Function");
}

const sql = neon(DATABASE_URL);
const PUBLIC_BUCKET = "isoko-public-assets";

function json(body, status = 200, cache = "no-store") {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": cache,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

function assetUrl(key) {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;

  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!endpoint) return key;

  const safeKey = String(key)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return endpoint.replace(/\/$/, "") + "/" + PUBLIC_BUCKET + "/" + safeKey;
}

function mapShop(row) {
  if (!row) return null;
  return {
    id: row.id,
    owner_id: row.owner_id,
    slug: row.slug,
    name: row.name,
    logo_path: assetUrl(row.logo_key),
    cover_path: assetUrl(row.cover_key),
    about: row.about,
    whatsapp: row.whatsapp,
    phone: row.phone,
    district_id: row.district_id,
    sector_id: row.sector_id,
    district_name: row.district_name,
    sector_name: row.sector_name,
    landmark: row.landmark,
    hours_text: row.hours_text,
    delivery_text: row.delivery_text,
    product_limit: row.product_limit,
    plan: row.plan,
    plan_expires_at: row.plan_expires_at,
    created_at: row.created_at,
    approved_at: row.approved_at ?? row.created_at,
    status: row.owner_status ?? row.status,
    active_product_count: Number(row.active_product_count ?? 0),
  };
}

function mapProduct(row) {
  if (!row) return null;
  const shop = row.shop ? mapShop(row.shop) : undefined;
  const category = row.category ?? undefined;
  const parentCategory = row.parent_category ?? undefined;

  return {
    id: row.id,
    shop_id: row.shop_id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    old_price: row.old_price === null ? null : Number(row.old_price),
    condition: row.condition,
    brand: row.brand,
    authentic: row.authentic,
    colors: row.colors ?? [],
    status: row.status,
    hidden_reason: row.hidden_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_confirmed_at: row.last_confirmed_at,
    sold_out_at: row.sold_out_at,
    images: (row.images ?? []).map((image) => ({
      ...image,
      path_full: assetUrl(image.path_full),
      path_thumb: assetUrl(image.path_thumb),
    })),
    variants: row.variants ?? [],
    ...(shop ? { shop } : {}),
    ...(category ? { category } : {}),
    ...(parentCategory ? { parent_category: parentCategory } : {}),
    popularity_7d: Number(row.popularity_7d ?? 0),
    views_7d: Number(row.views_7d ?? 0),
    wa_clicks_7d: Number(row.wa_clicks_7d ?? 0),
  };
}

async function listPublicShops(limit = 60) {
  const rows = await sql`
    SELECT
      s.*,
      p.status AS owner_status,
      p.approved_at,
      (
        SELECT COUNT(*)::int
        FROM products pr
        WHERE pr.shop_id = s.id AND pr.status = 'active'
      ) AS active_product_count
    FROM shops s
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.status = 'approved'
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapShop);
}

async function listPublicProducts(limit = 100) {
  const rows = await sql`
    SELECT
      p.*,
      json_build_object(
        'id', s.id, 'owner_id', s.owner_id, 'slug', s.slug, 'name', s.name,
        'logo_key', s.logo_key, 'cover_key', s.cover_key, 'about', s.about,
        'whatsapp', s.whatsapp, 'phone', s.phone, 'district_id', s.district_id,
        'sector_id', s.sector_id, 'district_name', s.district_name,
        'sector_name', s.sector_name, 'landmark', s.landmark,
        'hours_text', s.hours_text, 'delivery_text', s.delivery_text,
        'product_limit', s.product_limit, 'plan', s.plan,
        'plan_expires_at', s.plan_expires_at, 'created_at', s.created_at,
        'approved_at', owner.approved_at, 'owner_status', owner.status,
        'status', s.status,
        'active_product_count', (
          SELECT COUNT(*)::int FROM products pc
          WHERE pc.shop_id = s.id AND pc.status = 'active'
        )
      ) AS shop,
      to_jsonb(c) AS category,
      CASE WHEN parent.id IS NULL THEN NULL ELSE to_jsonb(parent) END AS parent_category,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', im.id, 'product_id', im.product_id, 'position', im.position,
            'path_full', im.path_full, 'path_thumb', im.path_thumb,
            'width', im.width, 'height', im.height, 'bytes', im.bytes
          ) ORDER BY im.position
        ) FROM product_images im WHERE im.product_id = p.id
      ), '[]'::json) AS images,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', v.id, 'product_id', v.product_id, 'size_label', v.size_label,
            'color', v.color, 'in_stock', v.in_stock, 'qty', v.qty
          ) ORDER BY v.size_label
        ) FROM product_variants v WHERE v.product_id = p.id
      ), '[]'::json) AS variants,
      COALESCE((
        SELECT SUM(ds.views)::int FROM product_daily_stats ds
        WHERE ds.product_id = p.id AND ds.day >= CURRENT_DATE - INTERVAL '6 days'
      ), 0) AS views_7d,
      COALESCE((
        SELECT SUM(ds.wa_clicks)::int FROM product_daily_stats ds
        WHERE ds.product_id = p.id AND ds.day >= CURRENT_DATE - INTERVAL '6 days'
      ), 0) AS wa_clicks_7d,
      COALESCE((
        SELECT SUM(ds.views + ds.wa_clicks + ds.call_clicks + ds.cart_adds + ds.shares)::int
        FROM product_daily_stats ds
        WHERE ds.product_id = p.id AND ds.day >= CURRENT_DATE - INTERVAL '6 days'
      ), 0) AS popularity_7d
    FROM products p
    JOIN shops s ON s.id = p.shop_id
    JOIN profiles owner ON owner.id = s.owner_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent ON parent.id = c.parent_id
    WHERE p.status IN ('active', 'sold_out')
      AND owner.status = 'approved'
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapProduct);
}

async function getSettings() {
  const rows = await sql`SELECT key, value FROM settings`;
  const defaults = {
    ADS_ENABLED: false,
    PHONE_ACCESSORIES_ENABLED: false,
    DEFAULT_PRODUCT_LIMIT: 150,
    MAX_PHOTOS_PER_PRODUCT: 5,
    TERMS_VERSION: "1.0",
    SUPPORT_WHATSAPP: "",
    SUPPORT_HOURS: "Buri munsi · 08:00 – 20:00 (CAT)",
  };
  for (const row of rows) defaults[row.key] = row.value;
  return defaults;
}

async function bootstrap() {
  const [categoryRows, areaRows, synonymRows, campaignRows, settings, shops, products] =
    await Promise.all([
      sql`
        SELECT id, parent_id, slug, name_rw, name_en, sort, size_set, active, phase
        FROM categories
        WHERE active = TRUE OR (phase = 'P3' AND (SELECT COALESCE((value #>> '{}')::boolean, false)
          FROM settings WHERE key = 'PHONE_ACCESSORIES_ENABLED') = TRUE)
        ORDER BY parent_id NULLS FIRST, sort, id
      `,
      sql`
        SELECT id, province, district, sector, parent_id, active
        FROM areas
        ORDER BY id
      `,
      sql`SELECT term, canonical FROM synonyms ORDER BY term`,
      sql`
        SELECT id, title, subtitle, kicker, cta_label, target_path, image_key,
          shop_id, shop_name, active, sort_order, impressions, clicks, created_at
        FROM campaigns
        WHERE active = TRUE
        ORDER BY sort_order, created_at DESC
      `,
      getSettings(),
      listPublicShops(60),
      listPublicProducts(100),
    ]);

  const campaigns = campaignRows.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle,
    kicker: campaign.kicker,
    ctaLabel: campaign.cta_label,
    targetPath: campaign.target_path,
    imageUrl: assetUrl(campaign.image_key),
    shopId: campaign.shop_id,
    shopName: campaign.shop_name,
    active: campaign.active,
    sortOrder: campaign.sort_order,
    impressions: Number(campaign.impressions),
    clicks: Number(campaign.clicks),
    created_at: campaign.created_at,
  }));

  // Rotate the campaign order deterministically every six hours.
  if (campaigns.length > 1) {
    const slot = Math.floor(Date.now() / (1000 * 60 * 60 * 6));
    const offset = slot % campaigns.length;
    campaigns.push(...campaigns.splice(0, offset));
  }

  return {
    categories: categoryRows,
    areas: areaRows,
    synonyms: synonymRows,
    campaigns,
    settings,
    shops,
    products,
  };
}

async function getProduct(id) {
  const rows = await sql`
    SELECT p.*,
      json_build_object(
        'id', s.id, 'owner_id', s.owner_id, 'slug', s.slug, 'name', s.name,
        'logo_key', s.logo_key, 'cover_key', s.cover_key, 'about', s.about,
        'whatsapp', s.whatsapp, 'phone', s.phone, 'district_id', s.district_id,
        'sector_id', s.sector_id, 'district_name', s.district_name,
        'sector_name', s.sector_name, 'landmark', s.landmark,
        'hours_text', s.hours_text, 'delivery_text', s.delivery_text,
        'product_limit', s.product_limit, 'plan', s.plan,
        'plan_expires_at', s.plan_expires_at, 'created_at', s.created_at,
        'approved_at', owner.approved_at, 'owner_status', owner.status,
        'status', s.status,
        'active_product_count', (
          SELECT COUNT(*)::int FROM products pc
          WHERE pc.shop_id = s.id AND pc.status = 'active'
        )
      ) AS shop,
      to_jsonb(c) AS category,
      CASE WHEN parent.id IS NULL THEN NULL ELSE to_jsonb(parent) END AS parent_category,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', im.id, 'product_id', im.product_id, 'position', im.position,
            'path_full', im.path_full, 'path_thumb', im.path_thumb,
            'width', im.width, 'height', im.height, 'bytes', im.bytes
          ) ORDER BY im.position
        ) FROM product_images im WHERE im.product_id = p.id
      ), '[]'::json) AS images,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', v.id, 'product_id', v.product_id, 'size_label', v.size_label,
            'color', v.color, 'in_stock', v.in_stock, 'qty', v.qty
          ) ORDER BY v.size_label
        ) FROM product_variants v WHERE v.product_id = p.id
      ), '[]'::json) AS variants
    FROM products p
    JOIN shops s ON s.id = p.shop_id
    JOIN profiles owner ON owner.id = s.owner_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent ON parent.id = c.parent_id
    WHERE p.id = ${id}
      AND p.status IN ('active', 'sold_out')
      AND owner.status = 'approved'
    LIMIT 1
  `;

  if (!rows.length) return null;
  const product = mapProduct(rows[0]);

  const [historyRows, similarRows, buyRows] = await Promise.all([
    sql`SELECT id, product_id, price, changed_at FROM price_history
        WHERE product_id = ${id} ORDER BY changed_at DESC LIMIT 30`,
    listSimilarProducts(id, rows[0].category_id, rows[0].shop_id),
    listShopProducts(rows[0].shop_id, id, 4),
  ]);

  return {
    product,
    priceHistory: historyRows.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      price: Number(row.price),
      changed_at: row.changed_at,
    })),
    similar: similarRows,
    buyTogether: buyRows,
  };
}

async function listSimilarProducts(productId, categoryId, shopId) {
  const rows = await sql`
    SELECT p.id
    FROM products p
    JOIN shops s ON s.id = p.shop_id
    JOIN profiles owner ON owner.id = s.owner_id
    WHERE p.id <> ${productId}
      AND p.category_id = ${categoryId}
      AND p.status = 'active'
      AND owner.status = 'approved'
    ORDER BY p.created_at DESC
    LIMIT 8
  `;
  const results = [];
  for (const row of rows) {
    const detailRows = await sql`
      SELECT p.*,
        json_build_object('id', s.id, 'owner_id', s.owner_id, 'slug', s.slug,
          'name', s.name, 'logo_key', s.logo_key, 'cover_key', s.cover_key,
          'about', s.about, 'whatsapp', s.whatsapp, 'phone', s.phone,
          'district_id', s.district_id, 'sector_id', s.sector_id,
          'district_name', s.district_name, 'sector_name', s.sector_name,
          'landmark', s.landmark, 'hours_text', s.hours_text,
          'delivery_text', s.delivery_text, 'product_limit', s.product_limit,
          'plan', s.plan, 'plan_expires_at', s.plan_expires_at,
          'created_at', s.created_at, 'approved_at', owner.approved_at,
          'owner_status', owner.status, 'status', s.status) AS shop,
        COALESCE((SELECT json_agg(json_build_object(
          'id', im.id, 'product_id', im.product_id, 'position', im.position,
          'path_full', im.path_full, 'path_thumb', im.path_thumb,
          'width', im.width, 'height', im.height, 'bytes', im.bytes
        ) ORDER BY im.position) FROM product_images im WHERE im.product_id = p.id), '[]'::json) AS images,
        COALESCE((SELECT json_agg(json_build_object(
          'id', v.id, 'product_id', v.product_id, 'size_label', v.size_label,
          'color', v.color, 'in_stock', v.in_stock, 'qty', v.qty
        ) ORDER BY v.size_label) FROM product_variants v WHERE v.product_id = p.id), '[]'::json) AS variants
      FROM products p JOIN shops s ON s.id = p.shop_id
      JOIN profiles owner ON owner.id = s.owner_id
      WHERE p.id = ${row.id}
    `;
    if (detailRows[0]) results.push(mapProduct(detailRows[0]));
  }
  return results;
}

async function listShopProducts(shopId, excludeId, limit) {
  const rows = await sql`
    SELECT p.*,
      json_build_object('id', s.id, 'owner_id', s.owner_id, 'slug', s.slug,
        'name', s.name, 'logo_key', s.logo_key, 'cover_key', s.cover_key,
        'about', s.about, 'whatsapp', s.whatsapp, 'phone', s.phone,
        'district_id', s.district_id, 'sector_id', s.sector_id,
        'district_name', s.district_name, 'sector_name', s.sector_name,
        'landmark', s.landmark, 'hours_text', s.hours_text,
        'delivery_text', s.delivery_text, 'product_limit', s.product_limit,
        'plan', s.plan, 'plan_expires_at', s.plan_expires_at,
        'created_at', s.created_at, 'approved_at', owner.approved_at,
        'owner_status', owner.status, 'status', s.status) AS shop,
      COALESCE((SELECT json_agg(json_build_object(
        'id', im.id, 'product_id', im.product_id, 'position', im.position,
        'path_full', im.path_full, 'path_thumb', im.path_thumb,
        'width', im.width, 'height', im.height, 'bytes', im.bytes
      ) ORDER BY im.position) FROM product_images im WHERE im.product_id = p.id), '[]'::json) AS images,
      COALESCE((SELECT json_agg(json_build_object(
        'id', v.id, 'product_id', v.product_id, 'size_label', v.size_label,
        'color', v.color, 'in_stock', v.in_stock, 'qty', v.qty
      ) ORDER BY v.size_label) FROM product_variants v WHERE v.product_id = p.id), '[]'::json) AS variants
    FROM products p
    JOIN shops s ON s.id = p.shop_id
    JOIN profiles owner ON owner.id = s.owner_id
    WHERE p.shop_id = ${shopId} AND p.id <> ${excludeId}
      AND p.status IN ('active', 'sold_out') AND owner.status = 'approved'
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapProduct);
}

async function getShop(slug) {
  const rows = await sql`
    SELECT s.*, p.status AS owner_status, p.approved_at,
      (SELECT COUNT(*)::int FROM products pr
        WHERE pr.shop_id = s.id AND pr.status = 'active') AS active_product_count
    FROM shops s
    JOIN profiles p ON p.id = s.owner_id
    WHERE s.slug = ${slug} AND p.status = 'approved'
    LIMIT 1
  `;
  if (!rows.length) return null;
  const shop = mapShop(rows[0]);
  const products = await listShopProducts(rows[0].id, "", 100);
  return { shop, products };
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    try {
      if (path === "/" || path === "/health") {
        const [probe] = await sql`SELECT 1 AS ok, current_database() AS database_name`;
        return json({
          service: "ISOKO API",
          phase: "read-only-data-api",
          status: "healthy",
          database: probe.database_name,
          dbProbe: Number(probe.ok),
          branch: process.env.NEON_BRANCH ?? "unknown",
        });
      }

      if (path === "/api/bootstrap") {
        return json(await bootstrap(), 200, "public, max-age=30, stale-while-revalidate=60");
      }

      const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
      if (productMatch) {
        const data = await getProduct(decodeURIComponent(productMatch[1]));
        if (!data) return json({ error: "Iki gicuruzwa ntikikiriho", alternatives: [] }, 404);
        return json(data, 200, "public, max-age=30, stale-while-revalidate=60");
      }

      const shopMatch = path.match(/^\/api\/shops\/([^/]+)$/);
      if (shopMatch) {
        const data = await getShop(decodeURIComponent(shopMatch[1]));
        if (!data) return json({ error: "Iduka ntirikiriho" }, 404);
        return json(data, 200, "public, max-age=30, stale-while-revalidate=60");
      }

      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error("ISOKO read-only API request failed", {
        path,
        message: error instanceof Error ? error.message : "unknown error",
      });
      return json({ error: "Habaye ikibazo mu gusoma amakuru. Ongera ugerageze." }, 503);
    }
  },
};
