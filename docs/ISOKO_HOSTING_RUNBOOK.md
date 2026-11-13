# ISOKO Free Hosting Runbook

## Architecture

```
Browser / Android
    |
    v
Cloudflare Pages Free (React + Vite static build)
    |
    | HTTPS API requests
    v
Neon Function (Node.js 24, branch-scoped)
    |
    +---- Neon PostgreSQL (catalog, sellers, shops, stock, analytics)
    |
    +---- Neon Object Storage
             +---- isoko-public-assets (public product/shop images)
             +---- isoko-private-kyc (private identity files)
```

The Cloudflare Pages Git integration will be authorized for this repository only. Production uses `main`; feature branches receive preview deployments. Neon `isoko-setup` is the isolated branch for schema/API implementation and tests. The Neon default `main` branch remains empty until a reviewed release.

## Local storage migration

The current Express backend must not be deployed with its JSON-file store or local `uploads/` filesystem. These will be replaced with Postgres repositories and Neon Object Storage helpers. Vite builds the browser app into `dist/`; Cloudflare Pages publishes that directory.

## One-time Cloudflare connection step

When the frontend is ready for hosting:
1. Sign in to Cloudflare using the owner's existing account or create one on the Free plan.
2. Verify the email address.
3. Authorize the Cloudflare Pages GitHub app for this repository only.
4. Create a Pages project with repository `eddyizere24-collab/Isoko-`, production branch `main`, build command `bun run build`, and output directory `dist`.
5. Set the production and preview API base URL to the reviewed Neon Function URL.
6. Confirm the first Pages build is successful and read the generated `*.pages.dev` URL.
7. Do not add a custom domain until the production checklist is passed.

This one-time GitHub App authorization must be completed by the account owner. ChatGPT can then continue managing code and reviewing GitHub build status through the connected GitHub tools.

## Public preview deployment (Render)

A separate, explicitly labelled preview is prepared in `render.yaml` on the implementation branch. It serves the Vite frontend over Render's static-site CDN and connects only to the isolated Neon `isoko-setup` branch. It does not point to Neon `main` and does not receive production data.

- Build: `bun install --frozen-lockfile && bun run build`
- Publish directory: `dist`
- SPA route fallback: rewrite `/*` to `/index.html`
- Preview banner is visible to visitors.
- Seller registration and KYC submission are disabled on this preview, so visitors cannot send real National ID or identity files to the test branch.
- Product browsing, layout, routing, and the Admin interface can be checked against the isolated test backend.

The Render account currently exposes one workspace, `izere's workspace`. **Do not create a Render service until the owner confirms that this is the workspace to use.** After confirmation, create the Render Blueprint using this repository and branch, review the proposed static-site resource, and apply it. Then add the generated Render origin to the setup branch's Neon Auth trusted origins and smoke-test HTTPS routes, Auth, Data API, and image access.

This is only a public preview. It is not the final production storefront, and it must not collect real seller KYC or customer data.

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

## Backups

Before launch, implement encrypted backups to an independent destination. Neon Free's single manual snapshot and six-hour restore history are not a complete disaster-recovery plan. Record a scheduled cadence, retention period, backup integrity check, restore procedure, and last successful restore test.

## Change management

- Code changes: feature branch -> CI -> draft PR -> review -> explicit release decision.
- Schema changes: test branch migration -> data/security verification -> approved migration to default branch.
- Deployments: preview first, then explicitly reviewed production deploy.
- Never make a billing/plan upgrade automatically.
