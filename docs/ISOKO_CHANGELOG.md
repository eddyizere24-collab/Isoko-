# ISOKO — Frontend & Marketplace Architecture Documentation

## 1. Brand Identity & Visual System
- **Logo Family (`src/components/IsokoLogo.tsx`)**:
  - `IsokoMark`: Architectural Kigali market arch framing a Rwandan diamond weave in `#0B6E4F` (Isoko Emerald) and `#E8A33D` (Warm Amber Gold).
  - `IsokoWordmark`: Horizontal wordmark pairing `IsokoMark` with `Plus Jakarta Sans` display typography used in `Header` and `Footer`.
  - `IsokoVerifiedSeal`: Verified merchant emblem paired explicitly with `"Ryagenzuwe"` text on verified storefronts (`HomePage` & `ShopPage`).
  - `RwandanGeometricPattern`: Subtle Imigongo-inspired geometric SVG divider used beneath storefront hero banners.
- **Typography (`index.html`, `src/index.css`)**:
  - Display Headings (`--font-display`): `Plus Jakarta Sans` (600, 700, 800).
  - Body Copy (`--font-body`): `DM Sans`.
  - Tabular Numerals (`--font-mono`, `.tabular-nums`): Applied across all RWF prices, discount percentages, view/WhatsApp metrics, and campaign CTR counters.

## 2. Photography & Storefront Assets (`src/assets/images/`)
- Editorial storefront & campaign banners:
  - `hero_kigali_fashion_1794551814589.jpg`
  - `promo_kigali_market_1794567241262.jpg`
  - `promo_ankara_craft_1794567240592.jpg`
- Product photography (dedicated distinct imagery across categories):
  - Footwear (`shoe_sneaker_white_1794551815135.jpg`, `shoe_running_black_1794551815861.jpg`, `shoe_loafer_leather_1794551815157.jpg`, `product_women_sneakers_1794567241190.jpg`)
  - Clothing (`apparel_ankara_jacket_1794551815266.jpg`, `apparel_hoodie_denim_1794551815431.jpg`, `product_jeans_denim_1794567240548.jpg`)
  - Socks & Underwear (`socks_athletic_pack_1794551816475.jpg`)
  - Accessories (`accessory_leather_bag_1794551816434.jpg`, `product_sunglasses_belt_1794567240410.jpg`)

## 3. Search Discovery, Category Isolation & Seller Rotation (`src/lib/algorithm.ts`)
- **Strict Category Isolation (`detectCategoryIntent`)**:
  - Single-category search terms (e.g., `"inkweto"`, `"basket"`, `"imyenda"`, `"amasogisi"`, `"isakoshi"`) lock search results strictly to that top-level category tree so incidental cross-category mentions in product descriptions (e.g., `"inkweto za siporo"` inside a socks description) cannot leak unrelated items into search results.
- **Kinyarwanda & Phonetic Synonyms (`expandSynonyms`, `DEFAULT_SYNONYMS`)**:
  - Resolves localized phonetic queries (e.g., `"nayiki"` → `"nike"`, `"ijini"` → `"ipantalo ya jean"`, `"isogisi"` → `"amasogisi"`).
- **Fair Seller Rotation (`interleaveBySeller`)**:
  - Enforces `maxConsecutiveSameShop: 1` and bounded `maxPerShop` across `buildHomeShelves`, `getSimilarProducts`, `searchAndRankProducts`, and the progressive homepage catalog grid.
- **Category Route Fix (`src/App.tsx`)**:
  - Fixed `/c/:slug` and `/icyiciro/:slug` routes to pass `initialCategorySlug` into `<SearchPage />` instead of falling through to 404.

## 4. Promotional Carousel & Campaign Management
- **`PromoCarousel` (`src/components/PromoCarousel.tsx`)**:
  - Accessible `carousel` region supporting keyboard ArrowLeft/ArrowRight navigation, touch swipe gestures, hover/focus pause, `prefers-reduced-motion` auto-rotation disablement, measured dark gradient scrim (`>= 4.5:1` contrast), and daily-deduplicated impression/click tracking via `POST /api/campaigns/:id/track`.
- **`rotateActiveCampaigns` (`src/lib/algorithm.ts`)**:
  - Fairly rotates active carousel slides over time via `/api/bootstrap`.
- **Admin Kwamamaza Tab (`src/pages/AdminPage.tsx`, `/admin/kwamamaza`)**:
  - Create new promotional slides, toggle active/paused status, reorder priority (`sortOrder`), delete campaigns, and inspect live impression/click/CTR analytics.

## 5. Storefronts & Seller Tools
- **Individual Seller Storefronts (`src/pages/ShopPage.tsx`, `/i/:slug`)**:
  - Storefront cover banner + overlapping logo, verified merchant seal, delivery/operating hours metadata, in-shop keyword search (`Shakisha muri iri duka...`), category filters, WhatsApp/Phone CTAs, Follow, Share, QR modal, and Report modal.
- **Seller Product Editor (`src/pages/SellerProductsPage.tsx`, `/umucuruzi/ibicuruzwa`)**:
  - Added full **"Hindura"** (Edit Product Modal) supporting validated edits to `name`, `price`, `old_price`, `condition`, `brand`, `authentic`, `description`, and per-size `in_stock` / `qty` values, alongside Quick Price Edit, Mark Sold/Restore, Copy, and Delete.

## 6. Environment & Persistence Notes
- Local JSON demo persistence (`data/db.json`) with typed interfaces (`src/types/marketplace.ts`) — intentionally decoupled from external production databases or public hosting deployments.
- Note: No `.git` repository is initialized in this AI Studio sandbox environment.
