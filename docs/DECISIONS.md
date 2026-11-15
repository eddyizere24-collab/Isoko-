# ISOKO — Ibyemezo bya Product & Design

Ibyo byemezo byemejwe na nyiri umushinga ku wa 16 Ugushyingo 2026. Biruta inyandiko zabanjirijeho igihe bivuguruzanya. Icyo iyi dosiye ivuga ni icyemezo; ntabwo ivuga ko UI yamaze kubishyira mu bikorwa.

## D-001 — Ibirango n'amabara y'ibanze

- Komeza izuba rya ISOKO ry'amabara menshi rifite hagati hafunguye.
- Ku bunini bwa 16–32px, koresha compact mark y'utubara 12 tunini, buri kamwe gafite ibara rimwe mu mabara yemewe: green, red, ochre, blue na violet.
- UI ikoreshe green `#0B6E4F`, red `#C0392B`, white/light grey `#F7F8FA` cyangwa white. Ochre/blue/violet bibarirwa mu izuba gusa.
- Nta forest/clay palette ya kera nk'amabara ayobora UI.

## D-002 — Imigongo igomba kumenyekana

- Header strip 10–12px, tile ya SVG 1:1, background-size ihuye n'ubugari n'uburebure bwa tile.
- Stroke ≥1.5px, green/red byombi 100% opacity, diamonds zifatanye, zigzag/spiral ikomeza nta cyuho kinini.
- Footer strip 14px.
- Auth header igaragaze umurongo w'imigongo; hero corner ibe 100–140px ku nkombe.

## D-003 — Ururimi rwa mbere

- Umushyitsi mushya atangirira kuri Kinyarwanda (`rw`) buri gihe.
- `navigator.language` ntikoreshwa mu guhitamo ururimi rwa mbere.
- Ururimi rwandikwa muri storage gusa iyo umuntu aruhisemo muri switcher. Ibyari byaratoranyijwe mbere kandi byabitswe n'umukoresha birubahirizwa.

## D-004 — Mobile baseline n'ibikorwa by'ingenzi

- 360×800 Android ni baseline; 412×915 ni ikizamini cya kabiri; DPR 2.
- Product detail: ifoto 4:3, size/colour chips, specifications, seller identity, **Ibindi mu iduka ryabo**, **Bisa n'ibi**, scroll restoration na fixed actions **Vugana | Igare | Gura**.
- Cart iguma itandukanya ibicuruzwa kuri buri mucuruzi; WhatsApp ni yo nzira yo kuvugana no kurangiza kugura.
- Sign-in, seller signup na admin bigume kuri white/light grey, green primary action na red secondary feedback.

## D-005 — Ubuziranenge n'ibimenyetso

- PR ntoya imwe ku kintu kimwe; nta direct commit kuri `main`.
- CI igomba kuba green mbere yo merge.
- Buri PR igomba kuba ifite screenshots za Playwright/Chromium ku 360×800 na 412×915, DPR 2, z'amapaji 8 yavuzwe muri Visual System, buri PNG ≤400 KB, hamwe na sun 16/24/32 na Imigongo 360px.
- Screenshots zigomba gufungurwa no kugenzurwa; ntihagire uvuga ko mobile UI yagenzuwe adafite amashusho.
- Ntihagire PR ihindura auth, database, Neon, RLS/RPC, infra cyangwa Production settings mu gihe ari polish ya UI.

## D-006 — Gahunda ya mbere

1. Shyira RULEBOOK na ALIBABA_STUDY kuri main.
2. Shyira mu bikorwa Imigongo.
3. Compact sun + favicon/PWA icons.
4. Palette na theme-color.
5. Language default + unit test.
6. Product detail/cart/login/admin.
7. Reba PR #27 ugereranye n'ibiri kuri main; uyifunge gusa iyo nta kintu cyihariye isigaje.
8. Playwright screenshots, visual review, CI, merge, hanyuma Production read-back.

## Imipaka y'ibyo twemeje

- Iyi log ntiyemeza ko Figma yamaze kuvugururwa cyangwa ko amashusho ya Playwright yamaze gufatwa.
- Nta Production SQL, Neon configuration cyangwa Render setting bigomba guhindurwa muri izi PR za visual polish.
