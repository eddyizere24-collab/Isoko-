# ISOKO QA seller end-to-end

Date: 2026-11-16

## Scope
GitHub Actions builds the PR frontend against the isolated Neon QA branch br-cold-forest-badn9wlr and its Neon Auth, Data API, Function #7 and public Storage endpoints.

The Playwright flow creates a unique QA-only seller, uploads avatar, cover and logo separately, reloads the settings page and checks each saved image remains under its own object prefix. It then publishes one product with three photos, checks the public product and shop storefront, and publishes nine more products with three photos each. The bulk stage is paced below the rolling 30-original-photo-per-minute limit and checks for quota errors.

## QA-only prerequisites changed on 2026-11-16
- Applied migration 025 to the isolated QA branch only; the schema migration marker was read back.
- Added http://localhost:5173 to QA Neon Auth trusted origins.
- Updated QA Data API CORS to allow the public website plus localhost and 127.0.0.1 at port 5173.
- QA Function already explicitly allows localhost:5173; no Function deployment was changed.
- Production Neon Auth, Data API, Function, Storage and seller records were not changed.

## Data handling
Each run creates a unique email using the GitHub run ID and a random in-memory password. The summary artifact reports the test email and created seller name, never the password. QA test data is created on the QA branch only and must be removed after the run by using the exact created account ID and object prefixes.

## Not covered
This does not test KYC owner/admin permissions, email delivery, multi-device revocation, Google OAuth or Production sign-in.
