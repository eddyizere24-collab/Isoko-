# ISOKO Production Security & Operations Gate

Last checked: 2026-11-13

## Public Production service

- Public website: https://isoko-marketplace-9i69.onrender.com
- Hosting: Render Static Site, global CDN, public HTTPS URL.
- Git repository: https://github.com/eddyizere24-collab/Isoko-
- Production branch: `main`.
- Production deployment config: `render.production.yaml`.
- Database: dedicated Neon PostgreSQL project `isoko-marketplace`, production branch `isoko-production`.
- Public Auth, Data API, Function and public Object Storage URLs are set in Render as build-time variables. The Production build has no fallback to the setup branch.
- Render static hosting does not spin down due to inactivity. Neon Free compute may suspend after inactivity, but the database branch/data remain stored and the compute wakes when queried. Free-tier quotas and provider terms still apply.
- No paid hosting plan, card, domain purchase, prepaid AI credits or billing changes were made.

## Verified on 2026-11-13

- PR #2 merged into `main`: `d67942c56be7fd487a9f4638e4529e0799ddbaa3`.
- Production hosting config commit: `85684c83273009f0f857dce96578ce22f2da678f`.
- Live production database/API smoke-test commit: `a4dffb4d83aaf0f961c59d8aca1c196328af8966`.
- GitHub Actions run 43502552038 succeeded, including TypeScript, the setup and Production Neon API smoke tests, Vite production build and Node.js 24 Function bundle: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43502552038
- Render deployment `dep-dbrn7slgvrgc73bfmeb0` reported `live` after the Production CI commit.
- Production Neon Function `isokoapi` returned `healthy` for branch `isoko-production`, with Data API and Object Storage reported available.
- Production Neon Auth trusted origin is restricted to the public Production hostname. The setup/preview hostname was removed from Production Auth.
- Production Data API CORS is restricted to the Production hostname.
- Production Function CORS has the exact Production hostname in `ALLOWED_ORIGINS`.
- Production Object Storage has an empty private KYC bucket and an empty public assets bucket at launch.
- The Production database has zero admin, seller, shop, product, report and KYC records. No test identities or KYC documents were copied as real users.
- The Production database contains marketplace tables, functions, policies, public categories and Rwanda area reference data copied from the reviewed setup branch.

## Marketplace features present in the Production build

- Public buyer storefront, search/category routes, product/shop route handlers, cart and WhatsApp/phone contact flows.
- Seller pages for store management, product management, image upload, shop settings and analytics.
- Admin moderation, seller/KYC review, reports, campaigns and the Admin Intelligence workspace at `/admin/ubwenge`.
- The Admin Intelligence workspace currently uses privacy-limited SQL analytics and deterministic answers. It is not presented as a generative AI model; AI Gateway requires prepaid credits and none were purchased.
- Admin report replies can be saved and a prefilled WhatsApp message can be opened. Messages are not auto-sent.

## Production launch safety gates

### Public buyer storefront
- Public storefront is live and may be visited.
- The production catalogue begins empty. It must not show invented products, shops or sellers.

### Seller registration / KYC
- `VITE_ISOKO_SELLER_REGISTRATION_ENABLED=false` is deliberately set in `render.production.yaml`.
- The seller registration page is held closed on Production while independent encrypted backups and phone-number ownership verification are incomplete.
- The normal seller application collects national ID details, ID front/back images, a selfie, and store photo. These documents must not be accepted before the backup and recovery controls below are tested.
- Neon Auth currently uses phone-derived `@login.isoko.invalid` email identifiers and password sign-in. Actual SMS OTP / phone ownership verification is not configured.
- Reopen seller registration only after both controls below are live and tested, and after production file upload + private signed retrieval are end-to-end tested.

### Independent backup and restore
- Neon provider restore capability is not an independent offsite backup.
- An automated encrypted backup destination outside Neon has not been configured.
- A restore drill has not been completed for PostgreSQL plus public/private Object Storage objects.
- Do not claim this gate complete. Keep KYC registration disabled until an independent backup and restore process is operational.

### Admin bootstrap
- Production has no Admin account yet.
- A one-time bootstrap code must be issued privately to the owner and redeemed at `/admin/setup`.
- The owner must enter their own legal name, phone and private password. Never store or request that password in chat.
- The one-time code must be invalidated after the first successful claim.

### Remaining end-to-end checks
- Browser-based seller registration after backup/OTP gates.
- Image upload, asset reads and signed KYC retrieval.
- Full login/session persistence, seller writes, stock changes and moderation using real owner-created test accounts.
- Admin report resolution and analytics with actual records.
- Restore recovery from the independent backup.

## Operational rules

- Keep Production configured to `main` and the dedicated `isoko-production` Neon branch.
- Keep Preview and Setup separate; never switch Production environment variables to their URLs.
- Do not place secrets, access tokens, raw bootstrap codes, passwords, national IDs or private images in GitHub source, public bundles or logs.
- Do not add billing, paid plans or prepaid AI credits without the owner's separate budget decision.
- Do not modify AHABONA or its infrastructure as part of ISOKO work.
- A release gate is complete only when an actual test/read-back proves it.
