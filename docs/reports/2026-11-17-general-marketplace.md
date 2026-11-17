# General marketplace and compact rotating home message

Date: 2026-11-17

## Scope

This change is limited to the two owner-requested improvements:

1. Turn Isoko into a general marketplace where sellers can list any lawful item or property, not only clothing and shoes.
2. Replace the oversized WhatsApp sales hero with a compact, rotating marketplace message.

Unrelated account, seller, security, checkout, image, language and prior design work is left intact.

## General marketplace behavior

- Preserve category ID `4` and slug `ibindi`; display it as **Ibindi byose / Everything else** without changing existing product category IDs or seller data.
- Allow a seller to select the general parent category directly; existing clothing, shoes and accessories subcategories remain available.
- General listings do not require apparel or shoe sizes. The current product RPC still requires one variant, so the form writes the internal `Ntibireba` sentinel. Product detail, cart and WhatsApp output suppress that sentinel so buyers never see a fake size.
- Home, land, vehicles and household goods are explicit examples in the Kinyarwanda, English, French, Swahili, Kirundi, Lingala and Luganda copy. Sellers should describe the actual item in its title and details.
- Raise the price ceiling consistently to **2,000,000,000 RWF** in the new/edit forms, client-side validation, PostgreSQL table constraint and create/update RPC validation.
- The bulk uploader also exposes the general category, automatically uses the internal no-size variant, hides the size controls for general listings and accepts the same 2,000,000,000 RWF ceiling. Existing clothing and shoe bulk batches keep their size selection unchanged.

## Compact rotating home message

- Replace the large hero card with a slim pill-shaped message, a small store icon and discreet three-step indicator.
- Rotate the localized message every 4.2 seconds.
- Respect the user's reduced-motion preference by disabling automatic rotation.
- Keep a smaller, adjacent **Fungura iduka / Open a shop** action.

## Database migration 026

File: `infra/neon/migrations/026_general_marketplace_price_range.sql`

- Replaces only the `products_price_check` constraint and the existing create/update seller-product RPC definitions.
- Retains the name/description validation, image ownership checks, SECURITY DEFINER and all other existing RPC behavior from migration 024.
- Changes the allowed maximum price from 5,000,000 to 2,000,000,000 RWF.
- Does not rewrite profiles, shops, products, variants, images or other seller data.
- Production has migration markers 016–025 already. Migration 026 has **not** been applied to Production.

## QA evidence

Tested on a fresh Neon branch cloned from the current Production branch:

- QA branch: `isoko-general-marketplace-qa-20261117`
- QA branch ID: `br-green-haze-batl4xq0`
- Parent: Production branch `isoko-production` (`br-blue-bread-ba2wywua`)
- Applied migration 026 to the QA clone only.
- Confirmed the PostgreSQL constraint is `price >= 500 AND price <= 2000000000`.
- Confirmed both create and update RPCs use the 2,000,000,000 ceiling and no longer contain the old 5,000,000 check.
- Price boundary test: 1,850,000,000 and 2,000,000,000 accepted; 2,000,000,001 rejected.
- QA clone retained the same 1 profile, 1 shop and 1 product as Production.
- The clone's category ID 4 remains `ibindi`, active, and its existing product is untouched.

## Neon Data API authentication context — release blocker

- The seller E2E trace confirms the browser sends a JWT with `role=authenticated` and the signed-in user's `sub`; the Data API still returns SQLSTATE `28000 / AUTH_REQUIRED` inside `start_seller_registration_v1`.
- This matches two open Neon reports: [neondatabase/neon#12985](https://github.com/neondatabase/neon/issues/12985) and [neondatabase/neon#12988](https://github.com/neondatabase/neon/issues/12988), which describe missing JWT claims inside `SECURITY DEFINER` execution. The Neon reports do not establish a confirmed root cause or a generally safe workaround.
- A proposed wrapper migration 027 was applied to QA and did **not** resolve the error. It has been removed from `final-release` and must not be applied to Production.
- The app now retries only the idempotent `start_seller_registration_v1` draft upsert, and only for the exact `AUTH_REQUIRED` / SQLSTATE `28000` error, at most twice after refreshing the verified session JWT. It does not retry profile/shop creation, product writes, general permission errors or other SQL failures. This mitigation is still awaiting a successful QA E2E confirmation.
- Authentication continues to fail closed: no claim is invented, no role is elevated, and no RLS or authorization guard is bypassed.

## Seller profile partial-update correction

- `updateSellerShop` now updates only the fields supplied by the caller.
- This prevents onboarding's district-only update from overwriting the newly registered shop's phone, WhatsApp number, name, images and other profile fields with empty values.
- QA database inspection confirmed a new seller retains valid phone and WhatsApp values after saving the district. The public product page can therefore show the configured WhatsApp contact without weakening phone validation.

## Current PR verification

- PR #64 targets `main`; branch: `final-release`. Current head SHA is verified from GitHub at release time.
- TypeScript, unit tests, seven-language parity, Neon Setup smoke, Production read-only smoke, seller-upload CORS smoke and production build passed on the preceding checked commit.
- Live public visual QA passed at 320px and 360px.
- The full seller E2E has previously reached general-category selection, product publication and product detail on QA, but the latest full-flow run still failed during seller registration with `AUTH_REQUIRED` from Neon Data API. The exact cause is still being investigated against Neon issues #12985 and #12988.
- Migration 026 has been applied only to QA. Experimental migration 027 was removed from the release and must not be applied.
- Production's profiles, shop and product remain untouched. No Production migration or Render deploy has been performed.


## Production release procedure

1. Obtain a passing seller E2E on the exact PR head, or a confirmed Neon-supported resolution for the authenticated RPC context issue.
2. Create and verify a fresh Production branch snapshot. The Neon project currently reports its branch limit reached; do not delete any existing QA or backup branch just to free a slot.
3. Apply migration 026 only to Production, after the fresh snapshot is available. Verify the migration marker, price constraint, both seller-product RPCs and unchanged seller/shop/product counts.
4. Merge PR #64 into `main` with the exact verified head SHA. Render auto-deploys the `main` branch.
5. Verify the new Render deployment is live, then inspect the public homepage, general category, product detail and seller contact on the real domain.
6. Do not apply experimental migration 027. Do not modify the existing Production seller account, shop, product or images except through the approved migration 026.
