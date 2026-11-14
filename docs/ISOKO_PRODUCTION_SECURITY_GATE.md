# ISOKO Production Security & Operations Gate

Last checked: 2026-11-14 · seller onboarding, product workflows and brand review

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

## Completed feature phases on GitHub main

### Phase 1 — simple seller onboarding
- PR #3 is merged: https://github.com/eddyizere24-collab/Isoko-/pull/3
- Main feature commit: `187f02148dfc7ab6ac83e0c9fbfb88daa9c9dc11`.
- CI passed on PR head: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43562698240
- Basic seller registration requests email, password, one WhatsApp/contact phone and store name. Full name remains optional.
- The flow does not request national ID, TIN, ID photos, selfie, shop photo, district, sector, delivery details or other KYC material.
- Newly created shops start as active stores while the seller's identity remains explicitly unverified. This is not a claim that the seller's identity has been checked.
- Migration `013_basic_seller_onboarding` and the guarded registration RPC are present on both Setup and Production.
- The public `/abacuruzi` page was fetched and showed the simplified form. No signup was submitted during this inspection; actual signup, session persistence and seller database writes remain end-to-end tests.

### Phase 2 — seller product management
- PR #4 is merged: https://github.com/eddyizere24-collab/Isoko-/pull/4
- Main feature commit: `1ac77d6f09dcb00843aeb46e2c7188be84f02239`.
- CI passed on PR head: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43563557170
- Single-product creation accepts real seller-uploaded photos and requires at least one. The sample/demo product-photo selector was removed.
- Bulk entry accepts up to 10 products per batch; each product can have up to 5 images. Selecting multiple product photos creates separate product rows.
- Sellers can edit product details and photos, reorder/remove/add photos, hide/unhide products, mark sold/restore stock, share to WhatsApp, and delete only after confirmation.
- Migrations `014_seller_product_visibility` and `015_seller_product_status_actions` are applied to Setup and Production. SQL read-back confirms both RPCs are installed and the Production catalogue remains empty.
- Seller image upload and mutations have not yet been tested end-to-end with a real owner-created account.

### Phase 3 — ISOKO brand and Imigongo
- PR #5 is merged: https://github.com/eddyizere24-collab/Isoko-/pull/5
- Main feature commit: `91996085d0a78e180d456b4a723b82b9af8f70e0`.
- CI passed on PR head: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43565929352
- The multicolour sun mark uses coloured beads around a deliberately hollow centre, and the Imigongo-inspired green/red pattern is restrained on white surfaces.
- PWA icons, header, footer and home-page branding were updated. The CSS retains visible keyboard focus and reduced-motion support.

### Storefront authenticity — PR #6
- PR #6 merged: https://github.com/eddyizere24-collab/Isoko-/pull/6
- Merge commit: `b09f80c1c7abb8bac7fa518d40107c7595801aef`.
- CI passed: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43566803360
- Static fashion hero and category product-art photos were removed from the homepage. Shop cards no longer borrow a sample hero as a cover, and the empty catalogue explains that no demo products are shown.
- Real seller-uploaded shop covers, logos and product photos remain supported.

### Zero-demo-data cleanup — PR #7
- PR #7 removes the committed `data/db.json` fixture, which contained invented local accounts, KYC examples, stores, products, campaigns and analytics. It did not represent Production Neon data.
- The local store factory now starts with empty profiles, KYC, shops, products, reports, analytics and campaigns. Only reference categories and search synonyms remain seeded.
- All 13 unused sample marketplace JPGs are removed from the repository.
- The old local registration endpoint that accepted National ID and KYC images is retired; it no longer accepts or stores those details. Public signup remains the minimal Neon Auth flow.
- Shop detail pages no longer use a sample promotional image when a merchant has not uploaded a cover.
- Product WhatsApp links no longer fall back to a placeholder support number.
- Footer and help page only show WhatsApp support when a verified number is configured. Production `SUPPORT_WHATSAPP` is currently empty, so no unverified contact is advertised.
- Local campaign creation requires an actual uploaded image or HTTPS image URL; it no longer silently inserts a sample banner.
- PR #7 merged into `main`: https://github.com/eddyizere24-collab/Isoko-/pull/7
- Merge commit: `1e46644e85ce8cf053c5a079590958a20f07e634`.
- CI passed: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43567492024.
- The Production Neon data check still shows zero profiles, shops and products.
- Public read-back after PR #7 confirmed the help page no longer displays a placeholder WhatsApp number and the shared header/footer reflect the new brand. This verifies that Render served the PR #7 changes.

### Initial homepage rendering — PR #9
- PR #9 merged into `main`: https://github.com/eddyizere24-collab/Isoko-/pull/9
- Merge commit: `6bb07ab48c000b1fc8e7e2647d6daae3737fd7e7`.
- CI passed: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43568012678.
- The homepage no longer blocks its hero, brand mark and active category cards behind the initial database read. Product cards remain gated until real catalogue data arrives; an empty-catalogue message appears only after the read confirms zero products.
- This is a UI change only; it changes no Production database records or settings.
- Public read-back on 2026-11-14 confirmed that Render serves the new hollow-centre multicolour logo, the white/Imigongo homepage hero and active category cards, and a product-loading status instead of a page-wide skeleton.

### Truthful identity verification — PR #10
- PR #10 merged: https://github.com/eddyizere24-collab/Isoko-/pull/10
- CI passed: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43568423435
- Homepage store shelf now says "Amaduka ari kuri ISOKO", rather than claiming every store is verified.
- The green Verified seal is shown only for `identity_status='verified'`; pending, rejected and unverified shops have distinct non-verified labels.
- The Help FAQ now explains honestly that a new store may appear before its identity has been reviewed.
- Public read-back after merge confirmed the updated Help page.

### Email password recovery — PR #11
- PR #11 merged: https://github.com/eddyizere24-collab/Isoko-/pull/11
- Merge commit: `950aea0be43fafd09b76cf39f936338057f0308e`.
- CI passed: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43568720754
- Public request page: https://isoko-marketplace-9i69.onrender.com/ibagiwe-ijambo
- Public reset-token page: https://isoko-marketplace-9i69.onrender.com/ongera-ijambo
- The Production read-back on 2026-11-14 confirmed both pages are served by Render. The reset page without a token shows the expected invalid/missing-link state.
- The login page source includes a forgotten-password link. The public login HTML text extraction does not expose all controls, so the link itself has not been independently verified through an interactive browser test.
- Production and Setup Neon Auth have `revoke_sessions_on_password_reset=true`.
- Email/password signup and sign-in remain enabled; email verification at signup remains disabled. No claim is made that signup email addresses are verified.
- Neon Auth still uses its shared sender `auth@mail.myneon.app`. The password-reset request was not submitted to a real mailbox, custom Production SMTP is not configured, and receipt/deliverability of the reset email is not verified. Configure and test an owner-approved Production SMTP sender before claiming email delivery complete.

## Production launch safety gates

### Public buyer storefront
- Public storefront is live and may be visited.
- The production catalogue begins empty. It must not show invented products, shops or sellers.

### Basic seller registration / KYC
- The minimal Production seller signup is live at `/abacuruzi` and was publicly fetched on 2026-11-14. It requests email, password, one WhatsApp/contact number and a store name; full name is optional. No live signup was submitted, so persistence and session creation are still end-to-end checks.
- The same WhatsApp number is stored as the seller's contact phone; no duplicate phone-number field is required.
- The basic signup does not ask for a national ID, TIN, ID images, selfie, store photo, district, sector or delivery details.
- Full name is optional at signup. Remaining business and personal profile details can be completed later.
- New stores are publicly active with `identity_status='unverified'`. They must never receive the green identity-verified seal until actual identity review is completed.
- Email is the account sign-in identifier. Neon Auth currently does not require email verification and SMS/WhatsApp OTP is not configured; `email_verified` remains false unless Auth confirms it. Do not claim the email or phone is verified.
- The advanced KYC collection/review remains separate and must not be re-enabled until independent encrypted backups and a restore drill cover PostgreSQL plus private/public Object Storage.
- Google social sign-in is not enabled yet: the Neon OAuth provider record has no client ID/secret. Facebook OAuth is also not configured. Do not display active social-login buttons until real provider credentials are installed and tested.
- Email password-recovery pages and the reset flow are live in code and public routes. The actual reset email's delivery to a real mailbox is not yet verified because Production still uses Neon's shared SMTP sender; do not claim email deliverability until Production SMTP is configured and an approved inbox test passes.

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
