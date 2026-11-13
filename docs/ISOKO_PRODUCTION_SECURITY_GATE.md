# ISOKO Production Security Gate

ISOKO must not accept real seller registrations, national identity details, or product uploads on the public site until every required control below has been implemented and verified.

## Findings in the current GitHub `main`

- `src/server/store.ts` persists the entire database in `data/db.json` using local filesystem writes.
- `server.ts` stores uploaded files in the local `uploads/` directory.
- `src/server/seedData.ts` defines a custom 32-bit FNV-style password digest. This is not a password-storage algorithm suitable for production.
- The seed file contains deterministic demo admin/seller identities and passwords. These must never be activated in production.
- Seller registration collects a national ID number plus front/back ID images and a selfie. These are highly sensitive and must not be exposed in API responses, public image paths, logs, analytics, or frontend bundles.
- The old Supabase RLS migration refers to `auth.uid()`. It must not be copied blindly to Neon because the app's identity/session model is not Supabase Auth.
- The current browser stores an application bearer token. This session design needs an expiry, revocation, secure random token material, and safe handling; it must not rely on deterministic tokens generated from a weak password digest.

## Mandatory implementation gates

### 1. Durable application data
- Replace JSON-file persistence with PostgreSQL transactions.
- Use migrations checked into GitHub and apply them to the isolated Neon `isoko-setup` branch first.
- Keep foreign keys, uniqueness, constraints, indexes, and transaction boundaries.
- Seed only public catalog reference data. Never seed a working admin or seller password.
- Do not import demo people as real users.

### 2. Secure login and authorization
- Replace the 32-bit digest with Argon2id or scrypt using per-password salts and safe parameters.
- Keep Rwanda phone-number login/registration behavior unless a deliberate UX change is approved.
- Use cryptographically random, revocable server-side sessions or secure signed sessions with explicit expiry.
- Enforce seller ownership and admin/moderator roles on every private route.
- Add rate limiting and safe login error behavior. Do not trust client-supplied role/user IDs.

### 3. KYC and personal information
- Keep KYC object files only in `isoko-private-kyc`.
- Use short-lived signed upload/download URLs or server-proxied uploads.
- Encrypt national ID values before database storage or minimize retention so full ID values are not stored once verification no longer needs them.
- Never expose KYC image URLs publicly.
- Do not put national IDs, identity images, passwords, bearer tokens, or connection strings in GitHub, analytics, logs, or error messages.
- Enforce admin-only access and audit access to KYC records.

### 4. Product and shop media
- Store product/shop images in `isoko-public-assets` with immutable, versioned object keys.
- Validate content type, file signature, dimensions, and size server-side; recompress/rescale uploads for low-end Android users.
- Store object keys in PostgreSQL, not file bytes or temporary filesystem paths.
- Confirm delete/update flows do not remove an image still referenced by a product or shop.

### 5. Public API protection
- Authenticate every Neon Function route according to its caller type.
- Verify seller/admin ownership on writes.
- Restrict CORS to the Cloudflare Pages production and approved preview origins.
- Add input validation, upload quotas, rate limits, request-size limits, and safe error responses.
- Keep secrets in platform Function environment variables, never in the client build or GitHub source.

### 6. Backup and restore
- Automated, encrypted backups must go to an independent provider/destination.
- Backups must cover PostgreSQL plus private and public Object Storage metadata/objects.
- Provide documented recovery instructions and complete a restore test before seller onboarding.
- Test the restore without writing into the live production branch.

### 7. Release acceptance
- CI passes TypeScript, production build, migration checks, and automated security tests.
- Public buyer flows, seller registration/login, product upload, shop changes, reports, admin review, KYC access controls, and analytics are tested against the isolated setup branch.
- No demo credentials or personal identity data are present in the public build.
- A tested rollback plan exists.
- The owner is given the exact commit SHA, PR, CI run, and preview URL before production release.

A checklist item is complete only when a test or read-back proves it.
