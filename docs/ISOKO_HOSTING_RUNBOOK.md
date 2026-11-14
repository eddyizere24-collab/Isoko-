# ISOKO Hosting and Operations Runbook

## Live Production architecture

```
Browser / Android
    |
    v
Render Static Site (global CDN, HTTPS, public storefront)
    |
    | HTTPS API requests
    v
Neon Function (Node.js 24, production-branch scoped)
    |
    +---- Neon PostgreSQL (catalogue, sellers, shops, products, stock, analytics)
    |
    +---- Neon Object Storage
             +---- isoko-public-assets (public product/shop images)
             +---- isoko-private-kyc (private identity files)
```

- Public Production site: https://isoko-marketplace-9i69.onrender.com
- Frontend is built from GitHub `main` and published as a Render Static Site.
- Static Site is served by Render's static CDN and does not spin down after inactivity like a Free Web Service.
- Neon Free compute may pause when idle. That does not delete the database branch or its stored data; it wakes when a database request arrives.
- Production database: Neon project `isoko-marketplace`, branch `isoko-production`.
- Development/testing branch: `isoko-setup`. Preview may only use Setup. Never point Production environment values to Setup.

## Static-site deployment

- Blueprint: `render.production.yaml`
- Source branch: `main`
- Build: `bun install --frozen-lockfile && bun run build`
- Publish directory: `dist`
- SPA route fallback: rewrite `/*` to `/index.html`
- Render auto-deploys a new Static Site build after changes reach `main`.
- The existing separate Preview service uses `render.yaml` and the Setup branch. It is not Production and must not accept real identity documents.

## Change management

- Code changes: feature branch -> CI -> PR -> reviewed merge to `main` -> verify Render deployment status `live`.
- Schema changes: create additive migration -> apply to Setup -> verify constraints and grants -> apply separately to Production -> read back migration marker and security privileges.
- Production release proof requires exact commit SHA, successful CI link, Render deployment status and public URL check.
- Never make a billing/plan upgrade automatically. No paid service, domain, email/SMS provider, storage credits or AI credits should be added without budget approval.

## Environment and secrets

- Neon automatically injects branch-specific `DATABASE_URL` and Object Storage S3 credentials into Functions when configured.
- App secrets (session-signing key, KYC encryption key, etc.) must be generated and stored directly in the Neon Function environment through an approved secure setup flow.
- No production secrets belong in repository files, logs, or client-side `VITE_*` variables.
- The frontend may contain only public API base URLs and other explicitly public values.
- Every Pages build must set all four public environment values for the matching Neon branch:
  - `VITE_NEON_AUTH_URL`
  - `VITE_NEON_DATA_API_URL`
  - `VITE_NEON_FUNCTION_URL`
  - `VITE_NEON_PUBLIC_STORAGE_URL` (include the branch endpoint and `/isoko-public-assets/` bucket path).
- Feature/preview builds may use only the isolated `isoko-setup` branch values. Production builds must use a separately reviewed, protected production Neon branch after its schema, Auth, Function, Object Storage, backup, and security gates are ready.
- `src/lib/neon.ts` intentionally falls back to setup URLs only in Vite development. A production bundle with missing environment values fails closed instead of silently connecting to test data. Never copy setup-branch endpoints into production Pages settings.

## Current Production hosting (2026-11-14)

- Public Production URL: https://isoko-marketplace-9i69.onrender.com
- Hosting: Render Static Site on the Free static-site tier, served from the global CDN; it is not a free web-service process that spins down after inactivity.
- Production source: GitHub `main`; deployment config: `render.production.yaml`.
- Production data: Neon branch `isoko-production`; Preview and Setup remain separate.
- Production Static Site is live and the Production Neon Function health endpoint reports `healthy`.
- Basic seller registration is being enabled with email/password, WhatsApp/contact phone, and store name. No National ID or KYC files are collected in this first step.
- Newly opened stores use an explicit `identity_status='unverified'`; public verified seals are shown only after real identity review.
- Do not change Production environment variables to Preview/Setup endpoints.

## Phase 1: minimal seller onboarding

Required inputs: email, password, Rwanda WhatsApp/contact number, store name, and acceptance of the platform rules. Full name is optional. Location, business description, delivery details, TIN, National ID and KYC images are not required to open the store; they are later profile-completion items.

The seller registration RPC reads the email from the authenticated Neon Auth user rather than trusting a client-supplied email. It creates an active seller profile and an active store, records that identity is unverified, and creates no KYC record. The existing 24-hour registration draft still gates first-time seller profile creation. Anonymous users cannot invoke the registration RPC.

Email verification, phone ownership verification, Google/Facebook social login and email password recovery are not yet live. Google requires an actual OAuth client ID/secret; Facebook isn't exposed by the currently connected Neon OAuth configuration tools. No fake or nonfunctional social buttons should be displayed.

## Backups

Before launch, implement encrypted backups to an independent destination. Neon Free's single manual snapshot and six-hour restore history are not a complete disaster-recovery plan. Record a scheduled cadence, retention period, backup integrity check, restore procedure, and last successful restore test.

## Change management

- Code changes: feature branch -> CI -> draft PR -> review -> explicit release decision.
- Schema changes: test branch migration -> data/security verification -> approved migration to default branch.
- Deployments: preview first, then explicitly reviewed production deploy.
- Never make a billing/plan upgrade automatically.
