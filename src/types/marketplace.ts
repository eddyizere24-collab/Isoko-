export type UserRole = 'buyer' | 'seller' | 'admin' | 'moderator';

export type SellerStatus = 'pending' | 'approved' | 'needs_changes' | 'rejected' | 'suspended';

export type ProductCondition = 'new' | 'used';

export type ProductStatus = 'draft' | 'active' | 'sold_out' | 'hidden' | 'expired';

export type ReportType =
  | 'counterfeit'
  | 'fake_price'
  | 'fake_photo'
  | 'scam'
  | 'prohibited'
  | 'other';

export type ReportStatus = 'new' | 'in_progress' | 'resolved';

export interface Area {
  id: number;
  province: string;
  district: string;
  sector: string | null;
  parent_id: number | null;
  active: boolean;
}

export interface Profile {
  id: string;
  role: 'seller' | 'admin' | 'moderator';
  full_name: string;
  phone: string;
  whatsapp: string;
  email?: string | null;
  email_verified?: boolean;
  avatar_key?: string | null;
  avatar_path?: string | null;
  bio?: string;
  identity_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  status: SellerStatus;
  status_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  terms_version: string;
  terms_accepted_at: string;
  created_at: string;
}

export interface SellerKyc {
  seller_id: string;
  full_name_on_id: string;
  national_id_number: string;
  id_front_path: string;
  id_back_path: string;
  selfie_path: string;
  shop_photo_path: string;
  tin: string | null;
  business_type: string;
  phone_verified_at: string | null;
  whatsapp_verified_at: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
}

export interface Shop {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  logo_path: string | null;
  cover_path: string | null;
  about: string;
  whatsapp: string;
  phone: string;
  district_id: number;
  sector_id: number | null;
  district_name: string;
  sector_name: string | null;
  landmark: string;
  hours_text: string;
  delivery_text: string;
  product_limit: number;
  plan: 'free' | 'pro';
  plan_expires_at: string | null;
  created_at: string;
  approved_at?: string | null;
  status?: SellerStatus;
  active_product_count?: number;
  identity_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  seller_name?: string | null;
  seller_bio?: string | null;
  seller_avatar_path?: string | null;
  social_links?: Record<string, string>;
}

export interface Category {
  id: number;
  parent_id: number | null;
  slug: string;
  name_rw: string;
  name_en: string | null;
  sort: number;
  size_set: string;
  active: boolean;
  phase: 'P1' | 'P2' | 'P3' | 'P4';
}

export interface ProductImage {
  id: string;
  product_id: string;
  position: number;
  path_full: string;
  path_thumb: string;
  width: number;
  height: number;
  bytes: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_label: string;
  color: string | null;
  in_stock: boolean;
  qty: number | null;
}

export interface PriceHistoryEntry {
  id: string;
  product_id: string;
  price: number;
  changed_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: number;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  condition: ProductCondition;
  brand: string | null;
  authentic: boolean;
  colors: string[];
  status: ProductStatus;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
  last_confirmed_at: string;
  sold_out_at: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  shop?: Shop;
  category?: Category;
  parent_category?: Category;
  popularity_7d?: number;
  views_7d?: number;
  wa_clicks_7d?: number;
}

export interface Report {
  id: string;
  target_type: 'product' | 'shop';
  target_id: string;
  target_name?: string;
  type: ReportType;
  details: string;
  reporter_phone: string | null;
  session_hash: string;
  status: ReportStatus;
  resolution: string | null;
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
}

export interface Subscriber {
  id: string;
  kind: 'push' | 'email' | 'shop_follow';
  external_id: string;
  district_id: number | null;
  top_category_id: number | null;
  shop_id?: string | null;
  consent_at: string;
  consent_version: string;
  unsubscribed_at: string | null;
}

export interface DailyStat {
  target_id: string;
  day: string;
  views: number;
  wa_clicks: number;
  call_clicks: number;
  cart_adds: number;
  shares: number;
}

export interface Synonym {
  term: string;
  canonical: string;
}

export interface MarketplaceSettings {
  ADS_ENABLED: boolean;
  PHONE_ACCESSORIES_ENABLED: boolean;
  DEFAULT_PRODUCT_LIMIT: number;
  MAX_PHOTOS_PER_PRODUCT: number;
  TERMS_VERSION: string;
  SUPPORT_WHATSAPP: string;
  SUPPORT_HOURS: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface CartItem {
  productId: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  shopWhatsapp: string;
  shopPhone: string;
  productName: string;
  thumbUrl: string;
  size: string;
  color: string;
  priceSeen: number;
  currentPrice?: number;
  qty: number;
  status?: ProductStatus;
  sizeInStock?: boolean;
  addedAt: number;
}

export interface BuyerLocation {
  districtId: number;
  districtName: string;
  sectorId: number | null;
  sectorName: string | null;
  landmark: string;
  lat?: number;
  lng?: number;
}

export interface RecentItem {
  productId: string;
  viewedAt: number;
}

export interface MySizePreference {
  shoeSize: string;
  clothingSize: string;
  enabled: boolean;
}

export interface PromoCampaign {
  id: string;
  title: string;
  subtitle: string;
  kicker: string;
  ctaLabel: string;
  targetPath: string;
  imageUrl: string;
  shopId: string | null;
  shopName: string | null;
  active: boolean;
  sortOrder: number;
  impressions: number;
  clicks: number;
  created_at: string;
}

