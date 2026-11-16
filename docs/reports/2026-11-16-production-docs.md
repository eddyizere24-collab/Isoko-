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
