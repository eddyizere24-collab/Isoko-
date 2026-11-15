# AGENTS.md — Amategeko y'abakora kuri ISOKO (abantu na AI)

Soma mbere:
- [ISOKO Visual System](docs/design/ISOKO_VISUAL_SYSTEM_2026-11-15.md): icyerekezo cy'ikirango, layout, Imigongo, home/catalogue, product details, seller flow n'ibyo tugomba kugumana.
- [Production Security Gate](docs/ISOKO_PRODUCTION_SECURITY_GATE.md): uko Production, auth, database, backups na release gates bihagaze.
- [Changelog](docs/ISOKO_CHANGELOG.md): ibyahinduwe n'ibitaragenzurwa.

## Ubuyobozi bwa design n'ubwubatsi

Nyiri umushinga yahaye ChatGPT kuyobora product design n'iterambere rya ISOKO. ChatGPT ni yo ihuza UX research, icyerekezo cya visual system, Figma/design work, implementation reviews na GitHub quality gates. Ibyemezo bigomba gushingira ku byo nyiri umushinga yatanze no ku makuru yemejwe muri repository/live system.

- **Ikirango ntigihindurwa:** gumana ISOKO sun mark y'utubara twinshi tuzengurutse umwanya ufunguye hagati. Ntuyisimbuze icon rusange y'icyatsi cyangwa ikindi kimenyetso.
- Alibaba ni isoko yo kwigira ku compact information density, categories, product discovery na seller storefront. Ntukopere logo, ibara, inyandiko, amafoto, UI layout cyangwa B2B mechanics byayo.
- Design igomba kuba calm, premium, distinctive kandi yihariye ISOKO: warm-neutral surfaces, charcoal typography, deep-forest primary action ikoreshwa gake, subtle clay/ochre accents, n'imirongo ya Imigongo igenzuwe.
- **Ntukore generic green template:** nta green panels hose, nta gradients z'icyatsi, nta heavy shadows, nta random decoration.
- Figma ikoresha editable layers/components/tokens; screenshots ni reference gusa, si deliverable. Adobe Express ikoreshwa ku bikoresho byo kwamamaza/brand collateral igihe bikenewe; ntikoreshwe gusimbura code ya application.
- Ntukoreshe amafoto ya AI cyangwa stock nk'aho ari ibicuruzwa by'abacuruzi. Product imagery igomba kuva ku mucuruzi nyir'igicuruzwa. Empty catalogue igume ari empty, yerekanywe neza kandi mu kuri.
- **Ntugasenye ibikora:** buyer search, synonyms, filters, categories, product/shop details, cart, WhatsApp handoff, saved/followed items, seller auth, seller dashboard, product management, image upload, analytics, admin moderation, Neon/RLS/RPC/storage safeguards, PWA, scroll restoration.
- UI/visual changes zigomba kugumana business logic n'umutekano. Auth/database/RPC/permissions bihindurwa mu PR yihariye kandi bikorerwa tests zikwiriye.
- PR ntoya, ikibazo kimwe, branch imwe; nta direct commit kuri `main`.

## Iki ni iki

ISOKO ni marketplace yo mu Rwanda ihuza abaguzi n'abacuruzi kuri WhatsApp. Frontend: Vite + React 19 + TypeScript + Tailwind CSS 4; backend: Neon PostgreSQL, Neon Auth, Neon Function `isokoapi`, Object Storage; public frontend: Render Static Site. Ikinyarwanda ni rwo rurimi rw'ibanze.

ISOKO ntirakira ubwishyu kandi ntivuga ko yemeza delivery cyangwa Trade Assurance. Umuguzi n'umucuruzi bumvikana uko bishyura n'uko igicuruzwa gitangwa.

## Amategeko y'umutekano n'amakuru

- Ntugashyire secrets, tokens, passwords, admin bootstrap codes, National IDs cyangwa KYC files muri Git, public bundles cyangwa logs.
- Ntushyire demo identities, fake shops, products, orders, reviews cyangwa analytics mu repo cyangwa muri Production.
- Seller writes zigume muri server-side RPC/function; RLS na least-privilege grants ntibisenywe.
- KYC ibe opt-in nyuma yo gufungura iduka, gusa igihe umucuruzi asabye kugenzurwa. Ntisabwa kugira ngo afungure basic shop.
- Google OAuth ntiyerekanwe kugeza credentials zemewe zashyizweho kandi provider igeragejwe.
- Ntukoreshe WhatsApp/support phone fallback itaremezwa na nyiri umushinga.
- Ntukore Production SQL, guhindura Production environment variables, privileges/RLS, DNS, billing cyangwa public deploy hatabanje kubahirizwa release approval.
- Ntukore paid plans, prepaid AI credits cyangwa serivisi zishyurwa nta ruhushya rwihariye.

## Seller experience

- Basic signup: account credentials (email/password), hanyuma shop name, WhatsApp/contact number, district n'amasezerano.
- Full name ni optional; National ID, TIN, ID photos, selfie na KYC ntibisabwa mu gufungura basic shop.
- Nyuma yo gufungura iduka, seller ashobora kuzuza profile: photo, cover, logo, bio, description, hours, location, delivery info na social links.
- New shop igaragaza status nyayo nka `unverified`; Verified badge igaragara gusa nyuma y'igenzura nyakuri.
- Seller ashobora kongeraho/kuhindura/hisha/kugarura ibicuruzwa, stock, sizes, colours n'amafoto. Ntukureho functionality iriho.
- Seller photo intake igomba gukora neza kuri Android Gallery/Camera; browser-side compression ntiyirengagize server MIME/magic-byte, size, ownership na storage checks.

## Imiterere ya mobile n'ubuziranenge

- Mobile-first, baseline 360px; gerageza na 320px, tablet na desktop.
- Product listing: 3 columns munsi ya 480px, 4 kuva 480px, 5 kuva 768px, 6 kuva 1024px, 7 kuva 1280px.
- Product card: square seller photo, compact price/name/shop metadata, two-line name, target max height about 185px on mobile, no heavy shadow.
- Product detail: compact 4:3 gallery, small thumbnails, visible seller identity/status, variants and fixed WhatsApp/cart/buy actions.
- Touch targets nibura 44×44px; visible icons may be 18–22px.
- Contrast, keyboard focus, labels, reduced motion, no horizontal overflow and correct scroll restoration.
- Use the actual Inter font from the app source unless a reviewed design decision changes it.

## Mbere yo gusaba merge

- `bun install --frozen-lockfile`, TypeScript, unit tests, Vite build, Neon checks and Playwright E2E must pass as applicable.
- E2E tests must use isolated fixtures/QA. Never use Production accounts or insert fake listings into Production.
- UI tests check empty-catalogue states without manufacturing sellers/products; auth tests must cover signed-out and authorised users without leaking credentials.
- Test real Android Chrome for seller signup, session persistence, image upload, product publishing and WhatsApp journey before public launch.
- PR description must say what changed, what tests passed, what was not tested and whether Production was touched.
- A feature is not complete because a mockup or branch exists. Completion means merged code, green CI and the intended deployment verified.

## Production launch order

- Complete security and reliability blockers recorded in the Production Security Gate.
- Verify independent encrypted PostgreSQL + Object Storage backups and a successful restore drill before KYC collection.
- Verify owner-approved seller journey on Android Chrome.
- Release incrementally, beginning with a small group of real sellers, then broaden after monitoring errors and operational load.
- Do not report any gate as complete without read-back or test evidence.
