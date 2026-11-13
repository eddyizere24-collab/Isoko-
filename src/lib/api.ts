import { loadAuthSession } from './storage';
import type {
  Area,
  AuditLogEntry,
  Category,
  MarketplaceSettings,
  PriceHistoryEntry,
  Product,
  Profile,
  Report,
  SellerKyc,
  Shop,
  Synonym,
} from '../types/marketplace';

export interface BootstrapResponse {
  categories: Category[];
  areas: Area[];
  synonyms: Synonym[];
  settings: MarketplaceSettings;
  shops: Shop[];
  products: Product[];
}

function authHeaders(): HeadersInit {
  const sess = loadAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sess?.token) {
    headers.Authorization = `Bearer ${sess.token}`;
  }
  return headers;
}

async function handleJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Ikosa rya seriveri (${res.status})`);
  }
  return data as T;
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  const res = await fetch('/api/bootstrap');
  return handleJson<BootstrapResponse>(res);
}

export async function fetchProductDetail(id: string): Promise<{
  product: Product;
  priceHistory: PriceHistoryEntry[];
  similar: Product[];
  buyTogether: Product[];
}> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData.error || 'Iki gicuruzwa ntikiriho') as Error & {
      alternatives?: Product[];
    };
    err.alternatives = errData.alternatives || [];
    throw err;
  }
  return handleJson(res);
}

export async function fetchShopDetail(slug: string): Promise<{ shop: Shop; products: Product[] }> {
  const res = await fetch(`/api/shops/${encodeURIComponent(slug)}`);
  return handleJson(res);
}

export async function validateCartItems(
  items: Array<{ productId: string; size: string; priceSeen: number }>
): Promise<{
  validated: Array<{
    productId: string;
    exists: boolean;
    status: Product['status'];
    currentPrice: number;
    priceChanged?: boolean;
    sizeInStock: boolean;
  }>;
}> {
  const res = await fetch('/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return handleJson(res);
}

export async function submitReport(payload: {
  targetType: 'product' | 'shop';
  targetId: string;
  type: string;
  details: string;
  reporterPhone?: string;
  sessionId: string;
  turnstileOk: boolean;
}): Promise<{ report: Report }> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function subscribeUpdates(payload: {
  kind: 'push' | 'email' | 'shop_follow';
  externalId: string;
  districtId?: number | null;
  topCategoryId?: number | null;
  shopId?: string | null;
  unsubscribe?: boolean;
}) {
  const res = await fetch('/api/subscribers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function loginAccount(phone: string, password: string): Promise<{
  token: string;
  expiresAt: number;
  profile: Profile;
  shop: Shop | null;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  return handleJson(res);
}

export async function registerSellerAccount(payload: Record<string, unknown>): Promise<{
  token: string;
  expiresAt: number;
  profile: Profile;
  shop: Shop;
}> {
  const res = await fetch('/api/auth/register-seller', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function fetchMe(): Promise<{ profile: Profile; shop: Shop | null }> {
  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  return handleJson(res);
}

export async function uploadImagePair(dataUrl: string, kind: 'full' | 'thumb'): Promise<{ url: string; bytes: number }> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ dataUrl, kind }),
  });
  return handleJson(res);
}

export async function fetchSellerOverview(): Promise<{
  profile: Pick<Profile, 'id' | 'full_name' | 'status' | 'status_reason'>;
  shop: Shop;
  products: Product[];
  staleProducts: Product[];
  stats7d: { views: number; wa_clicks: number; call_clicks: number; cart_adds: number; shares: number };
  stats30d: { views: number; wa_clicks: number; call_clicks: number; cart_adds: number; shares: number };
  topViewed: Product[];
  topWa: Product | null;
}> {
  const res = await fetch('/api/seller/overview', { headers: authHeaders() });
  return handleJson(res);
}

export async function createSellerProduct(payload: Record<string, unknown>): Promise<{ product: Product }> {
  const res = await fetch('/api/seller/products', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function updateSellerProduct(
  id: string,
  payload: Record<string, unknown>
): Promise<{ product: Product }> {
  const res = await fetch(`/api/seller/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function copySellerProduct(id: string): Promise<{ product: Product }> {
  const res = await fetch(`/api/seller/products/${encodeURIComponent(id)}/copy`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function deleteSellerProduct(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/seller/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function updateSellerShop(payload: Record<string, unknown>): Promise<{ shop: Shop }> {
  const res = await fetch('/api/seller/shop', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export interface AdminOverviewResponse {
  kpis: {
    pendingSellers: number;
    newReports: number;
    newProducts24h: number;
    totalActiveProducts: number;
    totalShops: number;
    views: number;
    wa_clicks: number;
    call_clicks: number;
    cart_adds: number;
  };
  sellers: Array<Profile & { shop: Shop | null; hasKyc: boolean; kycSubmittedAt: string | null }>;
  products: Product[];
  reports: Report[];
  synonyms: Synonym[];
  settings: MarketplaceSettings;
  categories: Category[];
  auditLog: AuditLogEntry[];
}

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  const res = await fetch('/api/admin/overview', { headers: authHeaders() });
  return handleJson(res);
}

export async function fetchAdminKyc(sellerId: string): Promise<{ kyc: SellerKyc; signedUrlExpiresIn: number }> {
  const res = await fetch(`/api/admin/kyc/${encodeURIComponent(sellerId)}`, {
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function reviewAdminSeller(
  sellerId: string,
  payload: { status: string; reason?: string; phoneVerified?: boolean; whatsappVerified?: boolean }
) {
  const res = await fetch(`/api/admin/sellers/${encodeURIComponent(sellerId)}/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function moderateAdminProduct(productId: string, action: 'hide' | 'restore', reason?: string) {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/moderate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action, reason }),
  });
  return handleJson(res);
}

export async function resolveAdminReport(
  reportId: string,
  payload: { status: string; resolution: string; hideTarget?: boolean }
) {
  const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/resolve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function addAdminSynonym(term: string, canonical: string): Promise<{ synonyms: Synonym[] }> {
  const res = await fetch('/api/admin/synonyms', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ term, canonical }),
  });
  return handleJson(res);
}

export async function deleteAdminSynonym(term: string): Promise<{ synonyms: Synonym[] }> {
  const res = await fetch(`/api/admin/synonyms/${encodeURIComponent(term)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function updateAdminSettings(payload: Partial<MarketplaceSettings>): Promise<{ settings: MarketplaceSettings }> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}
