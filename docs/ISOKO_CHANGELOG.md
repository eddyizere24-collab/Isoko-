# ISOKO — Changelog and current architecture

Last updated: 2026-11-14

## Current deployment

ISOKO is a Vite + React 19 + TypeScript + Tailwind CSS 4 static frontend hosted by Render:

- Production site: https://isoko-marketplace-9i69.onrender.com
- Repository: https://github.com/eddyizere24-collab/Isoko-
- Production branch: `main`
- Render configuration: `render.production.yaml`
- Backend: dedicated Neon project `isoko-marketplace`, Production branch `isoko-production`
- Neon services: PostgreSQL, Neon Auth, `isokoapi` Function and Object Storage

The current application does not use the legacy Express server, local JSON database or local `/uploads` directory. Data and seller media are handled through Neon. The catalogue starts without fabricated sellers or products.

## Recent security and reliability changes

- **PR #17 — real seller-session checks:** the app no longer treats a localStorage marker or anonymous Data API token as proof of seller login. Protected seller routes verify a real Neon Auth session and JWT; provisional seller sessions have been removed.
- **PR #18 — Google OAuth readiness:** the Google sign-in button is hidden unless `VITE_GOOGLE_AUTH_ENABLED=true`. Production OAuth credentials have not been supplied/configured as part of these changes.
- **PR #19 — migration 017:** server-side product validation and ownership checks were added to the SQL migration. The migration file is reviewed in GitHub only; it has not been applied to Production.
- **PR #20 — migration 018:** bounded cleanup of old dedup/report-rate records, subscription rate limiting, removal of the non-functional human-check checkbox, and disabled client-controlled popularity ranking were added. The migration file is reviewed in GitHub only; it has not been applied to Production.
- **Seller product workflows:** single and bulk product entry, owner product editing, photos, visibility and stock actions are present in the frontend and RPC layer. Real Android Chrome seller upload/publish verification remains outstanding.
- **Storefront:** profile, shop descriptions, social links, seller avatar, logo and cover support are part of the seller storefront flow. No sample seller identity is generated.

## Production data and operational gates

The most recent Production read-back recorded in the Production Security Gate showed zero seller profiles, shops and products. The empty public catalogue is intentional.

The following items remain release gates and must not be reported as complete without an actual read-back/test:

- A real owner-approved seller signup/sign-in, persisted session, image upload, product insert and public storefront/WhatsApp journey on Android Chrome.
- Independent encrypted PostgreSQL and public/private Object Storage backups, plus a successful restore drill.
- Production SMTP delivery and email verification testing.
- Google OAuth credentials and live provider testing.
- Applying migrations 017 and 018 only after their separate database review/approval.
- Review of free-tier quotas and applicable data-protection requirements before unrestricted public onboarding.

## Historical context

Earlier design and hosting documents included Cloudflare Pages, Express, local JSON persistence and sample editorial images. Those describe earlier proposals or retired prototypes, not the current Render + Neon Production architecture.
