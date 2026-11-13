import { getSessionId } from './storage';

export type TrackEventType = 'view' | 'wa_click' | 'call_click' | 'cart_add' | 'share';

export function trackEvent(
  type: TrackEventType,
  productId?: string | null,
  shopId?: string | null
): void {
  try {
    const sessionId = getSessionId();
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        productId: productId ?? null,
        shopId: shopId ?? null,
        sessionId,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Ignore tracking network errors
  }
}
