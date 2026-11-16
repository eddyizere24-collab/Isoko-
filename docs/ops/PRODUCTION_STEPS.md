# ISOKO Production steps requiring owner approval

This file documents Production-only steps. Do not run them until the owner has reviewed the matching PR and explicitly approved applying the migration.

## Seller image quota (migration 019)

Reason: the upload Function calls public.consume_seller_upload_quota_v1() before accepting seller image uploads. It allows 30 successful seller uploads per calendar day. If this migration is absent, the new Function must not be deployed because quota validation fails closed.

### Read-only checks before applying

In Neon Console on project isoko-marketplace, select branch isoko-production and database isoko, then run:

```sql
SELECT version FROM public.schema_migrations WHERE version = '019_seller_upload_daily_quota';
SELECT to_regclass('public.seller_upload_daily_usage') AS quota_table,
       to_regprocedure('public.consume_seller_upload_quota_v1()') AS quota_function;
```

Expected before applying: no migration row, and both quota_table and quota_function are null.

### Apply only after explicit owner approval

1. Open GitHub on the Android phone and open the approved Photos PR.
2. Review infra/neon/migrations/019_seller_upload_daily_quota.sql.
3. In Neon Console, confirm the selected branch is exactly isoko-production and database is isoko.
4. Open SQL Editor and paste the complete contents of the migration file from the approved PR. Run it once.
5. Re-run the read-only checks above. Confirm the migration row, table and function now exist.
6. Do not paste database passwords, API keys or connection strings into GitHub, chat or screenshots.

### Function deployment gate

The new isokoapi source calls the quota RPC and supports the separate logo upload kind. Deploy that Function only after migration 019 is verified in Production. The assistant must verify the branch, inspect the generated Node.js 24 bundle, and deploy it to Production only after the owner explicitly approves deployment. Do not deploy the Function from an unmerged feature branch.

### Rollback note

Do not drop the quota table or function as a casual rollback. If uploads fail after deployment, disable seller image uploads at the Function level only through a reviewed hotfix; preserve quota records for audit.
