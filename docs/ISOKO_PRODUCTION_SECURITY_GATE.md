# ISOKO Production Security & Operations Gate

Last checked: 2026-11-14 · Phase 2 product workflow review

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

## Phase 2 product-management implementation (feature branch)

The following changes are implemented on `feature/isoko-products-phase2-20261114`, pass CI, and are not part of Production `main` until PR merge:

- Single product creation remains available, with 1–5 real seller-uploaded photos. The demo/sample photo selector was removed.
- Bulk product entry accepts up to 10 products in one batch. Multiple selected photos create separate product rows; each product can receive up to 5 photos. Batch items share category, condition and sizes to reduce repeated phone input.
- Each product row has its own name, price, optional old price and description. Saves are sequential; successful products remain marked as saved while failed rows retain their errors for retry.
- Seller full edit now supports add/remove/reorder photos while keeping at least one photo, alongside the existing name, pricing, condition, brand, description and size/stock fields.
- Sellers can share a product directly from their product list via WhatsApp; share analytics are recorded.
- Sellers can hide/unhide their own products. Hiding preserves the previous state (draft, active or sold-out) and unhide restores that state. A seller cannot unhide an Admin-moderated item.
- Mark-sold and restore-stock actions now have a dedicated owner-checked database RPC. Only the authenticated owner can change the product status.
- Delete now requires an explicit confirmation. Product ownership remains enforced in database RPCs.
- Neon migrations `014_seller_product_visibility` and `015_seller_product_status_actions` are applied to Setup and Production. Read-back confirms both migrations, authenticated execution, anonymous denial, and zero seller/product/identity rows in both branches.
- CI passed on branch head `0d333c95aa6cf15a05feb6cf795da46edd2feb9d`: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43563400531

Do not describe Phase 2 as live on the public site until its PR is merged and Render reports a new `live` deployment.

## Production launch safety gates

### Public buyer storefront
- Public storefront is live and may be visited.
- The production catalogue begins empty. It must not show invented products, shops or sellers.

### Basic seller registration / KYC
- The minimal Production seller signup is being enabled with a real email/password account, one Rwanda WhatsApp/contact number, and a store name.
- The same WhatsApp number is stored as the seller's contact phone; no duplicate phone-number field is required.
- The basic signup does not ask for a national ID, TIN, ID images, selfie, store photo, district, sector or delivery details.
- Full name is optional at signup. Remaining business and personal profile details can be completed later.
- New stores are publicly active with `identity_status='unverified'`. They must never receive the green identity-verified seal until actual identity review is completed.
- Email is the account sign-in identifier. Neon Auth currently does not require email verification and SMS/WhatsApp OTP is not configured; `email_verified` remains false unless Auth confirms it. Do not claim the email or phone is verified.
- The advanced KYC collection/review remains separate and must not be re-enabled until independent encrypted backups and a restore drill cover PostgreSQL plus private/public Object Storage.
- Google social sign-in is not enabled yet: the Neon OAuth provider record has no client ID/secret. Facebook OAuth is also not configured. Do not display active social-login buttons until real provider credentials are installed and tested.
- Password recovery through email is a remaining account-security task; until verified and tested, do not claim email recovery is live.

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
