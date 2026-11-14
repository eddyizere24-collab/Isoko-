import { INITIAL_CATEGORIES } from '../data/categories';
import { DEFAULT_SYNONYMS } from '../lib/algorithm';
import type {
  AuditLogEntry,
  DailyStat,
  MarketplaceSettings,
  PriceHistoryEntry,
  Product,
  Profile,
  PromoCampaign,
  Report,
  SellerKyc,
  Shop,
  Subscriber,
  Synonym,
} from '../types/marketplace';

export interface DatabaseState {
  profiles: Array<Profile & { passwordHash: string }>;
  seller_kyc: SellerKyc[];
  shops: Shop[];
  categories: typeof INITIAL_CATEGORIES;
  products: Product[];
  price_history: PriceHistoryEntry[];
  reports: Report[];
  subscribers: Subscriber[];
  product_daily_stats: DailyStat[];
  shop_daily_stats: DailyStat[];
  synonyms: Synonym[];
  campaigns: PromoCampaign[];
  settings: MarketplaceSettings;
  audit_log: AuditLogEntry[];
  event_dedup: Record<string, boolean>;
  report_rate: Record<string, number>;
}

/**
 * Local-only compatibility hash. Production accounts use Neon Auth.
 * There are deliberately no preset accounts or demo passwords.
 */
export function hashPassword(password: string): string {
  let h = 2166136261;
  const salted = `isoko_rw_v1:${password}`;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h_${(h >>> 0).toString(16)}`;
}

/**
 * A fresh local store starts empty. Reference categories and search synonyms
 * are configuration; no sellers, KYC documents, shops, products, analytics,
 * reports, promotional campaigns or sample identities are created.
 */
export function createInitialSeedData(): DatabaseState {
  return {
    profiles: [],
    seller_kyc: [],
    shops: [],
    categories: INITIAL_CATEGORIES,
    products: [],
    price_history: [],
    reports: [],
    subscribers: [],
    product_daily_stats: [],
    shop_daily_stats: [],
    synonyms: DEFAULT_SYNONYMS,
    campaigns: [],
    settings: {
      ADS_ENABLED: false,
      PHONE_ACCESSORIES_ENABLED: false,
      DEFAULT_PRODUCT_LIMIT: 150,
      MAX_PHOTOS_PER_PRODUCT: 5,
      TERMS_VERSION: '1.0',
      SUPPORT_WHATSAPP: '',
      SUPPORT_HOURS: '',
    },
    audit_log: [],
    event_dedup: {},
    report_rate: {},
  };
}
