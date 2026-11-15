# ISOKO — Ibyemezo byemejwe

Iyi nyandiko ni yo ibika ibyemezo bya nyiri umushinga. Iyo hari ukutumvikana hagati y'iyi nyandiko, Visual System, Rulebook cyangwa ibindi byanditswe, icyemezo cya nyiri umushinga ni cyo kigenderwaho.

## 2026-11-16 — Mobile visual identity (360px Android)

**Icyemezo:** ISOKO igumana izuba ry'amabara menshi rifite hagati hafunguye. Rikoreshwa muri app, header, favicon, PWA na Apple touch icon. Rigomba gusomeka ku bunini bwa 16px, 24px na 32px. Version nto igabanya utubumbe ariko ntihindure ibara ry'utubumbe dusigaye cyangwa ngo yuzuze hagati.

**Amabara y'interface:** icyatsi gisobanutse `#0B6E4F` n'umutuku usobanutse `#C0392B` ni byo by'ibanze. Inyuma ni umweru cyangwa imvi yoroshye `#F7F8FA`. Charcoal ikoreshwa mu nyandiko. Ochre, ubururu na violet biguma mu kirango cy'izuba gusa. Nta mapaji manini asize icyatsi cyangwa umutuku.

**Imigongo:** umurongo wo munsi ya header ni 10–12px; footer ni 14px. Tile ni 1:1 kandi background-size igomba kubahiriza ratio ya SVG. Imirongo igaragara ifite nibura 1.5px, opacity 100%, mu cyatsi/umutuku. Diamonds zigomba gufatana kandi zigakora zigzag/spiral ikomeza, si utudomo cyangwa ibimenyetso bidafitanye isano. Login na seller registration bigaragaza pattern; home hero igira corner ya 100–140px ku nkombe.

**Language:** urubuga rutangira mu Kinyarwanda (`rw`) ku muntu mushya. Ururimi ruhinduka gusa iyo umukoresha aruhisemo muri switcher; iryo hitamo ribikwa. `navigator.language` ntikoreshwa nk'intangiriro kandi ururimi rwatanzwe na browser ntirubikwa nk'aho rwatoranyijwe n'umuntu.

**Scope y'iyi phase:** mobile 360×800 ni baseline, 412×915 ni ikizamini cya kabiri; device scale factor 2. Nta guhindura auth, database, infrastructure cyangwa business logic keretse bibaye ngombwa kandi bigakorerwa PR yihariye ifite tests. Screenshots zisabwa ni PNG zafashwe muri Playwright Chromium ku viewports zavuzwe, zipimwa kandi zirebwa mbere yo kwemeza ubwiza. Nta screenshot y'impimbano cyangwa browser fetch screenshot yitwa Playwright.

## Ibyemezo byo kurinda
- ISOKO ni marketplace y'u Rwanda; umuguzi avugana n'umucuruzi kuri WhatsApp.
- ISOKO ntirakira ubwishyu kandi ntisezeranya Trade Assurance cyangwa delivery.
- Amakuru, amaduka n'ibicuruzwa bigomba kuba iby'ukuri; nta demo data yinjizwa muri Production.
- PR ntoya ni yo ikoreshwa; CI igomba kuba icyatsi mbere ya merge.
- Ntihindurwe auth/database/security cyangwa Production settings muri PR z'ubwiza.
