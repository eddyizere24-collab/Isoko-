# ISOKO brand clarity and mobile readability

Date: 2026-11-16  
Base: `main` at `1f46194c625537b0b3cbcdc72153a5695d8b2856`

## Changes

- Replaced the washed-out palette with central tokens: page `#FAFAF7`, cards `#FFFFFF`, primary text `#1A1F1C`, secondary text `#4B544F`, primary action `#0B6E4F`, accent `#C0392B`.
- Added centralized compatibility aliases in `src/index.css` so existing Tailwind utility classes resolve to the new tokens consistently while individual components are migrated.
- Changed pale cream/green backgrounds to white or the neutral page background; kept actual seller photos untouched.
- Rebuilt the Imigongo header/footer/hero motif as a crisp 12×12px repeated square tile, 1:1 background sizing, with green/red/ochre strokes at least 1.5px.
- Enlarged the home hero headline and sun mark, and changed the seller CTA to one prominent 44px green button reading “Fungura iduka”.
- Increased category tiles to 96×92px, icon boxes to 40px and labels to 11.5px, with distinct icon colours and finger-friendly targets.
- Removed the product card's fixed mobile max-height, increased price to 18px/20px/24px and product name to 13px/15px while retaining a three-column mobile grid.
- Simplified the hollow-centre multicolour sun to 12 larger outer beads and thicker centre strokes so it remains visible at 24px.
- Added the visual system constraints to `docs/RULES.md`.

## Contrast verification

Relative luminance calculations against `#FAFAF7`:
- Secondary text `#4B544F`: **7.49:1**
- Primary text `#1A1F1C`: **15.98:1**
- Green primary action `#0B6E4F`: **5.98:1**
- Red accent `#C0392B`: **5.20:1**

All four text/foreground colors exceed 4.5:1 against the neutral page background.

## Evidence and limits

- Before screenshots of the current public Production website are already stored in `docs/design/qa/2026-11-16-live/` by PR #58.
- After screenshots from the redesigned build must be captured from the reviewed release build; this PR does not publish to Production or change Render configuration.
- No new product imagery, demo listings, seller data or Production content was added.
- CI must pass before this PR is considered ready.
