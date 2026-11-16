# ISOKO implementation rules

- Each avatar, shop logo and cover upload must be persisted immediately after storage confirms success — an uploaded image that exists only in browser state disappears on reload.
- Seller profile photos, shop logos and shop covers must use separate upload kinds and storage prefixes — distinct media roles must never be confused by UI or storage routing.
- Every seller image upload must consume a server-verified daily quota before Object Storage writes — client-side limits can be bypassed.
- Public storefront images must render an accessible fallback on load failure — broken image glyphs are not a usable empty state.
- Seller avatar and logo must occupy separate, clearly labelled spaces outside the cover — overlapping brand assets cause identity confusion.
- No Production migration or Function deployment is performed from a feature PR — schema and Function deployment require owner review and explicit Production steps.

- Seller upload quotas use the real text type of profiles.id and the Neon Auth auth.user_id() identity — migration key types and identity lookups must match Production schema exactly.
- The per-seller daily upload quota counts authenticated upload attempts in UTC before the storage write — retries must not bypass abuse limits.
