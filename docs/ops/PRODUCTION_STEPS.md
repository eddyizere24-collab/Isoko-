# ISOKO Production steps requiring owner approval

This file records read-only Production verification and the exact Production-only change steps. Do not apply migration 019, deploy the Function, or change Render settings until the owner has reviewed the matching PR and explicitly approved the release.

## Verified Production state — 2026-11-16

- Neon project: `isoko-marketplace` (`square-queen-83418379`)
- Production branch: `isoko-production` (`br-blue-bread-ba2wywua`)
- Database: `isoko`
- Migration `016_seller_profile_storefront_capacity` is already applied.
- `profiles.avatar_key` and `profiles.bio` exist.
- `shops.social_links` exists. Social links are a shop field, not a profile field.
- `v_public_shops.seller_avatar_path` exists. The actual public view is `v_public_shops`, not a physical `v_public_bootstrap.seller_avatar_path` column.
- `public.seller_upload_daily_usage` and `public.consume_seller_upload_quota_v1()` are absent in Production.
- Migration `019_seller_upload_daily_quota` is not recorded in Production.

### Read-only checks for migration 016

Run in Neon SQL Editor with project `isoko-marketplace`, branch `isoko-production`, database `isoko`:

```sql
SELECT version
FROM public.schema_migrations
WHERE version = '016_seller_profile_storefront_capacity';

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles' AND column_name IN ('avatar_key', 'bio'))
    OR (table_name = 'shops' AND column_name = 'social_links')
    OR (table_name = 'v_public_shops' AND column_name = 'seller_avatar_path')
  )
ORDER BY table_name, column_name;
```

Expected: the migration marker is present and the four columns listed above are present. Do not apply migration 016 again.

### Read-only checks for migration 019

```sql
SELECT version
FROM public.schema_migrations
WHERE version = '019_seller_upload_daily_quota';

SELECT
  to_regclass('public.seller_upload_daily_usage') AS quota_table,
  to_regprocedure('public.consume_seller_upload_quota_v1()') AS quota_function;
```

Expected before applying: no migration row and both returned object names are null.

## Seller image quota — migration 019

The quota is 30 authenticated upload attempts per seller per UTC calendar day. Each authenticated attempt consumes one count before the Object Storage write. A later storage error does not refund the attempt; this keeps retries from bypassing the server-side abuse limit. The RPC derives the seller from `auth.user_id()`; it does not accept a seller ID from the browser.

### Apply only after explicit owner approval

1. Open GitHub on the Android phone and open the approved Photos PR.
2. Review `infra/neon/migrations/019_seller_upload_daily_quota.sql`.
3. In Neon Console, confirm the selected project is `isoko-marketplace`, branch is exactly `isoko-production`, and database is `isoko`.
4. Open SQL Editor and paste the complete migration file from the approved PR. Run it once.
5. Re-run the read-only checks above. Confirm the migration marker, table and function now exist.
6. Do not paste database passwords, API keys or connection strings into GitHub, chat or screenshots.

### Function deployment gate

The new `isokoapi` source calls the quota RPC and supports the separate `logo` upload kind. Deploy the matching Node.js 24 Function bundle only after migration 019 is verified in Production and the owner explicitly approves that deployment. Do not deploy the Function from an unmerged feature branch.

### Rollback note

Do not drop the quota table or function as a casual rollback. If uploads fail after deployment, disable seller image uploads at the Function level only through a reviewed hotfix; preserve quota records for audit.
