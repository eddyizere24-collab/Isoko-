# ISOKO Production status and operational steps

Last verified: **2026-11-16**  
This document describes the live Production deployment after the 2026-11-16 release. It is not a migration instruction to replay work already applied.

## Current live Production snapshot

- Website: https://isoko-marketplace-9i69.onrender.com
- Git repository: https://github.com/eddyizere24-collab/Isoko-
- Production branch: `main`
- Live commit: `1f46194c625537b0b3cbcdc72153a5695d8b2856`
- Render deployment: `dep-dbt9qjvf3r2c73f8b8tg`, status `live`, finished `2026-11-16T06:06:23Z`
- Render service: `isoko-marketplace-9i69`, service ID `srv-dbrn6tjbc2fs73ckgojg`
- Neon project: `isoko-marketplace` (`square-queen-83418379`)
- Production branch: `isoko-production` (`br-blue-bread-ba2wywua`)
- Database: `isoko`
- Neon Function: `isokoapi`, deployment **#3**, `nodejs24`, status `completed`
- Production Function health: `/health` returns `status=healthy`, `branch=isoko-production`, `databaseApi=true`, `objectStorage=true`
- Production currently contains exactly **1 seller profile, 1 shop and 1 product**, which belong to the owner's real test account. The single product is active and in `ibindi`; no active items were found in Inkweto, Imyenda or Amasogisi. Never delete, change or replace this account/data for a visual test. Never add demo data.
- The seller's identity status is `unverified`. Seller approval is not identity verification.
- There is no configured valid `SUPPORT_WHATSAPP`. Do not invent a support number.
- Google OAuth Client ID/Secret are null in Production Neon Auth. Google sign-in stays disabled.
- Email/password sign-in is enabled. Email verification on sign-up/sign-in and `require_email_verification` are false. Do not claim that sign-up email addresses are verified.
- The existing Neon shared sender is `auth@mail.myneon.app`; delivery to a real mailbox and custom SMTP have not been verified.
- No Production Admin profile appeared in the current profile role/status read-back.

## Production migrations: already applied

A read-only query on the live Production branch confirmed migration markers **016 through 025**, inclusive. Do not replay any of these migrations.

| Migration | Purpose / final Production behavior |
|---|---|
| 016 `seller_profile_storefront_capacity` | Seller/shop capacity base used by the current product workflow |
| 017 `server_side_product_validation` | Validates product names (5–60 characters), rejects phone numbers and links in name/description, validates price and description length, active category, image count and variants |
| 018 `abuse_hardening` | Adds throttling/deduplication to selected public report, subscription and event RPCs; this is not a trusted-IP firewall for every anonymous RPC |
| 019 `seller_upload_daily_quota` | Creates server-side seller upload accounting, keyed by authenticated Neon Auth seller identity |
| 020 `seller_upload_quota_cap_alignment` | Aligns the daily quota function to its then-intended cap; superseded by 025's current limit |
| 021 `public_product_identity_status` | Exposes the seller's explicit `identity_status` in nested public product shop JSON; never exposes KYC documents |
| 022 `product_image_owner_prefix` | Requires full and thumbnail product image keys to use the authenticated seller's `products/<profile-id>/` prefix |
| 023 `seller_upload_burst_limit` | Adds a per-seller rolling 60-second upload counter; its original limit is superseded by 025 |
| 024 `product_rpc_validation_security_definer` | Reconciles 017 and 022: retains 017's product validation together with 022's image ownership guard under `SECURITY DEFINER` |
| 025 `seller_upload_limits_for_real_listing` | Current server-side per-seller limits: **300 original photo uploads per UTC day and 30 per rolling 60 seconds** |

The Function deliberately does not consume an additional quota attempt for the paired `thumb` upload. It consumes quota for the original seller photo, then accepts the corresponding thumbnail separately. The quota identity is derived from the authenticated Neon Auth session, not from a browser-supplied seller ID.

### Read-only Production verification

Run only after confirming the Neon project, branch and database shown above. This SQL reads migration markers and row counts; it does not update data:

```sql
SELECT version
FROM public.schema_migrations
WHERE version BETWEEN
  '016_seller_profile_storefront_capacity'
  AND '025_seller_upload_limits_for_real_listing'
ORDER BY version;

SELECT
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM public.shops) AS shops,
  (SELECT count(*) FROM public.products) AS products,
  (SELECT count(*) FROM public.products WHERE status='active') AS active_products;
```

Expected current result: markers 016–025; profiles=1, shops=1, products=1, active_products=1. Stop and inspect if the read-back changes. Do not replay DDL to “make it match”.

## Backup status and limits

- The owner-created Neon branch snapshot `isoko-production-backup-before-release-20261116` exists as `br-falling-darkness-ba6qwviu`.
- It is a child of Production `br-blue-bread-ba2wywua`, created at `2026-11-16T05:57:12Z`, with parent timestamp `2026-11-16T05:56:52Z`.
- The backup branch itself has no compute endpoint. A separate child branch `isoko-restore-drill-20261116` (`br-broad-feather-ba73vmad`) was created from that snapshot, queried successfully, and then its 0.25 CU compute was suspended.
- The restored PostgreSQL clone read back 1 seller profile, 1 shop and 1 active product, matching Production. It contained the migration history through 016 only, as expected for a snapshot taken before 017–025. Its original product row remained the same ID and category.
- Neon Storage was enabled on Production, backup and restore clone. The public-assets bucket had 11 objects in each; object-size/ETag metadata matched between Production, backup and clone. The private KYC bucket had 0 objects in all three.
- Neon Auth was **not enabled on the restore clone**, so user identities, provider configuration, email settings and session restore were not tested. The drill proves PostgreSQL branch cloning and Object Storage metadata parity only, not a complete identity/auth restore. Preserve the original backup branch.

## Production deployment safety

Do not apply further Production SQL, deploy a Function, alter Neon Auth, change Render variables, change DNS or publish a new frontend unless the owner explicitly approves that specific Production action.

For future releases:
1. Review the exact PR diff and its report.
2. Require current CI to pass on the exact head SHA.
3. Confirm the approved PR merge SHA is the intended production release.
4. Confirm Render's deploy is `live` and its commit SHA equals the approved `main` commit.
5. Run the read-only Production smoke checks, including Function health, public routes, identity-seal behavior and public contact links.
6. Do not use the Production seller account to test signup, upload, publishing, KYC or destructive actions. Use a separate isolated QA branch/account.

## Current security follow-ups

- Real authenticated QA seller signup, avatar/logo/cover persistence, three-photo product publish and 10×3 bulk upload remain unverified.
- QA currently has zero populated KYC rows; owner/admin KYC access behavior has not been demonstrated end-to-end.
- Migration 025's current 300/day and 30/minute limits were tested against a disposable clone of QA with the 025 function installed: 300th allowed, 301st denied as daily; 30th in 60s allowed, 31st denied as rate with retry_after_seconds=60. Both test sections were rolled back and the clone quota table read back 0 rows. The clone compute was suspended. Actual image uploads and the full Function `thumb` path still require the authenticated seller E2E.
- Email verification is disabled; delivery has not been verified. A publish-only verified-email gate must not be enabled until a real QA email journey is proven.
- Multi-device session revocation and admin recovery are not proven. Production has no Admin profile in the current read-back.
- GitHub main branch protection is not confirmed. The connected GitHub app could read repository rulesets (none were returned) but classic protection access returned 403; set/verify it in GitHub repository Settings with a required CI check.
- PostgreSQL branch clone and public/private Storage metadata parity were rehearsed from the preserved backup; Neon Auth was not enabled on the clone, so full account/session restore remains untested.
- Google sign-in is disabled until real Google credentials exist and the QA OAuth round trip succeeds.

## Production smoke-test constraints

- Unauthenticated upload should return 401.
- A seller may upload only to their own role-specific prefix.
- A thumbnail paired to a full photo must not consume a second upload quota attempt.
- Product image keys must match `products/<authenticated-profile-id>/`.
- Unverified identity must never display the Verified seal on a shop page or product card.
- No missing seller/support contact must turn into a fake WhatsApp URL.
- Never run a destructive smoke test against the owner's Production profile, shop, product or images.
