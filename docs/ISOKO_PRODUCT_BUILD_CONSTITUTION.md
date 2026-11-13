# ISOKO — Product & Frontend Build Constitution

**Status:** Active build rules  
**Date:** 2026-11-13  
**Repository:** \`eddyizere24-collab/Isoko-\`  
**Working branch:** \`docs/isoko-build-constitution-20261113\`

This document is the single source of truth for AI Studio and any AI coding agent working on ISOKO. Read it before editing code. The project owner has appointed a project lead to make product and implementation decisions, keep the work coherent, and prevent unfinished or contradictory features.

---

## 1. Product vision

ISOKO is a Rwanda-first, multi-vendor marketplace. A person should be able to discover products, browse a beautiful shop, compare options, and contact a seller easily. A seller should be able to open and manage a shop with as little friction as possible while presenting products professionally and accurately.

The initial catalogue includes shoes, clothing, socks/underwear and accessories. The architecture must make it easy to add other product categories later without rebuilding the application.

ISOKO must feel like a real, carefully curated marketplace: welcoming, visual, trustworthy, easy to explore, and pleasant to spend time in. It must not feel like a generic admin template or a plain grid of coloured boxes.

### Product principles

1. **Buyer-first discovery:** help shoppers find the right product quickly, then help them discover more relevant options.
2. **Seller freedom with clear guidance:** make it easy for any eligible seller to create and manage a shop without confusing steps.
3. **Fair marketplace exposure:** do not let one seller dominate the first screen or the top of every category by default.
4. **Trust through clarity:** show only data that exists. Never invent stock, ratings, reviews, verification, discounts, delivery promises, or seller claims.
5. **Mobile-first quality:** the experience must be excellent on ordinary Android phones and still polished on tablet and desktop.
6. **Visual identity:** use photography, illustration, brand assets, and thoughtful composition. Colour is a supporting design tool, not the entire design.

---

## 2. Scope of this build stage — build the house first

The current assignment is to finish the **product experience, interface, reusable components, front-end architecture, visual assets, and deterministic business algorithms**.

Do **not** start or expand production infrastructure in this stage. Do not connect or migrate a live database, configure production storage, integrate a payment provider, purchase or configure a domain, change hosting, or deploy publicly. Those decisions will be discussed and approved separately by the project owner.

For now:

- Build screens and interactions using typed fixture/demo data.
- Clearly distinguish demo data from real seller information.
- Put data access behind typed repository/service interfaces so a database adapter can be added later without rewriting the UI.
- Keep business logic independent from React components.
- Keep API contracts and domain types clean, but do not claim that demo persistence is production persistence.
- Do not introduce a second database, backend, hosting provider, or auth provider.
- Do not delete the existing Supabase SQL files or old server code as part of a visual task. Record legacy/backend concerns for the later architecture review instead.
- Never expose demo credentials, private personal data, national ID numbers, or secrets in the interface, logs, screenshots, fixtures, or committed code.

**Definition:** “Frontend complete” means a coherent, navigable, visually finished, testable marketplace prototype with functional interactions and replaceable demo data. It does not mean the platform is ready for real customers or production data.

---

## 3. Work discipline — mandatory for every AI Studio session

Before editing:

1. Read this constitution and inspect the actual repository tree.
2. Read the current implementation of every file that will be changed.
3. Identify the current route, component, data type, and test affected.
4. Preserve working functionality. Do not recreate an existing feature simply because another implementation is easier.
5. Write a short plan with the exact files and behaviours to change.

While editing:

- Work in small, logically grouped changes.
- Use the existing naming and architecture where practical; inspect the actual paths because some summaries may use translated or outdated filenames.
- Do not replace a complete file when a focused edit is sufficient.
- Do not run broad automated redesigns across unrelated pages.
- Do not use placeholder buttons, dead links, inert filters, fake loading states, or controls that appear interactive but do nothing.
- Do not silently swallow errors. Show a clear user-facing state and keep a useful diagnostic for development.
- Keep TypeScript strict and avoid \`any\` unless there is a documented reason.
- Extract repeated patterns into reusable components.
- Keep business algorithms in pure, independently testable functions.
- Add or update tests whenever behaviour changes.

After editing:

1. Run lint/type-check, unit tests, and production build.
2. Test every affected route and interaction in a browser.
3. Check at least 360×800, 390×844, 768×1024, 1440×900, and a wide desktop size.
4. Test keyboard navigation, focus visibility, readable text over images, reduced-motion preference, loading, empty, and error states.
5. Report the exact files changed, tests run and results, any known limitations, and the next task.
6. Save meaningful work in a named Git branch with a descriptive commit. Never silently overwrite the project's accepted baseline.

Do not report “done”, “100%”, or “production-ready” unless the corresponding acceptance criteria have actually passed.

---

## 4. Visual direction — photography and illustration are essential

Do not solve the design by changing colours alone. ISOKO needs a recognizable visual world.

### 4.1 Brand assets

Create a coherent brand asset set:

- Primary ISOKO logo: vector SVG wordmark plus symbol.
- Compact symbol for mobile header and app icon.
- Horizontal and stacked logo variants.
- Light-background and dark-background variants.
- Monochrome version for small or constrained placements.
- Favicon and PWA icon set that share one recognizable symbol.
- A small set of consistent interface illustrations and category icons.

Explore a distinctive mark connected to the idea of a market, shopping basket, exchange, or an inviting marketplace. Do not copy Amazon, Alibaba, or another company's logos, arrows, mascots, typography, or distinctive trade dress. Present one consistent identity, not several unrelated logo styles.

### 4.2 Photography and backgrounds

Build an organized local asset library, for example:

- \`public/assets/brand/\`
- \`public/assets/backgrounds/\`
- \`public/assets/categories/\`
- \`public/assets/illustrations/\`
- \`public/assets/promo/\`

Use original, licensed, or otherwise legally reusable images. Do not hotlink random images from other websites. Do not use watermarked stock photos. Record the source/licence for externally sourced assets.

Create or curate:

- A strong fashion/lifestyle hero photograph for the homepage.
- Distinct category imagery for shoes, clothing, socks/underwear, and accessories.
- Editorial/lifestyle background images for seasonal and themed shopping sections.
- Store-cover examples and seller-facing visual guidance.
- Empty-state and onboarding illustrations.
- Promotional campaign artwork in consistent aspect ratios.
- Subtle decorative graphics/patterns to give the marketplace texture and warmth.

Use image overlays only when needed to keep text readable. Use responsive crops and focal points so important parts of an image remain visible on mobile. Background photos must support the content, never make text hard to read or overwhelm the product cards.

**Critical product-photo distinction:** a real listing image must show the actual item offered by the seller. Never use an AI-generated fashion image or lifestyle stock image as though it were a real seller's product. Demo products may use clearly identified demo assets. Campaign and background images may be illustrative, not product evidence.

### 4.3 Product image treatment

- Use a consistent portrait product-card frame, normally around 4:5 for fashion, with consistent crop behaviour.
- Keep the product visible and large enough to assess.
- Support multiple product views in the detail gallery, with zoom/lightbox and thumbnails.
- Do not stretch images or mix arbitrary aspect ratios in one row.
- Display a neutral, designed fallback when an image is absent; do not show a broken-image icon.
- In the seller flow, support preview, reorder, choose-cover, remove, and clear image quality guidance.
- Do not put promotional text, fake price labels, or badges inside the seller's actual product photograph.

---

## 5. Design system and interface quality

Create reusable design tokens for typography, spacing, surfaces, borders, radii, shadows, and a restrained supporting palette. The palette must support the photography and brand identity rather than compete with them.

Typography should be clean, highly readable, and support Kinyarwanda characters. Use a clear hierarchy: page title, section title, product title, price, supporting text, and metadata.

Use consistent:
- Header and navigation.
- Buttons, icon buttons, inputs, selects, checkboxes, chips and filter controls.
- Product and shop cards.
- Carousels, image galleries, badges, dialogs and bottom sheets.
- Loading skeletons, empty states, success messages and error messages.

Avoid:
- Huge empty colour panels.
- Excessive gradients, glowing effects, glassmorphism, and decorative animation.
- Too many pill-shaped containers.
- Dense product cards with tiny text.
- Inconsistent icon styles.
- Excessively rounded cards on every surface.
- Decorative emoji in place of proper icons or illustrations.
- Layouts that look polished on desktop but collapse on a small phone.

Every important action must have a visible and understandable label. Touch targets should be comfortable on phones. Use semantic HTML, accessible labels, visible focus, sufficient contrast, and reduced-motion support.

---

## 6. Buyer experience — required product behaviour

### 6.1 Global navigation

The buyer must always be able to reach:

- Home.
- Search.
- Categories.
- Cart.
- Account/login where applicable.
- Seller registration.
- Help, about, terms, and privacy pages.

The mobile layout should prioritize search, shopping, and cart without crowding the header. Preserve the current route and query/filter state when a user returns from a product detail page where practical.

### 6.2 Homepage composition

Build a deliberate editorial flow, not one endless undifferentiated product grid. The homepage should contain, in an intentional order:

1. A polished header with the ISOKO logo and prominent search.
2. A hero/window-display area with a strong lifestyle image and a clear shopping action.
3. A dedicated rotating promotional campaign strip/carousel (see section 9).
4. Visual category navigation.
5. Relevant product collections such as new arrivals, popular products, deals, and recently viewed.
6. A personalized “Continue exploring” or “For you” collection when there is enough interaction context.
7. Distinct themed collections or seasonal editorial panels.
8. A discovery area featuring different approved shops, not just one seller.
9. A seller invitation that explains how easy it is to open a shop.
10. A carefully designed footer.

Each collection needs a clear heading, an optional short explanation, a “See all” action, and a meaningful empty state. Do not render empty shelves just to fill space.

Horizontal shelves should support touch scrolling on mobile, trackpad/mouse scrolling where practical, and visible navigation controls on desktop. Do not auto-scroll product rows.

### 6.3 Search and category browsing

Search must support:
- Product names and partial names.
- Brand names where supplied.
- Category and subcategory names.
- Common Kinyarwanda/English/French terms and approved synonyms.
- Typing variations and likely spelling errors without matching unrelated items.
- Filters for category, size, price range, condition, colour, location, discount, stock status, and other category-specific attributes where relevant.
- Sorting by relevance, newest, price low-to-high, price high-to-low, and popularity when valid data exists.
- Clear all, active filter chips, result count, and no-results guidance.

**Hard category rule:** if a shopper opens Shoes, the main results must remain shoes. If the shopper opens Clothing, main results must remain clothing. Do not mix unrelated categories into the primary result grid. Related or alternative products may appear only in a separate, clearly labelled section.

Make filters easy to use on mobile through a bottom sheet or full-screen panel. Preserve selections when the sheet closes. Do not hide important active filters.

### 6.4 Product detail page

The detail page must clearly show:
- Product image gallery and image zoom.
- Product name, actual current price, and old price only when valid.
- Discount percentage only when mathematically correct.
- Condition, brand where accurate, colours, and selectable sizes/variants.
- Stock/availability status only when known.
- Seller/shop identity and verification status only when confirmed.
- Shop location as supplied by the seller, not guessed.
- WhatsApp and call actions.
- Add-to-cart feedback.
- Related products from the same category.
- Reports/help action.
- Delivery information only when the seller has supplied it.

Do not fabricate reviews, ratings, “best seller” badges, stock counters, or guaranteed delivery dates.

### 6.5 Cart

The cart must:
- Group items by seller.
- Display selected size/colour and quantity.
- Show current prices and detect changed prices.
- Check availability before creating the WhatsApp message.
- Clearly identify sold-out or unavailable items.
- Calculate subtotals correctly.
- Explain that contact/payment/delivery arrangements are made with the seller in this build stage.
- Never imply that an order or payment has been completed when it has not.

---

## 7. Seller experience — make opening a shop genuinely easy

A seller is a central user, not an afterthought.

### 7.1 Seller onboarding

Create a clear, friendly wizard with visible progress and short steps:

1. Seller identity and contact details.
2. Shop name, description, category, and location.
3. Shop photos and verification information.
4. Review, confirmation, and next steps.

Save a draft in the current demo experience. Clearly show required versus optional fields. Give examples in Kinyarwanda. Avoid asking for the same information twice.

Make review status visible: draft, submitted, needs changes, approved, rejected, or suspended. Explain exactly what the seller should do next.

Do not treat missing ID images as submitted KYC. Do not prefill identity information with sample values.

### 7.2 Seller shop page

Each shop must feel like an individual store:

- Cover photo and logo/avatar.
- Shop name, description, location and supplied business hours.
- Clear contact actions.
- Category navigation within that shop.
- Search within shop.
- Product grid with the same professional card system.
- Featured collections or pinned products.
- Store-specific promotional panels where appropriate.
- A clear verification indicator only when confirmed.

### 7.3 Seller dashboard

Build a helpful dashboard with:
- Overview of published, draft, sold-out and hidden products.
- Quick add-product action.
- Clear stock confirmation and price update actions.
- Recently viewed/contacted performance when demo metrics exist.
- Product management and shop settings.
- An explanation for every status and warning.
- Useful mobile-first forms and tables/cards.

Do not show meaningless zero KPIs as if they were real business performance. Label demo metrics clearly.

### 7.4 Product creation

Make the product creation flow guided, short, and forgiving:

- Photos first, with preview and image-order controls.
- Category and subcategory selection.
- Product name, description, brand and condition.
- Price and optional previous price.
- Sizes/variants, colours and stock.
- Review screen before saving/publishing.
- Field-level validation with plain-language error messages.
- Draft save and recovery.

Category-specific fields must be configurable so future categories do not require a rewrite.

---

## 8. Marketplace discovery and ranking algorithms

This is a core product feature, not a cosmetic shuffle. Implement the algorithms as pure TypeScript functions with typed inputs/outputs, configuration, unit tests, and deterministic test fixtures.

### 8.1 Ranking order

Use a transparent ranking pipeline:

1. Apply hard eligibility rules first: correct category when selected, valid demo listing, visible status, and known stock state.
2. Calculate search relevance from exact phrase, normalized tokens, brand, category, synonyms and attributes.
3. Apply relevant filters.
4. Add context signals when available: category interest, recent searches/views, preferred size, and selected area.
5. Apply freshness and popularity only when the corresponding data exists.
6. Apply seller-exposure balancing among products with comparable relevance.
7. Produce a stable, paginated order.

Do not let a low-relevance product win simply because its seller has not been shown recently. Relevance and shopper intent come first; exposure fairness is a controlled tie-breaker and diversity mechanism.

### 8.2 Seller rotation and fairness

The first screen must not be dominated by one seller when enough eligible sellers exist.

Implement a seller-diversity stage with rules such as:

- Avoid more than two consecutive product cards from the same seller when alternatives of comparable relevance exist.
- In the first 10–12 visible results, aim for meaningful seller diversity when the catalogue supports it.
- Use weighted round-robin or exposure-aware interleaving across sellers after relevance buckets are established.
- Give lower-exposure sellers a fair opportunity without promoting irrelevant or low-quality listings.
- Prevent a single shop from appearing first every time the app opens.
- Keep the order stable while the shopper is scrolling; do not reshuffle on every React render.
- Use a seeded session/time rotation or another deterministic method so the order can vary between visits without jumping around mid-session.
- If only one seller has matching products, show that seller's products rather than inserting unrelated products to simulate variety.

### 8.3 Category continuity

When a shopper chooses a category, every primary result must respect that category. Relevance inside the chosen category is more important than overall popularity.

If a shopper opens a specific shoe, the next products should prioritize:
- Same product type.
- Similar use/style.
- Compatible size or variant where provided.
- Similar price range.
- Similar colour/brand where relevant.
- Other products in the same category.

Cross-category recommendations must be in a separately labelled “You may also like” collection.

### 8.4 New and returning shoppers

For a new visitor with no history, use balanced default discovery: new items, broad popularity where data exists, category exploration, and fair seller rotation.

For returning visitors, use limited, understandable signals:
- Categories searched or browsed.
- Products viewed recently.
- Saved size preferences.
- Voluntarily selected location.
- Explicit follows or saved shops if available.

Do not use sensitive identity details to personalize shopping. Provide a way to clear locally stored demo preferences. Do not pretend a user has purchased an item or has a shopping history when they have not.

### 8.5 Explainability and tests

For development, allow the ranking function to return optional score reasons such as “exact search match”, “selected category”, “new listing”, or “seller exposure balance”. These reasons are for tests/debugging, not necessarily all shown to buyers.

Test at least:
- Exact and typo-tolerant search.
- Strict category filtering.
- Size/price/location filters.
- Ranking stability across re-renders.
- Seller diversity with enough sellers.
- One-seller and small-catalogue fallback.
- No fabricated stock or rating data.
- No cross-category leakage.
- Pagination without duplicate or missing products.

---

## 9. Rotating promotions and advertisements

Create a dedicated, visually attractive promotional area near the top of the homepage, below or beside the main search/navigation depending on responsive layout.

This should feel like a curated, rotating shop window — not an annoying popup or a flashing ticker.

### Required behaviour

- A horizontal image-led carousel for several campaigns: shoes, clothing, new collections, seasonal products, seller offers, and featured shops.
- Each slide has a campaign image, concise headline, optional subtitle, and one clear action.
- The action opens the relevant product, category, shop, or collection.
- Support touch swipe, previous/next controls, pagination dots, keyboard navigation, and accessible labels.
- Use a calm transition. Auto-advance only at a comfortable interval; pause on hover/focus and when the user interacts. Respect reduced-motion settings.
- No sound, no forced full-screen takeovers, no flashing content, no unexpected layout shifts.
- Clearly label paid placements as “Kwamamaza” or “Sponsored”. Organic editorial collections must not be disguised as paid ads.
- Do not invent discounts, expiry dates, “last chance” messages, or campaign claims.
- If no campaigns exist, show a clean fallback or hide the promotional area. Never display fake campaigns as real.

### Future-ready campaign model

Create a typed front-end model for campaign content with fields such as:
- id
- title
- subtitle
- image
- destination type (product, category, shop, collection)
- destination id/slug
- start/end date
- status
- priority/order
- sponsored flag
- call-to-action label
- alt text

For this stage, use clearly marked local fixtures. Keep the carousel independent from the future campaign-management backend.

Also design an admin-facing campaign preview/management interface as a prototype if it fits the current admin architecture: create, edit, reorder, preview, schedule fields, enable/disable, and inspect destination. Do not claim these actions persist to a production database.

---

## 10. Admin and moderation experience

The Admin interface must be clear and safe, not just a collection of tables.

Prototype the workflows for:
- Overview and activity summary.
- Seller applications and KYC review status.
- Product moderation and reported listings.
- Category and synonym management.
- Promotional campaign management.
- Marketplace configuration.
- Audit history.
- Data export preview.

Use clear confirmation for destructive actions. Show who/what is affected. Keep KYC data masked in ordinary lists and show it only in a restricted review view in the future authenticated architecture. Do not expose demo personal data in screenshots.

---

## 11. Language and Rwanda context

Kinyarwanda is the default interface language. Keep language strings in a translation layer rather than scattering literal text throughout components. Prepare the structure for English and French.

Use natural, simple Kinyarwanda for buyer and seller actions. Preserve familiar English technical/commerce terms when they are widely understood, but avoid inconsistent or machine-translated wording.

Use Rwanda-specific conventions:
- Prices in RWF.
- Rwanda phone-number formatting.
- Rwanda administrative location choices where needed.
- Mobile data and low-end Android performance as a key constraint.
- WhatsApp contact as a prominent seller-buyer channel.

Do not make location, payment, delivery, seller verification, or legal claims without supplied facts.

---

## 12. Performance and accessibility

- Optimize and compress image assets; use responsive image sizes and lazy loading below the fold.
- Do not load every large background image immediately.
- Provide explicit image dimensions/aspect ratios to limit layout shift.
- Keep the initial mobile view light and fast.
- Avoid unnecessarily heavy animation packages or duplicate dependencies.
- Use semantic headings and landmarks.
- Ensure keyboard operation for dialogs, menus, filters and carousels.
- Restore focus after dialogs close.
- Respect reduced-motion preferences.
- Ensure text remains readable over photography.
- Use accessible alt text that describes the image's purpose, not keyword stuffing.

---

## 13. Required acceptance checklist before calling the frontend complete

### Brand and visuals
- [ ] Final consistent ISOKO logo family exists as usable SVG and app assets.
- [ ] Homepage has real, appropriate hero/lifestyle photography.
- [ ] Category imagery and interface illustrations are consistent.
- [ ] Product photos are never confused with decorative or AI-generated campaign images.
- [ ] No broken images, unlicensed hotlinks, or random placeholders.

### Buyer
- [ ] Search and all filters work.
- [ ] Category pages never leak unrelated products into primary results.
- [ ] Seller rotation is fair but never defeats relevance.
- [ ] Product pages, galleries, variants, WhatsApp and call links work.
- [ ] Cart validates and clearly explains price/stock changes.
- [ ] Empty, loading, error and no-results states are designed.

### Seller
- [ ] Onboarding works as a complete guided flow.
- [ ] Draft, review and approval states are clear.
- [ ] Product creation and editing work with validation.
- [ ] Shop page and seller dashboard are mobile-friendly.
- [ ] No fake KYC success or fake stock claims.

### Promotions
- [ ] Campaign carousel has working navigation and destinations.
- [ ] Paid and organic placements are distinguishable.
- [ ] Reduced motion, pause and manual controls work.
- [ ] Empty campaign state is clean.

### Code quality
- [ ] Reusable components and typed domain models are in place.
- [ ] Algorithms are isolated and tested.
- [ ] No dead buttons, fake actions, broken routes or console errors.
- [ ] Lint/type-check, unit tests and production build pass.
- [ ] Mobile, tablet and desktop checks pass.
- [ ] All demo data is clearly identified as demo.

### Scope protection
- [ ] No production database migration or connection was made.
- [ ] No hosting/domain/production environment was changed.
- [ ] No public deployment was made.
- [ ] No secrets or real personal data were committed.

---

## 14. Reference products — learn patterns, never clone

Study these products for interaction patterns and quality standards, not for copying their branding or exact layouts:

- **Amazon:** personalized homepage groupings, horizontal product collections, “continue shopping” patterns, and clear product discovery. Official explanation: https://www.aboutamazon.com/news/retail/amazon-homepage-redesign-features
- **Alibaba.com:** search-first product and seller discovery, category browsing, supplier profiles and trust indicators. Buyer guide: https://buyer.alibaba.com/page/HowItWorks/Page.html
- **Baymard Institute:** product listing, filtering and sorting usability research. https://baymard.com/research/ecommerce-product-lists
- **Amazon seller image guidance:** clear, accurate product photography with useful additional views. https://sellercentral.amazon.com/help/hub/reference/external/G200216080

The lesson is not “make ISOKO look like Amazon.” The lesson is to combine effective discovery, strong imagery, useful filters, clear seller identity, and fair exposure into an experience designed for Rwanda.

---

## 15. Required response format from AI Studio after every work session

Always return:

1. **What was completed** — specific screens, interactions and algorithms.
2. **Files changed** — exact repository paths.
3. **Visual changes** — assets created/added, layouts changed, and which screen sizes were checked.
4. **Tests** — exact commands and pass/fail counts.
5. **Known gaps** — honest list; never hide unfinished work.
6. **Next recommended task** — one coherent next step.
7. **Progress estimate** — based on accepted checklist items, not on number of files changed.

If a requirement is ambiguous, inspect the code and make the most coherent reversible choice. Ask the project owner only when a decision changes product policy, commercial terms, legal commitments, handling of sensitive data, or the agreed scope.

**Final instruction:** Build the complete, thoughtful marketplace experience before discussing production data, hosting, and launch. Do not confuse a quick-looking demo with a finished product. Build carefully, test thoroughly, preserve good work, and keep the repository clean.
