# ISOKO — Seven-language rollout report (2026-11-16)

## Status

Implementation branch: `feat/languages-seven-20261116`  
Base: `main`  
PR: Pending creation; this branch has not been merged.  
Production: untouched. No Production SQL, Function, Render, environment, DNS or billing changes.

## What changed

- Added Luganda (`lg`) to the supported language union, dictionary registry, browser-safe language detection and selector. Its native display name is `Oluganda`.
- Supported languages are now: Kinyarwanda (`rw`), English (`en`), French (`fr`), Kiswahili (`sw`), Kirundi (`rn`), Lingala (`ln`) and Luganda (`lg`).
- Added a 155-key Luganda UI dictionary with the same core keys as the existing language dictionaries.
- New visitors default to Kinyarwanda regardless of browser locale. A valid language already saved in `isoko.lang` remains the user's selected language and is restored.
- Language names are displayed in their own language: Ikinyarwanda, English, Français, Kiswahili, Ikirundi, Lingála and Oluganda.
- Removed the visible `beta` badge from the language switcher. The language metadata keeps `reviewed:false` for English, French, Kiswahili, Kirundi, Lingala and Luganda; Kinyarwanda remains the source language.
- Added localized static-page copy for About, Help/FAQ, Terms of Service, Privacy Policy, Seller Guidelines / prohibited products and the 404 fallback in all seven languages.
- Each translated legal page says in the selected language that it is a translation and that Kinyarwanda is the original/source text.
- Added a test that fails if a language dictionary has a missing/extra/empty key, if a supported language is absent, if the new-visitor default is not Kinyarwanda, or if legal pages/source notes are missing.
- Added language and legal translation rules to `docs/RULES.md`.

## Files changed

- `src/i18n/lg.ts`
- `src/i18n/index.ts`
- `src/context/LangContext.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/i18n/staticPages.ts`
- `src/pages/StaticPage.tsx`
- `src/lib/i18n.test.ts`
- `docs/RULES.md`
- `docs/reports/2026-11-16-languages.md`

## Review status (honesty)

The only source/reference language is Kinyarwanda. The following translation sets are marked `reviewed:false` because no native-speaker review evidence is available in this task:

- English (`en`)
- French (`fr`)
- Kiswahili (`sw`)
- Kirundi (`rn`)
- Lingala (`ln`)
- Luganda (`lg`)

Kinyarwanda (`rw`) is the source copy and is marked reviewed. This is a technical translation pass, not a claim of human/native review or legal approval. Before the translated legal copy is relied upon for consent, obtain native-speaker and legal review.

## Coverage boundaries / not yet complete

- The shared dictionary and the static legal/help/about/404 pages are covered by this PR. A full sweep of every direct hard-coded string in every React page/component, every backend error returned by the Neon Function, and all email templates has not yet been completed. Those strings cannot honestly be reported as fully translated yet.
- The current 404 copy is localized where the app routes to `StaticPage`; deep-link error handling in hosting/static-site configuration still needs a separate browser check.
- The language switcher is rendered in the existing global header/footer components; a 320×800 and 360×800 screenshot check proving it is visible without scrolling has not yet been done.
- All seven language selections have not yet been captured in the requested screenshot matrix.
- The legal translations have not been checked by native speakers or legal counsel.

## Tests and evidence

### Added, pending CI

- `src/lib/i18n.test.ts` checks exact key parity and nonempty text for all seven dictionaries.
- The same test checks new visitors start in `rw`, persisted user choice wins, and legal page copy exists for all seven languages with the Kinyarwanda source note.

### Not yet tested

- TypeScript, unit tests, production build and Playwright on this branch.
- Browser storage persistence after changing languages and reloading.
- Language switcher visibility at 320×800 and 360×800.
- Screenshots of each language selection.
- Native-speaker review of `en`, `fr`, `sw`, `rn`, `ln`, `lg`.

No screenshot, CI success or human linguistic review is claimed in this report.

## Production impact

No Production code or settings changed. This branch has not been merged and no Render deployment has occurred.

## Owner actions (Android only, Kinyarwanda)

1. Fungura Draft PR ya GitHub ChatGPT izatanga kuri compare link.
2. Reba GitHub Actions. Niba TypeScript, tests, build cyangwa Playwright bitatsinze, ntukande Merge.
3. Claude agomba gusuzuma Luganda, inyandiko z’amategeko n’ama tests.
4. Ntugahindure Production cyangwa Render settings kuri iyi PR.
5. Mbere yo gukoresha inyandiko z’amategeko mu ndimi nshya nk’izo abantu bemeraho, hagomba kuboneka isuzuma ry’abavuga izo ndimi kavukire n’umuntu ushinzwe amategeko.

## Risks / next steps

- Complete the remaining hard-coded strings and email/backend messages in a separate follow-up rather than falsely claiming complete internationalisation.
- Obtain native-speaker review for all six translated languages (including English) and mark reviewed=true only after that evidence exists.
- Add real screenshot coverage for all seven switcher selections and both mobile dimensions.
- Sync `docs/RULES.md` with other open PR branches after the photo and account PRs are merged; this branch was based on `main` while those branches remain unmerged.
