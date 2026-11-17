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

## Current PR verification

- PR #64 head: `c95498f33e8318d1b94b7f2c829bb1df1948cf94` (branch `final-release`); mergeable with `main`, not merged.
- TypeScript, unit tests, seven-language parity, Neon Setup smoke, Production read-only smoke, seller-upload CORS smoke and production build passed at the recorded PR check.
- Live public visual QA passed at 320px and 360px.
- Seller signup E2E currently stops at `start_seller_registration_v1` with SQLSTATE `28000 / AUTH_REQUIRED`. Its Playwright trace shows an authenticated Neon Auth JWT in the Data API request, but PostgreSQL returns no `auth.user_id()` inside the protected RPC. This is not a reason to bypass authentication.
- The symptom resembles the open Neon Data API JWT-claims issue [neondatabase/neon#12985](https://github.com/neondatabase/neon/issues/12985), but this relationship is not confirmed as the root cause.
- No auth policy, Production function, Production database, Render environment or seller account was changed to hide this test failure.

## Release gate

- Run the full GitHub CI suite on the exact PR head SHA.
- Review mobile layout and seller flow at 320px and 360px widths.
- Obtain explicit owner approval for applying migration 026 to Production.
- Do not merge/deploy until the migration plan and release checks have been reviewed. Render deploys from `main`, not `final-release`.
- Do not alter the existing Production seller account, shop, product, images, or any prior work.
