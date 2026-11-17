# ISOKO live mobile visual QA

Date: 2026-11-16  
Target: https://isoko-marketplace-9i69.onrender.com

## Scope
The Playwright workflow checks the public production routes at 360x800 and 320x800:
- Home
- Shoes category and populated “Ibindi” category
- Existing product and shop
- Seller entry, login, signed-out account centre
- Terms, privacy and help

It also verifies the fresh-browser Kinyarwanda default and switches through all seven language choices (rw, en, fr, sw, rn, ln, lg). It captures page screenshots and JSON observations in `docs/design/qa/2026-11-16-live/`.

## Safety
The tests use public GET navigation only. They do not sign in, create an account, upload images, change saved seller data, or initiate contact/purchase actions. They do not access or write Production database records.

## Evidence limitations
Signed-in `/konti`, logout/back-button behavior, seller avatar/logo/cover persistence after upload and the seller listing workflow require an authenticated QA seller session. Those checks are deliberately not simulated with Production credentials and remain outside this public-only test.
The workflow reports viewport overflow, visible broken images, placeholder WhatsApp links and visible Verified labels in JSON observations. It cannot decide whether every translation is linguistically correct; native-speaker review remains separate.

## Results from GitHub Actions run #1

Run: https://github.com/eddyizere24-collab/Isoko-/actions/runs/43815618048  
The dedicated Live Public Visual QA workflow completed successfully. The main ISOKO checks run #721 also passed.

- Captured 36 PNG screenshots for 11 public routes and seven language states at both viewport sizes.
- All 11 routes returned HTTP 200 at 360×800 and 320×800.
- Fresh browser contexts used Kinyarwanda (`lang=rw`) by default.
- All seven language choices were selectable and each changed the document language to its expected code; no user-facing “beta” string appeared in the inspected page text.
- No horizontal document/body overflow was detected at either viewport size.
- No broken visible image was detected by the browser observation.
- No browser page errors were recorded.
- No placeholder `wa.me/250788000000` anchor was detected in the inspected live pages.

The automated observation did not independently validate every product-level Verified badge; the earlier read-only content inspection found a mismatch between the unverified shop page and product-detail badge, which is the reason for PR #57. That fix must be merged and deployed before a post-fix production retest.

Screenshots and observations are linked from [the gallery index](../design/qa/2026-11-16-live/README.md). Signed-in account centre, logout/back navigation, and avatar/logo/cover reload persistence remain untested because this run used a fresh signed-out browser and deliberately did not use Production credentials.
