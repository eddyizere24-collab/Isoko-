# ISOKO implementation rules

- Each avatar, shop logo and cover upload must be persisted immediately after storage confirms success — an uploaded image that exists only in browser state disappears on reload.
- Seller profile photos, shop logos and shop covers must use separate upload kinds and storage prefixes — distinct media roles must never be confused by UI or storage routing.
- Every seller image upload must consume a server-verified daily quota before Object Storage writes — client-side limits can be bypassed.
- Public storefront images must render an accessible fallback on load failure — broken image glyphs are not a usable empty state.
- Seller avatar and logo must occupy separate, clearly labelled spaces outside the cover — overlapping brand assets cause identity confusion.
- No Production migration or Function deployment is performed from a feature PR — schema and Function deployment require owner review and explicit Production steps.
- Logout must await the Neon Auth sign-out action before clearing account-scoped local/session/IndexedDB caches — a fire-and-forget request can leave a live server session.
- Logout must preserve anonymous buyer cart, language and location preferences while removing account caches — buyer browsing must not be lost when a seller signs out.
- Logout must replace the current private history entry with Home — the Back button must not restore a signed-in private route after logout.
- Expose other-device session revocation only when the configured Neon Auth client actually provides it — do not invent unsupported account controls.
