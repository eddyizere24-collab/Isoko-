# ISOKO Hosting Decision (updated 2026-11-14)

This is the current deployment record. It replaces the earlier Cloudflare Pages proposal.

## Production architecture

- **Frontend:** Render Static Site at https://isoko-marketplace-9i69.onrender.com
- **Source repository:** https://github.com/eddyizere24-collab/Isoko-
- **Production source branch:** `main`
- **Render build configuration:** `render.production.yaml`
- **Frontend stack:** Vite, React 19, TypeScript and Tailwind CSS 4
- **Backend:** dedicated Neon project `isoko-marketplace`, project ID `square-queen-83418379`
- **Production database branch:** `isoko-production` (database `isoko`)
- **Setup branch:** `isoko-setup`, isolated from Production
- **Backend services:** Neon PostgreSQL, Neon Auth, the `isokoapi` Neon Function, and S3-compatible Object Storage
- **Media buckets:** public product/store assets and a separate private KYC bucket

A push to `main` triggers the Render static-site deployment. Render serves the compiled Vite assets; it is not running the old Express server or storing application records on a local filesystem.

## What is actually deployed

The public website is reachable on the Render URL above. It serves the buyer-facing catalogue and the seller/auth routes. The app's data, authentication and object uploads are connected to the dedicated Neon Production branch through build-time Render environment variables.

The public catalogue is intentionally empty until real sellers publish real products. It must not be populated with demo shops, demo accounts or sample listings.

The website being reachable does **not** mean that seller onboarding has passed a complete real-user launch test. Sign-up/session restoration, owner-only image uploads, product creation, public product display and WhatsApp contact still require an end-to-end run with an owner-approved test account and a real Android Chrome device.

## Deployment and data safety rules

1. Keep Render Production connected to `main` and the Neon `isoko-production` branch. Preview/Setup URLs must never be placed in Production variables.
2. Do not place credentials, user tokens, passwords, OAuth secrets, private identity documents or Admin bootstrap codes in Git.
3. Do not reuse the IWACU RWANDA Supabase project or modify AHABONA infrastructure.
4. Do not enable billing, paid plans, prepaid credits or a custom domain without the owner's separate approval.
5. Do not apply SQL migrations to Production as part of a code PR unless the owner explicitly approves that database change.

## Current Production gates and known limitations

As of the latest read-back recorded in `docs/ISOKO_PRODUCTION_SECURITY_GATE.md`:

- Production has no real seller, shop or product records. The public catalogue remains empty by design.
- Migrations 017 (server-side product validation) and 018 (abuse-rate limits and cleanup) are code-reviewed migrations only; neither is applied to Production by this work.
- An encrypted, independent backup destination and full PostgreSQL + Object Storage restore drill are not yet operational. Do not collect KYC material until that gate is complete.
- Production Google OAuth credentials are not configured. The Google button stays hidden unless `VITE_GOOGLE_AUTH_ENABLED=true` is deliberately configured after provider setup and testing.
- Production custom SMTP, email verification at signup and WhatsApp/SMS OTP are not confirmed complete.
- A real seller journey using an owner-created test identity and Android Chrome has not been completed.
- Neon Free compute may suspend after inactivity and wake when queried. This is not a substitute for independent backups, and free-tier quotas are not unlimited.

## Earlier hosting proposals

- Cloudflare Pages/GitHub Pages were considered, but are not the current production frontend.
- Oracle Cloud resources were not created.
- The Supabase projects connected to other work belong to other projects and must not be reused for ISOKO.
- The old Express + local JSON/file runtime is retired and is removed from this repository by the cleanup change associated with this document.

## Release decision

The Render site is publicly reachable, but do not describe ISOKO as fully ready for unrestricted seller onboarding until the authentication, upload/product publishing, backup/restore and browser end-to-end gates above have passed.
