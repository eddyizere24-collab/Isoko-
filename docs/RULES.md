# ISOKO implementation rules

- Each avatar, shop logo and cover upload must be persisted immediately after storage confirms success — an uploaded image that exists only in browser state disappears on reload.
- Seller profile photos, shop logos and shop covers must use separate upload kinds and storage prefixes — distinct media roles must never be confused by UI or storage routing.
- Every seller image upload must consume a server-verified daily quota before Object Storage writes — client-side limits can be bypassed.
- Product image keys must begin with `products/<authenticated-seller-profile-id>/` for both create and update RPCs — a browser-provided object key must never attach another seller's media to a product.
- Public storefront images must render an accessible fallback on load failure — broken image glyphs are not a usable empty state.
- A shop receives the Isoko Verified seal only when `profiles.identity_status = 'verified'` — seller approval for listing products is not identity verification.
- Seller avatar and logo must occupy separate, clearly labelled spaces outside the cover — overlapping brand assets cause identity confusion.
- No Production migration or Function deployment is performed from a feature PR — schema and Function deployment require owner review and explicit Production steps.
- Logout must await the Neon Auth sign-out action before clearing account-scoped local/session/IndexedDB caches — a fire-and-forget request can leave a live server session.
- Logout must preserve anonymous buyer cart, language and location preferences while removing account caches — buyer browsing must not be lost when a seller signs out.
- Logout must replace the current private history entry with Home — the Back button must not restore a signed-in private route after logout.
- Expose other-device session revocation only when the configured Neon Auth client actually provides it — do not invent unsupported account controls.

- A first-time visitor always starts in Kinyarwanda, while an explicitly saved language choice wins — browser language must not override the marketplace's primary language.
- Every supported language dictionary must contain exactly the Kinyarwanda key set and be checked in CI — missing translations must be caught before merge.
- Translation review status stays in code and never appears as a beta badge to users — unreviewed translations must not be presented as beta or as human-reviewed.
- Every translated legal page must state that Kinyarwanda is the reference text — legal translations must not replace the authoritative source language.
- Google social-login UI remains hidden unless the explicit VITE_ISOKO_GOOGLE_SIGNIN_ENABLED flag is true — absent credentials must never expose a broken authentication button.
- Google OAuth credentials belong only in Neon Auth's provider secret fields and never in Git, frontend bundles or chat — client secrets must remain server-side.
- OAuth redirect URIs must be copied from the selected Neon Auth branch configuration and verified against Google Console — branch-specific callback URLs must not be guessed.

- Account ownership is proven only by isolated QA tests for two distinct sellers across RLS, RPC, storage and upload endpoints — reading policy definitions alone does not prove isolation.
- Production email verification remains disabled until the owner configures and tests a trusted sender plus the verification journey — an enabled checkbox without deliverable email would lock out sellers.
- Server-side rate limits must use a trusted server identity or provider controls, never only a client-supplied session id — clients can change their own identifiers.
- Security audit status must distinguish tested, unproven and missing controls — absence of test evidence must not be reported as secure.
