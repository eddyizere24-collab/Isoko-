# ISOKO Visual System & Experience Direction
Date: 2026-11-15
Status: Direction approved for implementation by project owner in chat. This document is a design/UX specification, not a claim that the changes are already live.

## 1. Product principle

ISOKO is a Rwanda-first marketplace that helps buyers discover real products and contact the real seller directly. It is a compact, trustworthy shopping experience, not a generic storefront template and not a copy of Alibaba.

Learn from Alibaba's information density, category browsing, seller discovery and clear product actions. Do not copy Alibaba's logo, colour system, wording, imagery, page composition or B2B-only mechanics. ISOKO's own identity, Rwanda context and WhatsApp-first buying flow remain distinct.

**Primary outcome:** a buyer can discover an item quickly, understand its price/size/shop/location, and contact the seller without friction. A seller can open a shop, publish real products, manage their profile and stock, and receive enquiries without fighting the interface.

## 2. Brand lock: preserve the original ISOKO sun

The original ISOKO mark is a ring of many small, differently coloured beads around a deliberately open centre. It represents the meeting point of buyers and sellers.

- Keep the original multicolour hollow-centre sun. Do not replace it with a plain green icon, filled sun, bag, house, generic diamond, or a new simplified symbol.
- Do not fill the centre. Do not remove the colours or collapse the logo to only green/red.
- Reuse the original vector source from the historic brand implementation in `feature/isoko-brand-imigongo-phase3-20261114` (source file `src/components/IsokoLogo.tsx`, sun-mark component) and verify all exported assets against it.
- Update all app marks consistently: header/footer, auth headers, favicon, PWA 192/512/maskable icons and Apple touch icon. Keep enough clear space around the mark and test legibility at 16px, 24px and 32px.
- The wordmark must remain quiet and distinctive. Do not let the wordmark become louder than the sun mark.

Brand accents may reuse colours already present in the original logo (ochre, clay red, blue, violet, teal and rose), but the application interface itself must not become a rainbow. The sun is the colour-rich focal point; the UI around it is restrained.

## 3. Visual direction: quiet editorial commerce

Target feeling: composed, confident, crafted, contemporary, Rwanda-rooted, premium but approachable. It should look deliberately art-directed, not like a beginner Tailwind template or a default component-library demo.

Use:
- Warm paper / mineral canvas rather than stark app-green backgrounds.
- White or warm-white cards with precise borders and clean spacing.
- Charcoal typography for primary reading.
- Deep forest as a single high-value action colour, used sparingly.
- Clay red and warm ochre for selected accents, sale indicators and fine details.
- A precise Imigongo line signature to give ISOKO its Rwandan identity.
- Strong information hierarchy, subtle alignment, measured whitespace and compact components.

Avoid:
- Large green slabs, green gradients and green-tinted panels everywhere.
- Generic green rounded-card UI with default shadows.
- Random decorative blobs, excessive gradients, glassmorphism, noisy background imagery or excessive badges.
- Oversized headings, oversized product cards and oversized buttons.
- A rainbow UI that competes with the multicolour sun.
- Stock/AI product imagery or fabricated sellers, reviews, prices, counts and testimonials.

Suggested starting tokens (adjust only with visual evidence, not arbitrary taste):
- Canvas: warm paper `#F7F5F0`
- Card: `#FFFFFF`
- Soft stone: `#EEECE6`
- Text: charcoal `#202724`
- Muted text: `#68716D`
- Border: `#E3E0D8`
- Primary action: deep forest `#214E43`
- Soft forest: `#E9F0EB`
- Clay red: `#BD594A`
- Ochre: `#C99A4B`

These are a design direction, not a licence to paint every surface green. A screen should remain mostly paper/white/charcoal, with the action colour reserved for the one most important action.

## 4. Imigongo: the visual signature

The user explicitly wants designed line work, not a generic green background. Imigongo must be a recognisable, consistent visual signature.

Build one lightweight, editable SVG pattern family based on genuine geometric Imigongo principles: connected diamonds, nested forms, precise angular turns and controlled zig-zag/spiral-like linework. Use proper paths and repeatable tiling, not a row of unrelated triangles.

Use it in these restrained places:
1. A fine but visible branded rule below the main header.
2. A slightly stronger top rule on the footer.
3. A small corner composition in the home hero.
4. The coloured header band on sign-in and seller-registration pages.
5. A subtle cover placeholder on a shop with no cover image.

Do not put the pattern behind long text, product cards, form fields, product photography or dense catalogues. It is line work, not wallpaper. Keep it crisp on low-end Android displays and avoid large SVGs or expensive filters.

## 5. Global layout and density

Design mobile-first, with 360px Android as the baseline and responsive tablet/desktop layouts.

### Header
- One compact sticky row: small original sun + wordmark, flexible search field, location affordance, cart/account actions.
- Keep height around 52–58px.
- Category chips and secondary navigation are separate from the sticky row; they should not consume the whole first viewport.
- Search remains immediately reachable.
- Use compact icon buttons with accessible tap targets (at least 44×44px even if the visible icon is 18–22px).

### Product listing
- 3 columns below 480px; 4 from 480px; 5 from 768px; 6 from 1024px; 7 from 1280px.
- Use 6–8px gaps and 8–12px outer gutters on small screens.
- Product photo square and seller-uploaded only.
- Card body is compact: price first, product name limited to two lines, then shop/district in muted metadata.
- Keep the whole card around 185px maximum on mobile.
- No heavy drop shadow. A 1px border and clear surface contrast are enough.
- Do not show fabricated sample listings when Production is empty. Empty states must still look intentional and helpful.

### Categories
- On mobile, use a narrow left category rail (about 26%) and a right subcategory grid of three columns.
- Prefer real category photos when available from approved content; otherwise use refined, consistent outline icons. Do not invent category photographs.
- Category tiles remain small, aligned and easy to scan.

### Product detail
- Product gallery uses a 4:3 image area or no more than about 46% of viewport height, with compact 48px thumbnails and a clear image count.
- Product title around 15px/20px, price around 20px/24px, details/meta around 12px.
- Seller strip should show the real shop name, true verification state, location and a clear shop link.
- Variant/size chips around 32px tall while retaining touch targets.
- Fixed bottom actions: WhatsApp contact, cart, and one primary purchase/contact action. Keep the WhatsApp-first business model truthful; do not imply online payment or delivery fulfilment that ISOKO does not provide.
- Related products and more from the same seller should be available directly below the item.

## 6. Seller experience: simple to open, complete later

The seller journey is a first-class product flow, not an afterthought.

### Opening a shop
- Step 1: account credentials (email + password; full name optional).
- Step 2: shop name + WhatsApp/contact number + district, with terms acceptance.
- No National ID, TIN, selfie, ID photo or KYC document is required to open the basic shop.
- New shops must clearly display their real status, e.g. “Ritaragenzurwa”. Never imply that a shop is verified until an actual identity review has happened.
- Google sign-in must remain hidden until a real OAuth provider is configured and tested.

### Shop profile
Allow sellers to complete the profile after the shop has opened:
- Profile photo, cover image and shop logo.
- Short bio and shop description.
- WhatsApp/contact, hours, location/landmark and delivery information.
- Social links (Facebook, Instagram, TikTok, YouTube and website).
- A visible but truthful profile-completion indicator, based only on fields that actually exist.
- Shareable public shop URL and QR; social preview metadata should be implemented only with a technically valid server-rendered/pre-rendered approach.

### Seller dashboard and products
- A calm dashboard with clear next action: add first product, complete shop profile, manage listings.
- Product entry should guide the seller through photo, category, name, price, sizes/colours, stock and optional description without overwhelming them.
- Reuse the existing product creation/editing, photo upload, hide/unhide, sold-out/restore stock and WhatsApp sharing flows.
- Make photo handling reliable on Android Gallery/Camera formats; process images on-device where possible, and preserve the server-side file validation and ownership checks.
- Show upload progress, clear failures, retry and draft preservation.
- Never expose demo login credentials or sample shop accounts in public UI.

## 7. What must be preserved

Before changing any screen, map its current functionality and confirm what it uses. Keep existing working capabilities unless there is a clear, tested reason to improve them.

Preserve:
- Buyer search, synonyms, filters, sort options and location selection.
- Categories and subcategories.
- Product detail and seller/shop pages.
- Cart grouping by shop and WhatsApp order/contact message.
- Recently viewed and saved/followed shop preferences.
- Seller registration, real session handling, seller dashboard and product management.
- Product image processing, upload ownership validation and protected seller actions.
- Shop profile, analytics and truthful verified-state presentation.
- Admin moderation, reporting and admin-only routes.
- Neon data model, RLS/grants, RPC write boundary and storage security.
- PWA/offline behaviour, scroll restoration, responsive navigation and accessibility.

A visual redesign must not silently remove functionality or bypass the existing backend/security contract.

## 8. Language and content

- Kinyarwanda is the primary language.
- English is supported.
- French, Kiswahili, Ikirundi and Lingala may be present as beta until reviewed by fluent speakers.
- Keep product and shop names as entered by sellers; translate interface strings only.
- Keep currency truthful and consistent (RWF).
- Do not invent support phone numbers, seller identities, product availability, review scores, discount figures or order counts.

## 9. Quality gate

Each screen must be checked at:
- 360×800 Android baseline, including a narrow 320px layout.
- Tablet width.
- Desktop width.

Validate:
- No horizontal overflow, clipped text, accidental card truncation or overlapping fixed navigation.
- Strong text contrast and readable type.
- Keyboard focus and screen-reader labels for all interactive controls.
- Touch targets at least 44×44px.
- Reduced-motion preference.
- Product cards and category grids meet the compact density rules.
- Empty catalogue and empty seller dashboard states remain intentional and honest.
- Search, category navigation, product detail, cart and WhatsApp flows still work.
- Seller signup/session/photo upload/product publishing flow is tested with an owner-approved isolated account before any public launch.
- CI must be green before merge. Production deployment and Production database changes require the established approval/release process.

## 10. Implementation sequence

1. Preserve and restore the original multicolour hollow sun mark across all app/PWA assets.
2. Finalise global design tokens, typography, spacing, Imigongo line signature, header and navigation.
3. Refine home, category and search density without changing their data/query behaviour.
4. Refine product detail, shop profile and card relationships.
5. Refine seller opening, shop completion and seller dashboard while preserving auth/upload behaviour.
6. Refine cart, WhatsApp handoff, help, static pages and admin surfaces.
7. Run automated checks and device-size regression tests; only then prepare a release.

Do not treat a Figma mock or design document as a shipped website. A feature is complete only when its code is merged, CI is green and the intended deployment is verified.
