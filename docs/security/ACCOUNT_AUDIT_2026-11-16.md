# ISOKO Account Security Audit — 2026-11-16

Scope: production configuration, source-code review and CI workflow review for the 2026-11-16 account/security work package. This is an evidence register, not a security certification.

| Control | Status | Evidence / reason |
|---|---|---|
| Seller A/B cannot read or modify each other's shop | **Not proven** | Source contains owner-scoped RPC/RLS patterns, but no automated two-seller isolation test was found in the current CI. |
| Seller A/B product and product-image isolation | **Not proven** | No QA test creates two sellers and attempts cross-owner product/image reads and writes. |
| Seller A/B profile and KYC isolation | **Not proven** | Admin-only KYC RPC and ownership guards exist in source, but cross-owner denial has not been demonstrated by a repeatable QA test. |
| Upload Function checks authentication and seller role | **Proven by code review only** | `infra/neon/functions/isokoapi/index.mjs` requires a bearer token, reads the authenticated profile and rejects disallowed roles/statuses. This is not an end-to-end security test. |
| Upload content validation | **Proven by code review only** | The Function checks JPEG/PNG/WebP magic bytes and enforces a 500 KB limit. |
| Daily per-seller upload quota | **QA schema present; exhaustion not tested; Production pending** | QA branch has migration marker 019 and `consume_seller_upload_quota_v1()`, but read-back found its stored cap was 50 while the intended policy is 30. Migration 020 aligns QA/Production source to 30. Production has no 019 marker and remains unchanged until release approval. |
| Login server-side rate limit | **Missing / not proven** | No test or provider configuration evidence was found that demonstrates an enforced login rate limit. |
| Signup server-side rate limit | **Missing / not proven** | No test or provider configuration evidence was found that demonstrates an enforced signup rate limit. |
| Additional upload request-frequency throttling beyond the daily seller quota | **Missing / not proven** | The seller-specific 30-attempt daily quota is server-side, but a separate per-minute/IP throttle for upload requests has not been demonstrated. |
| Public RPC rate limit independent of client session ID | **Missing** | Migration 018 describes a browser identifier/session-based approach for selected public subscription updates. This does not prove trusted-IP or provider-level protection for all public RPCs. |
| Email verification before product publishing | **Missing** | Production Neon Auth config read-back shows `require_email_verification=false`, verification on sign-up/sign-in false. No publish-time verified-email gate is proven. |
| Password reset revokes sessions | **Proven by provider configuration read-back** | Production Neon Auth reports `revoke_sessions_on_password_reset=true`. Actual email delivery and account-recovery journey remain untested with a real mailbox. |
| Password strength policy enforced server-side | **Not proven** | UI and reset helper require at least 8 characters, but no provider-side password policy read-back/test proving the server rule was found. |
| Session expiry | **Not proven** | Client caches a 30-day display/session marker; this is not proof of Neon Auth's actual server-session expiry. |
| Token storage / logout purge | **Partially implemented; not fully proven** | PR #53 awaits Neon Auth sign-out before clearing account-scoped local/session/IndexedDB keys where browser APIs allow. Full SDK-token inventory and browser-level Back-button testing remain outstanding. |
| Other-device session revocation | **Not proven** | Account page feature-detects a client method. No supported action or multi-device QA test has been verified. |
| Admin account recovery | **Missing / not proven** | Production has no Admin account according to the reviewed Production gate; no real Admin recovery drill has been performed. |
| Backup and restore including Object Storage | **Missing** | Existing Production gate says independent offsite backup and combined PostgreSQL/Object Storage restore drill are not complete. |
| Seller signup, upload and product publishing end-to-end | **Not proven** | CI smoke tests use an empty mocked catalogue and intentionally avoid real accounts; no real QA seller workflow was verified. |

## Important Production read-backs

- Production branch: `isoko-production` (`br-blue-bread-ba2wywua`).
- Production Neon Auth uses Better Auth.
- Email/password sign-in is enabled.
- Email verification is disabled on sign-up and sign-in; `require_email_verification=false`.
- `revoke_sessions_on_password_reset=true`.
- Google provider is present but its Client ID and Client Secret are null.
- Public assets bucket is public-read; KYC bucket is private.
- Migration `016_seller_profile_storefront_capacity` is present.
- Migrations `017` and `018` were not present in the reviewed schema_migrations read-back.
- The photo PR proposes migration `019_seller_upload_daily_quota`; it is not yet proven applied to Production.

## QA test gate still required

The security gate is not passed until CI has isolated, repeatable tests that:
1. Create two fresh seller identities in a dedicated QA branch only.
2. Create one shop and owned products/images/profile for each seller.
3. Attempt cross-owner reads and writes through Data API/RLS, RPCs, and the upload Function.
4. Assert every cross-owner request is denied and owner requests continue to work.
5. Delete/rollback test data and never point the test at Production.
6. Exercise login/signup/upload/public RPC throttles at their real server enforcement points.
7. Test verified and unverified seller publish behavior with real test email delivery.
