# ISOKO Visual System & Experience Direction
Date: 2026-11-16
Status: User-approved design decisions for implementation. This document is a specification, not a claim that the UI or Production has already changed.

## 1. Product principle

ISOKO is a Rwanda-first B2C marketplace. Buyers discover real products and contact the real seller directly on WhatsApp. Sellers open shops, publish real products, and manage their own details. ISOKO does not collect payment or promise delivery.

The design borrows useful principles from Alibaba's compact information density, category navigation, product discovery and clear actions. It must not copy Alibaba's logo, colour system, wording, imagery, page composition or B2B mechanics.

## 2. Brand lock: original multicolour hollow sun

- Preserve the original multicolour hollow-centre sun. Never replace it with a generic green icon, filled sun, bag, house or unrelated symbol.
- The full-size mark keeps its open centre and multicolour beads.
- For 16–32px placements, use a dedicated compact SVG variant with 12 larger beads, each a solid single colour selected from green, red, ochre, blue and violet. Do not shrink the 36-bead full mark to a size where individual beads disappear.
- Check the compact variant at exactly 16px, 24px and 32px. Check the full mark at larger placements.
- Use the compact mark in the mobile header, favicon 16/32px and PWA icon family. Preserve the wordmark and its current identity. The small-size variant is an optical simplification of the same sun, not a new logo.
- Ochre, blue and violet are reserved for the sun. They are not UI accent colours.

## 3. Approved colour system

The project owner's explicit colour decision overrides any earlier palette in this repository:

| Role | Approved value |
|---|---|
| Primary green | `#0B6E4F` |
| Primary red | `#C0392B` |
| App background | `#F7F8FA` or white |
| Card/surface | `#FFFFFF` |
| Main text | `#1B1F23` |
| Secondary text | `#64748B` |
| Light border | `#E5E7EB` |
| Soft green surface | `#E8F3EE` |
| Soft red surface | `#FBEAE8` |

Rules:
- Green is for primary actions, key focus and price text. Red is for meaningful secondary emphasis, sale/status cues and destructive actions.
- The overall interface remains white/light grey. Do not cover whole sections, cards, footers or screens in solid green or red.
- Do not use the previous forest/clay/ochre palette (`#214E43`, `#BD594A`, `#C99A4B`) as the governing UI palette.
- Ochre, blue and violet may appear in the sun only.
- Keep text contrast accessible; never use opacity to make the brand mark or required Imigongo strip faint.
- `index.html` theme-color and the PWA manifest theme_color must match `#0B6E4F`.

## 4. Imigongo: clear Rwandan linework, not decoration dots

Create one consistent geometric Imigongo SVG tile family using connected diamonds, continuous zigzag and angular spiral-like turns. No row of unrelated dots or isolated triangles.

- Header strip: 10–12px high.
- The SVG tile must be square (1:1); the intrinsic SVG width and height and CSS `background-size` must use the same dimensions. Do not stretch a wide tile vertically.
- Use clear green `#0B6E4F` and red `#C0392B` strokes at 100% opacity. Line strokes are at least 1.5px at rendered tile size.
- Connect diamonds edge-to-edge; avoid large empty gaps. The zigzag/spiral path must continue seamlessly at tile boundaries.
- Footer strip: 14px high, retaining the same square-tile proportions and strong colours.
- Auth/sign-in/seller-registration header must have a clearly visible Imigongo line, not a barely visible watermark.
- Home hero: a 100–140px corner composition placed against the edge. It must not cover text or photos.
- Do not place the pattern under product cards, long text, form fields or photography. It is a crafted edge detail, not wallpaper.

## 5. Mobile layout: 360px Android is the baseline

Use mobile-first responsive design, validating 360×800 and 412×915 viewports at device scale factor 2. Also check 320px, tablet and desktop for overflow and broken layouts.

### Header
- Compact sticky row around 52px high.
- Use the compact sun mark at 16–24px, wordmark at an optically readable size, an accessible search field and compact location/language/cart actions.
- Imigongo strip directly under the header at 10–12px.
- Keep all tap targets at least 44×44px even when visible icons are 18–22px.

### Product catalogue
- Three product columns below 480px; four from 480px; five from 768px; six from 1024px; seven from 1280px.
- On narrow screens, use 6px grid gaps and 8–12px page gutters.
- Product cards use seller-supplied square images only, 6px body padding, price 13px bold, title 11.5px/14px (two lines), and shop/district metadata around 10.5px.
- Target mobile card height is no more than 185px, with no heavy shadow.
- Empty catalogue remains honest. Never manufacture products, shops, prices, review scores or availability to fill visual space.

### Categories and search
- Maintain a compact category rail and a three-column subcategory grid on mobile where the existing information architecture supports it.
- Preserve all existing search, synonyms, filters, sorting and real category data.

### Product detail
- Main image area uses 4:3 framing (e.g. 360×270 at 360px width) and seller-owned imagery only.
- Keep thumbnails around 48px and show the active image count.
- Product title about 15px/20px; price about 20px/24px; metadata about 12px.
- Size and colour options are visible chips, about 32px high, with accessible touch targets.
- Keep real shop identity, seller status, location and shop link visible.
- Fixed bottom action bar: **Vugana (WhatsApp) | Igare | Gura**. Do not imply ISOKO accepts payment or controls delivery.
- Show sections **Ibindi mu iduka ryabo** and **Bisa n'ibi** when real results exist. Keep scroll position when navigating back from a product.

### Cart
- Keep items grouped by seller. Never combine orders across sellers or invent a cross-shop total.
- Make quantity, remove, seller contact and trust/payment notice compact and accessible. WhatsApp remains the handoff for each seller.

### Sign-in and registration
- Reuse the original sun and show a clear Imigongo top band.
- Keep the panel white/light grey with green primary action and red only for secondary/error states.
- Do not add Google login until the provider is truly configured and tested.

### Seller and admin
- Keep seller forms and admin controls compact, readable and responsive.
- Do not change seller authentication, authorization, data rules or backend contracts in a visual polish PR.
- Keep statuses truthful. Never fabricate seller verification, activity or catalogue records.

## 6. Language: Kinyarwanda is the first-run default

- A first-time visitor starts in Kinyarwanda (`rw`), regardless of the phone/browser language.
- Only a choice made by the user in the language switcher counts as a saved preference.
- Do not read `navigator.language` to choose the first-run language.
- Do not write an automatically selected language into storage. Keep the runtime default as `rw` until the user makes an explicit switcher choice; persist only that explicit choice.
- Existing explicit stored preferences remain respected.

## 7. What must remain functional

Keep buyer search and filters, categories, product/shop detail routes, seller-grouped cart, WhatsApp messages, saved/followed shops, recently viewed items, seller signup/session handling, dashboards, photo processing/upload, analytics, admin moderation, PWA/offline behaviour, scroll restoration and accessibility. A visual PR must not change auth, Neon schema, RLS/grants, RPC write boundaries, object storage or secrets.

## 8. Screenshot and release gate

For every implementation PR:
- Use Playwright + Chromium. Capture routes for Home, Ibyiciro, Shakisha, a product detail, a shop, Igare, `/injira` and `/abacuruzi`.
- Viewports: 360×800 and 412×915, deviceScaleFactor 2.
- Save 360px captures under `docs/design/qa/<YYYY-MM-DD>/<page>-360.png`; include the 412px captures too with `-412.png` suffix.
- Each committed PNG must be no larger than 400 KB.
- Include a separate 16/24/32px sun/logo comparison and a 360px Imigongo strip screenshot.
- Record how viewport and device scale factor were set. A screenshot is not visual evidence until a human/agent has opened and inspected it.
- No PR is merged until CI is green and the required screenshots have been captured, inspected and committed.
- Do not describe the site as mobile-verified until those steps are done. Real Android-device validation remains distinct from emulated Chromium checks.

## 9. Implementation order

1. Documentation and decision log.
2. Imigongo pattern and auth/hero placement.
3. Compact sun mark, favicon and PWA assets.
4. Approved colour tokens and UI palette.
5. Kinyarwanda first-run language behaviour and unit test.
6. Product detail, cart, login and admin visual refinements.
7. Compare and clean up legacy PR #27.
8. Capture QA, review all screenshots, run CI, merge, then check Render Production.

A Figma file is a design aid, not evidence of a deployed screen. The existing design file is:
https://www.figma.com/design/qpKtPtlog61QfZPXEtgg6S/ISOKO-Marketplace-Design-Direction
