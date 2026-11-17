# ISOKO implementation rules

- Each avatar, shop logo and cover upload must be persisted immediately after storage confirms success — an uploaded image that exists only in browser state disappears on reload.
- Seller profile photos, shop logos and shop covers must use separate upload kinds and storage prefixes — distinct media roles must never be confused by UI or storage routing.
- Every seller image upload must consume a server-verified daily quota before Object Storage writes — client-side limits can be bypassed.
- Seller image uploads must also use a rolling per-seller burst limit derived from Neon Auth identity; a client-supplied seller/session ID is not a trusted rate-limit key.
- Product image keys must begin with `products/<authenticated-seller-profile-id>/` for both create and update RPCs — a browser-provided object key must never attach another seller's media to a product.
- Public storefront images must render an accessible fallback on load failure — broken image glyphs are not a usable empty state.
- A shop receives the Isoko Verified seal only when `profiles.identity_status = 'verified'` on every public surface — seller approval for listing products is not identity verification.
- Seller WhatsApp actions must use a configured, valid Rwanda number; suppress the CTA when no number is configured and never publish the placeholder `250788000000` — a fake contact link misdirects buyers.
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

- ISOKO's shared visual tokens are `#FAFAF7` background, `#FFFFFF` surface, `#1A1F1C` primary text, `#4B544F` secondary text, `#0B6E4F` primary action, and `#C0392B` accent — one central palette prevents pages from drifting into washed-out cream and grey.
- Secondary body text must keep at least 4.5:1 contrast against the page background — small mobile text must remain readable in daylight.
- Imigongo bands use a 12×12 square repeating tile with green/red/ochre strokes at least 1.5px — background-size must preserve a 1:1 ratio, never stretch the pattern.
- Mobile category tiles provide at least 44px touch targets and readable labels; product listings keep three columns while price and name typography scale up — dense commerce layouts must remain tappable and legible.
- The multicolour sun mark keeps a hollow centre and clearly visible beads at 24px — the primary brand mark must not turn into a tiny indistinct ring.
- Production migration instructions must always begin with a current read-only `schema_migrations` read-back; never replay a migration that is already recorded — accidental DDL replay can break live seller workflows.
- The current Production upload quota is 300 original seller photos per UTC day and 30 per rolling 60 seconds; a paired thumbnail does not consume a second attempt — keep docs and tests aligned to migration 025.
- The backup branch `isoko-production-backup-before-release-20261116` must be preserved until a PostgreSQL and Object Storage restore drill has been completed and reviewed — a branch snapshot alone is not a verified media backup.
- Do not use the owner's Production test account or product for E2E, load, upload or visual tests — isolated QA sellers protect real account and shop data.
- Production documentation must distinguish an existing backup snapshot from a completed restore rehearsal and a live Function health check from an authenticated seller upload test — operational claims require evidence at the exact level described.
