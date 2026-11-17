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

## Release gate

- Run the full GitHub CI suite on the exact PR head SHA.
- Review mobile layout and seller flow at 320px and 360px widths.
- Obtain explicit owner approval for applying migration 026 to Production.
- Do not merge/deploy until the migration plan and release checks have been reviewed. Render deploys from `main`, not `final-release`.
- Do not alter the existing Production seller account, shop, product, images, or any prior work.
