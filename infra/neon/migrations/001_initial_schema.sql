-- ISOKO initial PostgreSQL schema for Neon.
-- This migration intentionally uses TEXT IDs to preserve the app's existing prefixed IDs.
-- Sensitive national-ID values are never stored in plaintext: keep only an HMAC fingerprint and last four digits.
-- KYC objects are referenced by private object keys, never public URLs.
-- All data access is server-side through the authenticated Neon Function; no browser DB credentials.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  sector TEXT,
  parent_id INTEGER REFERENCES areas(id),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('seller', 'admin', 'moderator')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'needs_changes', 'rejected', 'suspended')),
  status_reason TEXT,
  approved_by TEXT REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  terms_version TEXT NOT NULL,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_key TEXT PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS seller_kyc (
  seller_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name_on_id TEXT NOT NULL,
  national_id_fingerprint TEXT,
  national_id_last4 CHAR(4),
  id_front_key TEXT NOT NULL,
  id_back_key TEXT NOT NULL,
  selfie_key TEXT NOT NULL,
  shop_photo_key TEXT NOT NULL,
  tin_ciphertext TEXT,
  business_type TEXT NOT NULL,
  phone_verified_at TIMESTAMPTZ,
  whatsapp_verified_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES profiles(id),
  review_notes TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS seller_kyc_national_id_fingerprint_idx
  ON seller_kyc(national_id_fingerprint)
  WHERE national_id_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_key TEXT,
  cover_key TEXT,
  about TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL,
  phone TEXT NOT NULL,
  district_id INTEGER REFERENCES areas(id),
  sector_id INTEGER REFERENCES areas(id),
  district_name TEXT NOT NULL,
  sector_name TEXT,
  landmark TEXT NOT NULL DEFAULT '',
  hours_text TEXT NOT NULL DEFAULT '',
  delivery_text TEXT NOT NULL DEFAULT '',
  product_limit INTEGER NOT NULL DEFAULT 150,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'needs_changes', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shops_status_idx ON shops(status);
CREATE INDEX IF NOT EXISTS shops_district_idx ON shops(district_id);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER REFERENCES categories(id),
  slug TEXT NOT NULL UNIQUE,
  name_rw TEXT NOT NULL,
  name_en TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  size_set TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  phase TEXT NOT NULL DEFAULT 'P1'
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 500 AND price <= 5000000),
  old_price INTEGER CHECK (old_price IS NULL OR old_price > price),
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used')),
  brand TEXT,
  authentic BOOLEAN NOT NULL DEFAULT FALSE,
  colors TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'sold_out', 'hidden', 'expired')),
  hidden_reason TEXT,
  search TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(brand, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(description, '')), 'C')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_out_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN(search);
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_shop_status_idx ON products(shop_id, status);
CREATE INDEX IF NOT EXISTS products_category_status_idx ON products(category_id, status);
CREATE INDEX IF NOT EXISTS products_created_idx ON products(created_at DESC);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  path_full TEXT NOT NULL,
  path_thumb TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  bytes INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images(product_id, position);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL,
  color TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  qty INTEGER CHECK (qty IS NULL OR (qty >= 0 AND qty <= 999))
);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS price_history_product_idx ON price_history(product_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'shop')),
  target_id TEXT NOT NULL,
  target_name TEXT,
  type TEXT NOT NULL,
  details TEXT NOT NULL,
  reporter_phone TEXT,
  session_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_by TEXT REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS reports_status_created_idx ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_target_idx ON reports(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('push', 'email', 'shop_follow')),
  external_id TEXT NOT NULL,
  district_id INTEGER REFERENCES areas(id),
  top_category_id INTEGER REFERENCES categories(id),
  shop_id TEXT REFERENCES shops(id) ON DELETE SET NULL,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_version TEXT NOT NULL,
  unsubscribed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS subscribers_active_idx ON subscribers(kind, external_id)
  WHERE unsubscribed_at IS NULL;

CREATE TABLE IF NOT EXISTS product_daily_stats (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  wa_clicks INTEGER NOT NULL DEFAULT 0,
  call_clicks INTEGER NOT NULL DEFAULT 0,
  cart_adds INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(product_id, day)
);

CREATE TABLE IF NOT EXISTS shop_daily_stats (
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  wa_clicks INTEGER NOT NULL DEFAULT 0,
  call_clicks INTEGER NOT NULL DEFAULT 0,
  cart_adds INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(shop_id, day)
);

CREATE TABLE IF NOT EXISTS synonyms (
  term TEXT PRIMARY KEY,
  canonical TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  kicker TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  target_path TEXT NOT NULL,
  image_key TEXT NOT NULL,
  shop_id TEXT REFERENCES shops(id) ON DELETE SET NULL,
  shop_name TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS campaigns_active_sort_idx ON campaigns(active, sort_order);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_target_idx ON audit_log(target_type, target_id);

CREATE TABLE IF NOT EXISTS event_dedup (
  dedup_key TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS event_dedup_created_idx ON event_dedup(created_at);

CREATE TABLE IF NOT EXISTS report_rate (
  rate_key TEXT PRIMARY KEY,
  rate_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations(version)
VALUES ('001_initial_neon_schema')
ON CONFLICT (version) DO NOTHING;
