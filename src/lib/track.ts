import { getSessionId } from './storage';
import { trackMarketplaceEvent } from './api';

export type TrackEventType = 'view' | 'wa_click' | 'call_click' | 'cart_add' | 'share';

export function trackEvent(
  type: TrackEventType,
  productId?: string | null,
  shopId?: string | null
): void {
  try {
    void trackMarketplaceEvent(type, productId ?? null, shopId ?? null, getSessionId());
  } catch {
    // Analytics never interrupts shopping.
  }
}
