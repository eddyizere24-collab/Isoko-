-- Isoko Database Schema (Section 7.1, 7.2, 7.4)
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create table if not exists areas (
  id serial primary key,
  province text not null,
  district text not null,
  sector text,
  parent_id int references areas(id),
  active boolean not null default true
);

create table if not exists profiles (
  id uuid primary key,
  role text not null check (role in ('seller','admin','moderator')),
  full_name text not null,
  phone text not null unique,
  whatsapp text not null,
  status text not null default 'pending' check (status in ('pending','approved','needs_changes','rejected','suspended')),
  status_reason text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists seller_kyc (
  seller_id uuid primary key references profiles(id) on delete cascade,
  full_name_on_id text not null,
  national_id_number text not null,
  id_front_path text not null,
  id_back_path text not null,
  selfie_path text not null,
  shop_photo_path text not null,
  tin text,
  business_type text not null,
  phone_verified_at timestamptz,
  whatsapp_verified_at timestamptz,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  review_notes text
);

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  logo_path text,
  cover_path text,
  about text default '',
  whatsapp text not null,
  phone text not null,
  district_id int references areas(id),
  sector_id int references areas(id),
  landmark text default '',
  hours_text text default '',
  delivery_text text default '',
  product_limit int not null default 150,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id serial primary key,
  parent_id int references categories(id),
  slug text not null unique,
  name_rw text not null,
  name_en text,
  sort int not null default 0,
  size_set text not null,
  active boolean not null default true,
  phase text not null default 'P1'
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  category_id int not null references categories(id),
  name text not null,
  description text default '',
  price int not null check (price >= 500 and price <= 5000000),
  old_price int check (old_price is null or old_price > price),
  condition text not null check (condition in ('new','used')),
  brand text,
  authentic boolean not null default false,
  colors text[] not null default '{}',
  status text not null default 'active' check (status in ('draft','active','sold_out','hidden','expired')),
  hidden_reason text,
  search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_confirmed_at timestamptz not null default now(),
  sold_out_at timestamptz
);

create index if not exists products_search_idx on products using gin (search);
create index if not exists products_name_trgm on products using gin (name gin_trgm_ops);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  position int not null default 0,
  path_full text not null,
  path_thumb text not null,
  width int not null,
  height int not null,
  bytes int not null
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size_label text not null,
  color text,
  in_stock boolean not null default true,
  qty int check (qty is null or (qty >= 0 and qty <= 999))
);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  price int not null,
  changed_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('product','shop')),
  target_id uuid not null,
  type text not null,
  details text not null,
  reporter_phone text,
  session_hash text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_by uuid references profiles(id),
  resolved_at timestamptz
);

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('push','email','shop_follow')),
  external_id text not null,
  district_id int references areas(id),
  top_category_id int references categories(id),
  consent_at timestamptz not null default now(),
  consent_version text not null,
  unsubscribed_at timestamptz
);

create table if not exists product_daily_stats (
  product_id uuid not null references products(id) on delete cascade,
  day date not null,
  views int not null default 0,
  wa_clicks int not null default 0,
  call_clicks int not null default 0,
  cart_adds int not null default 0,
  shares int not null default 0,
  primary key (product_id, day)
);

create table if not exists shop_daily_stats (
  shop_id uuid not null references shops(id) on delete cascade,
  day date not null,
  views int not null default 0,
  wa_clicks int not null default 0,
  call_clicks int not null default 0,
  shares int not null default 0,
  primary key (shop_id, day)
);

create table if not exists synonyms (
  term text primary key,
  canonical text not null
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
