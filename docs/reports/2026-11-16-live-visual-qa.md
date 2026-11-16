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
