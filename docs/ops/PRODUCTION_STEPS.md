# ISOKO Production steps requiring owner approval

These are Production-only steps. Do not apply migrations, deploy the Neon Function, change Auth settings, Render variables, or publish the frontend until the owner explicitly approves the release.

## Verified Production baseline — 2026-11-16

- Neon project: `isoko-marketplace` (`square-queen-83418379`)
- Production branch: `isoko-production` (`br-blue-bread-ba2wywua`)
- Database: `isoko`
- Migration `016_seller_profile_storefront_capacity` is present.
- Migrations `019`, `020`, `021`, and `022` are not recorded in Production.
- Production currently has 1 seller profile, 1 shop, and 1 active public product. That product is in the `ibindi` category; current Production has no active products in Inkweto, Imyenda, or Amasogisi. Do not create demo products to disguise that.
- Production has no valid `SUPPORT_WHATSAPP` setting. The frontend must not invent a support number.

## Read-only preflight checks

Run only after confirming project, branch, and database at the top of the Neon SQL Editor:

```sql
SELECT version
FROM public.schema_migrations
WHERE version IN (
  '016_seller_profile_storefront_capacity',
  '019_seller_upload_daily_quota',
  '020_seller_upload_quota_cap_alignment',
  '021_public_product_identity_status',
  '022_product_image_owner_prefix'
)
ORDER BY version;

SELECT
  to_regclass('public.seller_upload_daily_usage') AS quota_table,
  to_regprocedure('public.consume_seller_upload_quota_v1()') AS quota_function;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'auth_user_id', 'identity_status');
```

Expected current state: migration 016 is present, migrations 019–022 are absent, and the quota table/function are absent. The profile IDs and auth user IDs are text in this project. If the read-back differs, stop and re-inspect rather than replaying a migration.

## Ordered release migrations

### 019 — seller upload daily quota

File: `infra/neon/migrations/019_seller_upload_daily_quota.sql`

Creates the text-keyed quota table and an RPC that derives seller identity from Neon Auth `auth.user_id()`. It limits authenticated seller image upload attempts to 30 per seller per UTC calendar day. The browser must never supply a seller ID to this RPC.

### 020 — quota cap alignment

File: `infra/neon/migrations/020_seller_upload_quota_cap_alignment.sql`

Replaces the quota function with the 30-attempt implementation. This is included because the isolated QA branch read-back found an earlier function definition with a cap of 50. Apply after migration 019.

### 021 — public product identity status

File: `infra/neon/migrations/021_public_product_identity_status.sql`

Adds the seller's explicit `identity_status` to the nested shop JSON in `v_public_products`. It does not add a new public product column or expose KYC documents. It lets the frontend show the Isoko Verified seal only when identity status is actually `verified`.

### 022 — product image owner prefix

File: `infra/neon/migrations/022_product_image_owner_prefix.sql`

Replaces the seller create/update product RPCs so both full and thumbnail image keys must start with `products/<seller-profile-id>/`. The authenticated seller profile ID is derived inside the security-definer RPC; the browser cannot choose another seller's prefix. This migration does not rewrite existing product images.

### Apply only after explicit owner approval

1. Open the approved GitHub PR and review all four migration files.
2. In Neon Console, confirm project `isoko-marketplace`, branch `isoko-production`, and database `isoko`.
3. Apply migration 019 once, then read back its table, function, and marker.
4. Apply migration 020, then read back that `consume_seller_upload_quota_v1()` returns JSONB and uses `v_limit = 30`.
5. Apply migration 021, then read back that `v_public_products.shop` contains `identity_status` for each row.
6. Apply migration 022, then read back the create/update seller product RPCs and verify the `PRODUCT_IMAGE_OWNERSHIP_INVALID` guard is present.
7. Confirm the quota function ACL grants `authenticated` and does not grant `PUBLIC` or `anonymous`.
8. Do not paste database passwords, API keys, connection strings, or private seller information into GitHub or chat.

## Neon Function and frontend release gates

The feature Function source supports the distinct `logo` upload kind and calls the quota RPC before Object Storage writes. Deploy the matching Node.js 24 Function bundle only after migrations 019–021 have been verified in Production and the owner explicitly approves Function deployment. Deploy frontend code only from the reviewed, merged release head. Do not deploy the Function or frontend from an unmerged feature branch.

The Production smoke test must then verify:
- unauthenticated upload is rejected;
- non-seller roles cannot use seller image upload;
- seller avatar, logo, and cover save to their distinct paths;
- public image URLs render and reload;
- quota allows 30 attempts and denies the next attempt;
- unverified shops do not receive the Verified seal;
- a genuinely verified shop receives the seal on storefront and product cards;
- a seller cannot create or update a product using another seller's `products/<profile-id>/` image keys.

## Rollback note

Do not drop the quota table, remove quota history, or replace the public view with an earlier definition as a casual rollback. If uploads fail after release, disable seller image uploads at the Function level only through a reviewed hotfix and preserve quota records for audit.
