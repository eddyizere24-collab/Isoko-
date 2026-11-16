# Languages package report — 2026-11-16

## Changes
- Added Luganda (lg) with a dictionary matching all 155 Kinyarwanda UI keys.
- Supported language codes are rw, en, fr, sw, rn, ln and lg.
- First visit defaults to Kinyarwanda regardless of browser locale; a previously saved user selection remains in effect.
- Removed beta badges from the language switcher while retaining reviewed flags in code and docs/i18n/REVIEW.md.
- Added a CI command and unit test enforcing exact key parity across all seven dictionaries.
- Added translations for Terms, Privacy, prohibited products and Seller Agreement. Each legal page displays the reference-language notice.

## Review status
- Kinyarwanda and English retain their existing reviewed status.
- French, Swahili, Kirundi, Lingala and Luganda remain `reviewed: false` pending native-speaker review. No human review is claimed.

## Not completed / not tested
- Native-speaker review of French, Swahili, Kirundi, Lingala and Luganda.
- Extraction of all remaining hardcoded strings across About, Help, onboarding, seller/admin controls, errors, emails and empty states remains incomplete.
- Playwright screenshots of all language states and legal pages at 360x800 and 320x800 are not yet available.
- CI for this branch has not run yet.

## Production
No Production DB, Neon Auth, Function, Object Storage, Render environment or deployment was changed.
