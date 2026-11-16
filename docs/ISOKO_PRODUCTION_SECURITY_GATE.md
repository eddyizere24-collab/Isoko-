# ISOKO Production Security & Operations Gate

Last checked: **2026-11-16**  
This is the current authoritative Production snapshot. Historical notes from earlier dates have been retained only where explicitly labelled as history; any old statement that Production has zero users/products or lacks migrations 017–025 is superseded by this release record.

## Current live Production state — 2026-11-16

| Component | Verified state |
|---|---|
| Public website | https://isoko-marketplace-9i69.onrender.com |
| Repository / production branch | `eddyizere24-collab/Isoko-` / `main` |
| Live Git SHA | `1f46194c625537b0b3cbcdc72153a5695d8b2856` |
| Render deploy | `dep-dbt9qjvf3r2c73f8b8tg`, `live`, completed `2026-11-16T06:06:23Z` |
| Neon project | `isoko-marketplace` (`square-queen-83418379`) |
| Neon Production branch | `isoko-production` (`br-blue-bread-ba2wywua`) |
| Database | `isoko` |
| Migrations | 016–025 recorded in `public.schema_migrations` |
| Neon Function | `isokoapi` deployment #3, Node.js 24, `completed` |
| Function health | `healthy`; branch `isoko-production`; Data API and Object Storage available |
| Production data | 1 seller profile, 1 shop, 1 active product |
| Current seller identity | `unverified`; approved seller status is not identity verification |
| Google OAuth | Client ID/Secret absent; disabled |
| Email verification | Disabled at sign-up/sign-in and not required |
| Support WhatsApp | No valid Production number configured |

The single Production profile/shop/product is the owner's real test account. Do not delete, edit, suspend or replace it as part of testing. Do not introduce demo sellers/products.

## Migration state and final constraints

All migrations 017–025 are applied in Production. The 024 migration is the reconciled product RPC definition that retains both 017's validation rules and 022's image-prefix ownership enforcement. Migration 025 supersedes the earlier upload limits.

- Product names: 5–60 characters; no phone number or link patterns.
- Product description: maximum 2,000 characters; no phone number/link patterns.
- Seller product image keys are restricted to the authenticated seller's `products/<profile-id>/` prefix.
- Current upload limits: 300 original seller-photo uploads per UTC day and 30 per rolling 60 seconds. The paired thumbnail does not consume an additional quota count.
- Migration 018 applies rate controls to selected public report/subscription/event RPCs only; it is not a full trusted-IP shield for every public endpoint.

Do not replay any of migrations 017–025.

## Backup, identity and account safety

A Neon branch snapshot named `isoko-production-backup-before-release-20261116` exists (`br-falling-darkness-ba6qwviu`). It is based on Production and was created before the release migrations. It has no compute endpoint, so SQL parity testing against the snapshot was not completed. It is not proof of a complete restore drill or a backup of public/private Object Storage. Keep it preserved.

Production email/password sign-in is enabled, but email verification is not enforced. The current Google provider has no Client ID or Client Secret. KYC bucket is private; QA KYC currently has no rows, so owner/admin access control has not been proven end-to-end. No Admin profile appeared in the latest Production role/status read-back.

## Public visual verification evidence

GitHub Actions run [43815618048](https://github.com/eddyizere24-collab/Isoko-/actions/runs/43815618048) saved 36 PNG screenshots and observations for 11 public routes at 360×800 and 320×800 and the seven language states. The browser checks reported HTTP 200, no horizontal overflow, no visible broken images, no JS page errors, Kinyarwanda default and working language switching. These tests were signed out; they do not prove account logout/back navigation or seller image persistence after upload.

## Remaining release/security gates

- Real QA seller flow: sign up, upload avatar/logo/cover, publish a three-photo product, reload storefront, then run 10 products × 3 photos.
- KYC owner/admin isolation with real QA KYC rows and authenticated sessions.
- Post-025 quota boundary tests for 300/301 per day and 30/31 per minute; verify thumbnails are excluded.
- Trusted email sender and real QA delivery; only then add verified-email publishing gate, never block existing login.
- Multi-device session revocation and logout/back-button browser test.
- Admin bootstrap/recovery runbook and controlled recovery rehearsal.
- PostgreSQL plus Object Storage restore rehearsal from a backup.
- Confirm GitHub main branch protection and required CI. The repository rulesets read returned none; classic protection read was unavailable (403), so branch protection is not declared enabled.
- Google OAuth credentials and QA OAuth round trip; keep the feature flag off until both are proven.

The detailed control matrix is in `docs/security/ACCOUNT_AUDIT_2026-11-16.md`.
