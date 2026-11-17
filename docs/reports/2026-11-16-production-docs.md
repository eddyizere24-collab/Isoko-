# ISOKO Production docs alignment

Date: 2026-11-16  
Live commit documented: `1f46194c625537b0b3cbcdc72153a5695d8b2856`

## Changes
- Updated `docs/ops/PRODUCTION_STEPS.md` to reflect the live Render deployment, migration markers 016–025, Function deployment #3, current seller/shop/product counts, identity state, OAuth and email verification settings, and the preserved backup branch.
- Rewrote `docs/security/ACCOUNT_AUDIT_2026-11-16.md` so the audit separates proven QA tests, Production read-backs, code-only checks, and unproven E2E controls.
- Updated `docs/ISOKO_PRODUCTION_SECURITY_GATE.md` to make the 2026-11-16 live state authoritative and to avoid older zero-record/migration-pending statements being read as current.
- Added rules that require current migration read-back, describe the 300/day and 30/minute upload quota accurately, preserve the backup branch, and keep owner Production data out of QA.

## Verified evidence used
- Production migration markers 016–025 read from `public.schema_migrations`.
- Production profile grouping returned one approved seller profile with `identity_status=unverified`.
- Neon Function `isokoapi` current deployment #3 is `completed`, Node.js 24; direct `/health` response is `healthy`.
- Public screenshot QA run #43815618048 saved 36 screenshots and route/language observations.
- Backup branch `br-falling-darkness-ba6qwviu` exists, parent Production branch `br-blue-bread-ba2wywua`, created before the release. It has no compute endpoint; a query-based parity/restore drill could not be run. Object Storage restore is not proven.

## Explicitly not claimed
- The current quota boundaries 300/301 and 30/31 have not been stress-tested after migration 025.
- Real Android seller image uploads, publishing and 10×3 bulk entry remain untested.
- KYC access testing has no populated QA rows.
- Email delivery, verified-email publish gating, multi-device session revocation, Admin recovery and full media restore remain outstanding.
- GitHub main branch protection could not be confirmed using the connected GitHub app (rulesets read empty; classic protection read 403).

No Production database, Function, Neon Auth, Object Storage, Render configuration or seller data was changed by this documentation PR.


## PostgreSQL and Storage restore-clone drill (follow-up)

- Preserved backup branch: `br-falling-darkness-ba6qwviu` (`isoko-production-backup-before-release-20261116`).
- Created child clone from the backup: `br-broad-feather-ba73vmad` (`isoko-restore-drill-20261116`).
- Read-only SQL on the clone returned 1 profile, 1 shop and 1 active product, matching the Production row counts; the original product id remained present.
- The clone's migration markers ended at `016_seller_profile_storefront_capacity`; it correctly did not contain 017–025, because the backup snapshot predates those migrations.
- Neon Storage was enabled on Production, backup and clone. The public bucket held 11 objects in each; sorted size+ETag metadata matched across all three. The private KYC bucket had 0 objects on each.
- Neon Auth was not enabled on the cloned branch, so identities/provider settings/session restoration were not tested.
- Suspended the temporary clone's 0.25 CU compute after verification. The original backup branch and Production were not changed.
- Conclusion: PostgreSQL branch cloning and public/private Storage metadata parity passed. This is not a complete Auth/session recovery rehearsal.


## GitHub branch-protection instructions

Added `docs/ops/GITHUB_MAIN_PROTECTION_ANDROID.md` with tap-only Android Chrome steps to create an active ruleset for `main`, require PRs and the `ISOKO checks / TypeScript and Vite build` check, and block force pushes/deletions. The connected GitHub app could not write repository administration settings; ruleset read was empty and classic protection read returned 403. The doc explicitly does not claim that protection is already enabled.


## Upload quota 025 boundary test (follow-up)

A disposable branch `isoko-quota-025-e2e-20261116` (`br-floral-truth-ba5rekkc`) was cloned from QA (`br-cold-forest-badn9wlr`). Migration 025's exact quota function was installed on that clone and the migration marker recorded.

Using an existing QA seller identity in transaction-local Neon JWT claims, both boundary tests passed:
- Daily boundary: attempt 300 returned `allowed=true`, `count=300`, `limit=300`; attempt 301 returned `allowed=false`, `reason="daily"`.
- Rolling window boundary: attempt 30 returned `allowed=true`, `window_count=30`, `window_limit=30`; attempt 31 returned `allowed=false`, `reason="rate"`, `retry_after_seconds=60`.

Each test section was rolled back to its savepoint. A subsequent read-back returned `quota_rows=0`. The temporary clone's compute endpoint `ep-aged-shadow-ba81bpe4` was suspended after testing. The real QA branch, Production and the owner's seller data were not modified.

The Function source shows `kind !== "thumb"` before quota consumption; the actual authenticated full-image + thumbnail Storage upload pair remains part of the pending seller-device E2E test.
