# ISOKO — Production changes: photos and upload quota

Date: 2026-11-16  
Status: prepared instructions only. No Production writes, Function deployment, or environment changes have been performed.

## Confirmed Production read-back

Project: `isoko-marketplace`  
Neon project id: `square-queen-83418379`  
Production branch: `isoko-production` (`br-blue-bread-ba2wywua`)  
Database: `isoko`

A read-only query on 2026-11-16 returned:

- `profiles.avatar_key`: present
- `profiles.bio`: present
- `shops.social_links`: present
- `v_public_shops.seller_avatar_path`: present
- `schema_migrations` contains `016_seller_profile_storefront_capacity`

Therefore migration 016 is already applied in Production. Do not apply it again. The earlier suspicion that `profiles.social_links` or a physical `v_public_bootstrap.seller_avatar_path` column should exist was incorrect: social links belong to `shops`, and seller avatar is exposed by `v_public_shops`. `v_public_bootstrap` returns one JSON `payload` column.

The Production public storage endpoint was read back as:

`https://br-blue-bread-ba2wywua.storage.c-8.eu-central-1.aws.neon.tech`

The Render production public storage base is the same host with bucket path `/isoko-public-assets/`. The Production CSP `img-src` contains that same storage host. No environment variable or CSP change is indicated by this check.

## Read-only SQL checks

Run these in Neon SQL Editor with the database set to `isoko` and branch explicitly set to `isoko-production`. These statements only read metadata.

### Check migration 016 and its columns

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

Expected: one migration marker and four column rows.

### Check whether migration 019 is installed

```sql
SELECT
  to_regclass('public.seller_upload_daily_usage') AS quota_table,
  to_regprocedure('public.consume_seller_upload_quota_v1()') AS quota_function,
  EXISTS (
    SELECT 1
    FROM public.schema_migrations
    WHERE version = '019_seller_upload_daily_quota'
  ) AS migration_019_recorded,
  CASE
    WHEN to_regclass('public.seller_upload_daily_usage') IS NULL THEN false
    ELSE (
      SELECT c.relrowsecurity
      FROM pg_class c
      WHERE c.oid = 'public.seller_upload_daily_usage'::regclass
    )
  END AS quota_table_rls_enabled,
  CASE
    WHEN to_regprocedure('public.consume_seller_upload_quota_v1()') IS NULL THEN false
    ELSE has_function_privilege(
      'authenticated',
      'public.consume_seller_upload_quota_v1()',
      'EXECUTE'
    )
  END AS authenticated_can_execute_quota;
```

Expected after migration 019: quota table and function are present, the migration marker is true, RLS is true, and authenticated can execute the quota function.

## Changes requiring owner approval

### Migration 019 — QA first, Production only after approval

Migration file: `infra/neon/migrations/019_seller_upload_daily_quota.sql`

It creates a private per-seller daily usage counter and a `SECURITY DEFINER` RPC. The RPC derives the seller from `auth.user_id()`; it does not accept a seller id from the browser. The assumed starting quota is 50 validated upload attempts per seller per UTC day. Failed object-storage writes after the quota check still consume an attempt; this is intentionally conservative and should be reviewed during QA.

**QA status on 2026-11-16:** migration 019 has already been applied to isolated branch `isoko-full-flow-qa-20261114`. Read-back confirmed the table, function, migration marker, RLS, authenticated execute grant and lack of anonymous execute. The updated `isokoapi` Function bundle was deployed there as deployment 3 and read back as `completed`. No real upload or authenticated quota-boundary test has yet been performed.

For a fresh QA branch, or when repeating the migration in a new isolated branch:

1. On an Android phone, open the repository file `infra/neon/migrations/019_seller_upload_daily_quota.sql` in GitHub.
2. Use the GitHub file menu to copy the complete SQL text. Do not edit the file or change any values.
3. Open Neon Console and choose project `isoko-marketplace`.
4. Select the isolated QA branch you intend to use (for the current QA branch, `isoko-full-flow-qa-20261114`), database `isoko`, then open SQL Editor.
5. Paste the migration SQL and run it once. If Neon reports an error, stop. Do not try fragments or run it against Production.
6. Run the read-only migration 019 check above on that same QA branch. Confirm all expected values before testing uploads.
7. Test the avatar, logo, cover and product upload flows on a QA seller account. Check that the 51st upload attempt for that seller on the same UTC day is rejected with the Kinyarwanda daily-limit message, and that a different seller has a separate count.
8. Only after QA evidence and Claude's review, decide whether to approve Production migration 019. Do not apply it to Production merely because the PR exists.

### Neon Function deployment order

The current Production Function read-back on 2026-11-16 showed `isokoapi` deployment 2, created 2026-11-14. That deployed version does not contain the new `logo` kind or the quota RPC call from this PR branch.

The updated Function must be deployed only after the quota migration has been approved and applied to the target branch. Do not merge a frontend release that sends upload kind `logo` before the target Function accepts that kind. The GitHub Actions workflow builds a ZIP artifact named `isoko-neon-function-bundle`; use the artifact built from the reviewed commit, not a locally edited source file. Keep the current `ALLOWED_ORIGINS` environment value and all existing Neon-injected storage credentials unchanged. Do not copy secrets into GitHub or chat.

For Production, the owner must first approve the exact migration and Function release in writing. The Function deployment and the public static-site merge are separate release steps and must be verified independently. If the Neon Console deployment screen does not clearly identify branch `isoko-production`, stop instead of deploying.

## Android-only safe navigation

- GitHub PR links open in the GitHub app or browser; review the changed files and CI status before using Merge.
- Neon Console: confirm the project name, branch name and database name at the top before opening SQL Editor.
- Never paste the migration into the `main` branch's default database by mistake.
- Never use the Production SQL Editor for QA.
- Do not change Render environment variables or deploy settings for this photo change.
- Do not change billing, DNS, OAuth credentials or backup settings as part of this PR.

## Release evidence required

Before a Production release can be called complete, attach the migration 019 read-back, Function deployment status/read-back, green GitHub CI, Android Chrome upload evidence for avatar/logo/cover, and a public storefront read-back. No such Production release evidence exists yet.
