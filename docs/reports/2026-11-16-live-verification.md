# ISOKO live verification and public trust fix

Date: 2026-11-16  
Production URL: https://isoko-marketplace-9i69.onrender.com  
Verified main commit: `1f46194c625537b0b3cbcdc72153a5695d8b2856`  
Render deployment: `dep-dbt9qjvf3r2c73f8b8tg` (`live`, finished 2026-11-16T06:06:23Z)

## Live pages inspected

Read-only production page content was retrieved for:
- `/` — Kinyarwanda page title and `lang=rw`; theme color is `#0B6E4F`.
- `/c/inkweto`, `/c/imyenda`, `/c/amasogisi` — each currently reports zero products.
- `/c/ibindi` — one active product, named “Imodoka”.
- `/p/prod-b60bf47d986d49348438dcf1891df209` — product detail and WhatsApp route load; the product is categorized as “Ibindi byo kwambara” and its visible data says “Adidas (Original)”.
- `/i/muhire-rwanda` — public shop page loads and labels the shop “Ritaragenzurwa”.
- `/abacuruzi` — currently renders seller registration (“Fungura iduka ryawe”), not a public seller directory.
- `/injira` — seller sign-in content loads.
- `/konti` — signed-out view correctly says no account is active on this device and links to sign-in.
- `/amategeko`, `/ibanga`, `/amabwiriza-y-abacuruzi`, `/ubufasha`, `/ibyerekeye` — public static pages load in Kinyarwanda.

## Defects found and code fixes in this PR

1. **Contradictory verification badge.** The shop page used the correct identity-only predicate, but the product page also treated `shop.status === 'approved'` as Verified. The live product detail therefore showed “Yagenzuwe” while its own shop page showed “Ritaragenzurwa”. ProductPage now uses the shared `isShopIdentityVerified` helper.
2. **Public placeholder WhatsApp path.** ProductPage used `250788000000` whenever a shop WhatsApp number was missing. Added a shared configured-number guard that rejects missing, invalid and known placeholder numbers; product and shop pages hide the WhatsApp CTA when it is unavailable. Cart WhatsApp generation now returns no links for the placeholder/invalid number.
3. Added implementation rules explaining why identity verification and public seller contact links must remain truthful.

## Data observations deliberately not changed

- Production has one real test product. It is currently named “Imodoka” while categorized as “Ibindi byo kwambara”; its description/brand combination also appears inconsistent with the marketplace's clothing-and-footwear focus. No product or account data was edited.
- The shop page displays the saved public seller bio, whose current text references Ahabona. The bio is profile data, not a hard-coded ISOKO string. It can be corrected by its owner in seller settings; it was not modified.
- The shop itself remains unverified in its public storefront. No identity status, seller approval or KYC data was changed.

## WhatsApp/support checks

- `/ubufasha` says the support WhatsApp number has not yet been configured; no fake support number is shown.
- The actual product page has a WhatsApp link based on the shop's saved number.
- The code fix ensures missing/invalid seller numbers do not produce a fabricated `wa.me` target.

## Screenshots and limitations

The requested browser screenshots at 360x800 and 320x800 have **not** been created in this report. The TinyFish browser automation run could not start because its connected wallet balance was below zero (`-$0.104`). The read-only page extraction above succeeded independently, but it does not prove pixel-level layout, contrast, horizontal overflow, image loading in an actual browser, or all seven language-switcher states. A separate Playwright live visual QA job is still required to create the requested screenshot set under `docs/design/qa/2026-11-16-live/`.

## Test status

- Added unit coverage for missing, invalid and placeholder WhatsApp numbers and for cart links.
- Added a shared identity-only predicate to ProductPage; existing `shopVerification.test.ts` already proves approval alone does not earn the seal.
- CI results for this PR are pending at report creation.
- No Production database, Neon Auth, Object Storage, Function, Render environment variables or deployment settings were changed by this PR.
