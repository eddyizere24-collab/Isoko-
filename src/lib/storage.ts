import type { BuyerLocation, CartItem, MySizePreference, RecentItem } from '../types/marketplace';

const KEYS = {
  CART: 'isoko_cart',
  RECENTS: 'isoko_recents',
  INTEREST: 'isoko_interest',
  LOCATION: 'isoko_location',
  MYSIZE: 'isoko_mysize',
  SID: 'isoko_sid',
  SUBSCRIBER_ID: 'isoko_subscriber_id',
  DRAFT: 'isoko_product_draft',
  AUTH: 'isoko_auth_session',
  FOLLOWED_SHOPS: 'isoko_followed_shops',
  PWA_DISMISSED: 'isoko_pwa_dismissed',
  VISIT_COUNT: 'isoko_visit_count',
} as const;

const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_CART_TOTAL = 20;
export const MAX_CART_PER_SELLER = 10;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function getSessionId(): string {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const stored = safeRead<{ id: string; day: string } | null>(KEYS.SID, null);
    if (stored && stored.day === today && stored.id) return stored.id;
    const id = `${today}_${Math.random().toString(36).slice(2, 11)}`;
    safeWrite(KEYS.SID, { id, day: today });
    return id;
  } catch {
    return 'anon_session';
  }
}

export function loadCart(): CartItem[] {
  const now = Date.now();
  const items = safeRead<CartItem[]>(KEYS.CART, []);
  const fresh = items.filter((it) => now - it.addedAt < CART_TTL_MS);
  if (fresh.length !== items.length) {
    safeWrite(KEYS.CART, fresh);
  }
  return fresh;
}

export function saveCart(items: CartItem[]): void {
  safeWrite(KEYS.CART, items);
}

export function addItemToCart(
  current: CartItem[],
  item: CartItem
): { items: CartItem[]; error?: string } {
  const existingIdx = current.findIndex(
    (c) =>
      c.productId === item.productId &&
      c.size === item.size &&
      c.color === item.color
  );

  if (existingIdx >= 0) {
    const next = [...current];
    next[existingIdx] = {
      ...next[existingIdx],
      qty: Math.min(10, next[existingIdx].qty + item.qty),
      addedAt: Date.now(),
    };
    saveCart(next);
    return { items: next };
  }

  if (current.length >= MAX_CART_TOTAL) {
    return {
      items: current,
      error: `Igare ntirigomba kurenza ibicuruzwa ${MAX_CART_TOTAL}. Kuraho bimwe mbere yo kongeraho.`,
    };
  }

  const sellerCount = current.filter((c) => c.shopId === item.shopId).length;
  if (sellerCount >= MAX_CART_PER_SELLER) {
    return {
      items: current,
      error: `Ntushobora kurenza ibicuruzwa ${MAX_CART_PER_SELLER} ku mucuruzi umwe icyarimwe.`,
    };
  }

  const next = [...current, item];
  saveCart(next);
  return { items: next };
}

export function loadRecents(): RecentItem[] {
  return safeRead<RecentItem[]>(KEYS.RECENTS, []).slice(0, 20);
}

export function recordRecentProduct(productId: string): RecentItem[] {
  const existing = loadRecents().filter((r) => r.productId !== productId);
  const next = [{ productId, viewedAt: Date.now() }, ...existing].slice(0, 20);
  safeWrite(KEYS.RECENTS, next);
  return next;
}

interface InterestStore {
  scores: Record<number, number>;
  lastDecayAt: number;
}

export function loadInterest(): Record<number, number> {
  const store = safeRead<InterestStore>(KEYS.INTEREST, { scores: {}, lastDecayAt: Date.now() });
  const days = (Date.now() - store.lastDecayAt) / (1000 * 60 * 60 * 24);
  if (days >= 7) {
    const decayed: Record<number, number> = {};
    for (const [k, v] of Object.entries(store.scores)) {
      const nv = Math.round(v * 0.9 * 100) / 100;
      if (nv >= 0.5) decayed[Number(k)] = nv;
    }
    safeWrite(KEYS.INTEREST, { scores: decayed, lastDecayAt: Date.now() });
    return decayed;
  }
  return store.scores;
}

export function recordCategoryInterest(categoryId: number, weight: 1 | 3 | 5): void {
  const scores = loadInterest();
  scores[categoryId] = (scores[categoryId] ?? 0) + weight;
  safeWrite(KEYS.INTEREST, { scores, lastDecayAt: Date.now() });
}

export function loadLocation(): BuyerLocation | null {
  return safeRead<BuyerLocation | null>(KEYS.LOCATION, null);
}

export function saveLocation(loc: BuyerLocation | null): void {
  if (!loc) {
    try {
      localStorage.removeItem(KEYS.LOCATION);
    } catch {
      // ignore
    }
    return;
  }
  safeWrite(KEYS.LOCATION, loc);
}

export function loadMySize(): MySizePreference {
  return safeRead<MySizePreference>(KEYS.MYSIZE, {
    shoeSize: '',
    clothingSize: '',
    enabled: false,
  });
}

export function saveMySize(pref: MySizePreference): void {
  safeWrite(KEYS.MYSIZE, pref);
}

export function loadFollowedShops(): string[] {
  return safeRead<string[]>(KEYS.FOLLOWED_SHOPS, []);
}

export function toggleFollowedShop(shopId: string): string[] {
  const curr = loadFollowedShops();
  const next = curr.includes(shopId) ? curr.filter((id) => id !== shopId) : [...curr, shopId];
  safeWrite(KEYS.FOLLOWED_SHOPS, next);
  return next;
}

export function loadProductDraft<T>(): T | null {
  return safeRead<T | null>(KEYS.DRAFT, null);
}

export function saveProductDraft<T>(draft: T | null): void {
  if (!draft) {
    try {
      localStorage.removeItem(KEYS.DRAFT);
    } catch {
      // ignore
    }
    return;
  }
  safeWrite(KEYS.DRAFT, draft);
}

export interface StoredAuthSession {
  token: string;
  userId: string;
  role: 'seller' | 'admin' | 'moderator';
  expiresAt: number;
}

export function loadAuthSession(): StoredAuthSession | null {
  const sess = safeRead<StoredAuthSession | null>(KEYS.AUTH, null);
  if (!sess || sess.token !== 'managed-neon-auth') {
    saveAuthSession(null);
    return null;
  }
  if (Date.now() > sess.expiresAt) {
    saveAuthSession(null);
    return null;
  }
  return sess;
}

export function saveAuthSession(session: StoredAuthSession | null): void {
  if (!session) {
    try {
      localStorage.removeItem(KEYS.AUTH);
    } catch {
      // ignore
    }
    return;
  }
  safeWrite(KEYS.AUTH, session);
}


/** Stable, non-personal browser identifier used to manage that browser's shop follows. */
export function getSubscriberId(): string {
  try {
    const stored = localStorage.getItem(KEYS.SUBSCRIBER_ID);
    if (stored && /^subscriber_[a-z0-9_-]{12,80}$/i.test(stored)) return stored;
    const id = `subscriber_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
    localStorage.setItem(KEYS.SUBSCRIBER_ID, id);
    return id;
  } catch {
    // Storage may be blocked in private browsing. This fallback is session-scoped.
    return `subscriber_${getSessionId()}`;
  }
}

export function incrementVisitCount(): number {
  const current = safeRead<number>(KEYS.VISIT_COUNT, 0) + 1;
  safeWrite(KEYS.VISIT_COUNT, current);
  return current;
}

export function isPwaDismissed(): boolean {
  return safeRead<boolean>(KEYS.PWA_DISMISSED, false);
}

export function dismissPwaBanner(): void {
  safeWrite(KEYS.PWA_DISMISSED, true);
}
