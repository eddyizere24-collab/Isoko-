# ISOKO Account Security Audit — 2026-11-16

Scope: current Production read-backs, isolated QA transaction checks, frontend/Function code review and GitHub CI evidence. This is an evidence register, not a certification.

## Current Production facts

- Production Neon branch: `isoko-production` (`br-blue-bread-ba2wywua`), database `isoko`.
- Production migration markers 016–025 were read back from `public.schema_migrations`.
- Production contains 1 seller profile, 1 shop and 1 active product. The profile is `role=seller`, `status=approved`, `identity_status=unverified`. No Admin role appeared in the current role/status grouping query.
- The owner's test account and its shop/product are real Production data. No test or demo data was added for this audit.
- Function `isokoapi` deployment #3, Node.js 24, reports `completed`; its live `/health` endpoint returns `healthy` for branch `isoko-production`, with Data API and Object Storage available.
- Production email verification remains disabled. Neon Auth reports `verify_email_on_sign_up=false`, `verify_email_on_sign_in=false`, and `require_email_verification=false`.
- Production Google provider has no Client ID/Secret. Google sign-in remains disabled.
- Production uses the shared Neon Auth sender `auth@mail.myneon.app`; no real mailbox delivery or custom SMTP test is evidenced.
- Backup branch `isoko-production-backup-before-release-20261116` exists. A child restore clone (`br-broad-feather-ba73vmad`) was created from it and SQL read-back matched the snapshot's 1 profile, 1 shop and 1 product, with migration history through 016 only. Public Storage had 11 objects in Production/backup/clone with matching ETag+size metadata; private KYC Storage had 0 in all three. The clone's compute was suspended after the test. Neon Auth was not enabled on the clone, so identity/session restore is unproven.

## Control evidence

| Control | Current status | Evidence and remaining gap |
|---|---|---|
| Seller A/B shop isolation | **QA transaction checks passed; repeatable CI test absent** | In isolated QA, Seller A could read/update own shop; Seller B's shop was not visible and cross-owner update returned no row. Test writes were rolled back. |
| Seller A/B product mutations | **QA transaction checks passed; repeatable CI test absent** | Seller A's own update, delete and mark-sold RPCs succeeded in rollback-only transactions; the same operations against Seller B's product returned `PRODUCT_NOT_FOUND_OR_FORBIDDEN`. |
| Product image owner prefix | **QA transaction check passed; Production authenticated test pending** | A Seller B `products/<profile-id>/` key was rejected for Seller A's product with `PRODUCT_IMAGE_OWNERSHIP_INVALID`. Migration 024 retains this guard while restoring 017's validations. |
| Product name / description validation | **Production migrations present; boundary cases not re-executed against live authenticated seller** | Migrations 017 and 024 enforce name length 5–60, reject phone/link patterns, cap description at 2,000 chars, validate price/category/images/variants. Production marker 024 is present. |
| Seller upload Function authentication | **Unauthenticated Production request rejected; seller-role E2E pending** | Earlier direct unauthenticated `/api/upload` request returned HTTP 401. Function code derives the profile from the authenticated token and restricts upload kinds by role. A real authenticated seller upload was not run. |
| Upload media validation | **Code review** | Function checks accepted JPEG/PNG/WebP magic bytes and file-size bound (500 KB); malformed MIME claims are not trusted. A physical Android photo round trip remains untested. |
| Upload quota current limits | **Production configuration read-back; post-025 boundary stress test outstanding** | Migration 025 and Function code set 300 original-photo uploads per UTC day and 30 per rolling 60 seconds. The `thumb` paired with the original `full` image is excluded from a second count. Earlier QA tests covered the old 30/day and 15/minute caps before 025; they do not prove the new 300/30 boundaries. |
| Public RPC abuse limits | **Partial controls; trusted-IP abuse resistance missing** | Migration 018 limits selected report/subscription operations and deduplicates events using caller/session-related identifiers. This is not a trusted-IP or provider-level throttle for every anonymous public RPC. |
| Email verification | **Disabled; delivery unproven** | Production Auth does not require email verification. No publish-only verification gate is proven. The Neon shared sender has not passed an owner-approved real inbox delivery test. |
| Google sign-in | **Disabled; provider credentials absent** | Production Neon Auth Google Client ID/Secret are null. Feature flag remains false; no QA OAuth round trip exists. |
| KYC owner/admin separation | **Not proven end-to-end** | The isolated QA KYC table currently has zero rows. Policy/code review is not a substitute for populated owner/admin tests. KYC Object Storage bucket is private. |
| Logout and account-cache cleanup | **Implemented in main; browser-level test outstanding** | Main code awaits Neon Auth sign-out before clearing account-scoped caches and preserves guest preferences. Signed-in QA logout and Back-button test have not been performed. |
| Other-device session revocation | **Not proven** | The UI exposes a revocation action only if the SDK provides one; no real multi-device session test has been run. |
| Session expiry | **Not proven** | The previous client-side 30-day marker was not authoritative. Do not claim an exact server session lifetime until Neon Auth confirms it. |
| Admin recovery | **Missing / not rehearsed** | No Admin role appeared in Production. A recovery runbook and real owner-controlled Admin recovery drill remain outstanding. |
| Backup and restore | **PostgreSQL and Storage clone check passed; Auth restore incomplete** | A child restore clone from the preserved backup returned the same 1/1/1 records and 016-only migration history. Public Storage metadata matched across Production, backup and clone (11 objects); private bucket was empty in all three. Neon Auth was not enabled on the clone, so account/session recovery was not tested. |
| GitHub main protection | **Not confirmed** | Repository rulesets read returned an empty list. The connected GitHub app could not read classic branch protection (403), so this audit does not assert whether classic protection is active. Require a PR and CI status check in repository settings. |
| Authenticated seller journey | **Not proven** | No QA signup → avatar/logo/cover → publish three-photo product → storefront reload → 10×3 bulk upload workflow has been completed. Do not use the Production owner's account for this test. |

## Public visual QA evidence

GitHub Actions run [43815618048](https://github.com/eddyizere24-collab/Isoko-/actions/runs/43815618048) captured 36 public-page screenshots for the live Production website:
- 11 routes at 360×800 and 320×800.
- Seven language states at both sizes.
- The observations reported HTTP 200 on all 11 routes, no horizontal overflow, no visible broken images, no browser page errors, Kinyarwanda as the fresh-browser default, and successful language switching.

This was signed-out public-page testing only. It does not prove signed-in Account Centre behavior, logout/back-button behavior, or seller image persistence after real uploads. Screenshots and observations are in `docs/design/qa/2026-11-16-live/`.

## Follow-up actions

1. Create an isolated QA seller with a real Neon Auth session. Verify avatar, logo and cover separately after reload; publish three-photo product; run a 10-product × 3-photo bulk test.
2. Create two test sellers and populated QA KYC rows. Prove that each seller sees only own KYC, and an Admin-only route can review KYC without exposing documents publicly.
3. Re-run upload quota boundaries against migration 025: 300th/301st daily original photo and 30th/31st within 60 seconds; verify thumbnails do not consume another count. Keep tests isolated and roll back counters.
4. Verify reliable email delivery using a trusted sender in QA, then gate publishing (not login) on `email_verified`. Do not enable this while email delivery is uncertain.
5. Test logout/Back-button and supported other-device revocation with two controlled QA devices/sessions.
6. Write and rehearse the Admin bootstrap/recovery runbook without exposing codes or passwords in GitHub.
7. Complete an end-to-end restore procedure that also enables/configures Neon Auth on a separate clone and proves account access and rollback. The PostgreSQL clone and Storage object metadata parity test has passed, but identity/session restore has not.
8. Set/verify GitHub branch protection for `main` with required PR review and CI.

No Production seller data was changed during this audit.
