# ISOKO — Design brief (amabwiriza y'imiterere n'ubwiza)

Itariki: 2026-11-14 · ishingiye kuri main@675f199. PDF: [ISOKO_Design_Brief_2026-11-14.pdf](./ISOKO_Design_Brief_2026-11-14.pdf).
Ni **design gusa**: ntihindurwa auth, database, umutekano (reba [AGENTS.md](../../AGENTS.md) na [AUDIT.md](../audit/AUDIT.md)).


## 1. Ukuri: kuki urubuga rusa n’icyitegererezo (fake)

**Icyitonderwa:** ntabwo nashoboye kureba urubuga live (robots irabyanga). Ibi nabikuye muri **kode ya GitHub (main, commit 675f199)** no muri screenshot zawe. Ibivuga ubunini ni ibiri muri kode.

| Ikibazo | Icyo kode yerekana | Ingaruka |
|---|---|---|
| Umutwe (header) ufata umwanya munini kuri telefoni | Umurongo wa mbere h-14 (56px) + umurongo wo gushakisha (44px) + akabuto k’aho uri (44px) + umurongo w’imitako. Kuri screenshot yawe uhera hejuru ugera ku ≈ 220px mu 853px y’ecran (≈ 26%). | Ibicuruzwa bitangira hasi cyane; bisa n’urubuga rw’abatangiye. |
| Ibintu byose binini kandi biremereye | Imitwe 2xl–4xl, `font-extrabold` n’`tracking-tight` hose, buto y’igare nini y’icyatsi yuzuye, amakarita afite igicucu. | Nta murongo (hierarchy): byose birasakuza kimwe. |
| Logo ifite amabara 9 | IsokoLogo.tsx: umuhondo, ubururu, violet, pink, orange, teal, icyatsi, umutuku. | Ntihuye n’icyatsi + umutuku wifuza; isa n’iy’abana. |
| Izina «Isoko» ni inyandiko isanzwe | Wordmark ni `text-xl font-extrabold` y’icyatsi, nta logo yashushanyijwe. | Nta kimenyetso cy’ikirango (brand). |
| Imitako ya Kinyarwanda iri nk’ibara ryoroheje cyane | index.css: imirongo ifite opacity 4–5%; hari akayoga k’uburebure 6px. | Iranyerera; ntigaragara nk’umwihariko w’u Rwanda. |
| Nta bicuruzwa nyabyo | Hari «zero demo data» (ni byiza), ariko urubuga rukinguye ruba rwubusa. | Design ntishobora gukemura iki; reba igice cya 12. |


## 2. Icyo twigira kuri Alibaba (si ukwigana)

Nasomye screenshot yawe ya Alibaba. Icyo yigisha ni **uburyo**, si ibigize:

- **Umurongo umwe** ufite logo + gushakisha; nta kintu kirenga. Ibindi biri hasi ya wo mu tuntu duto (tabs, chips).
- **Inyuguti nto kandi zisobanutse:** hafi 12–15px; umutwe w’igice ni 16–18px; igiciro ni cyo cyonyine kiremereye mu ikarita.
- **Inyuma y’urupapuro ni imvi yoroshye**, ibice ni amakarita yera: bituma ibicuruzwa bigaragara.
- **Ibara rimwe ry’ingenzi** (orange) rikoreshwa kuri buto z’ingenzi gusa; ibindi ni umukara/imvi.
- **Navigation yo hasi** (Home, Categories, Messenger, Cart, My Alibaba) aho gukoresha menu nini hejuru.
- **Ibice bifite umutwe + akambi «reba byose»**, amafoto menshi, ibiciro bifite igisobanuro gito (Min. order…).

**Ntuzigane:** logo ya Alibaba, orange yayo, amafoto yayo, inyandiko zayo cyangwa imiterere yayo uko iri (iby’ubuyobozi bw’ikirango). Isoko igomba kugira umwihariko wayo: icyatsi + umutuku + imigongo ya Kinyarwanda.


## 3. Amabara (tokens)

| Izina | Agaciro | Aho bikoreshwa |
|---|---|---|
| primary (icyatsi) | #0B6E4F (komeza); dark #064E3B; 50: #E8F3EE | Buto z’ingenzi, ibiciro, links, ikimenyetso cya «Verified», logo. |
| red (umutuku) | #C0392B; dark #8E2A20; 50: #FBEAE8 | Igice cya logo, kugabanya ibiciro (-%), badge y’igare, imigongo, amakosa. Ntiyuzuza ahantu hanini; ≤ 10% y’ecran. |
| ink / text | #1B1F23; text-2 #4B5563; muted #6B7280 | Inyandiko (muted ntijye munsi ya 4.5:1 ku mweru). |
| page bg / card / border | #F4F6F5 / #FFFFFF / #E3E8E5 | Inyuma y’urupapuro imvi yoroshye; amakarita yera, umurongo wa 1px. |
| whatsapp | bg #1A7F43 + inyandiko yera (genzura ≥ 4.5:1) | Buto ya WhatsApp gusa. Ntukoreshe #25D366 hamwe n’inyandiko yera (ntisomeka). |
| Ibyahagaritswe | #E8A33D (umuhondo), violet, pink, orange, ubururu | Bikurwe mu logo no muri UI. Hasigare icyatsi, umutuku, imvi. |


## 4. Inyuguti (typography)

Koresha **umuryango w’inyuguti umwe** (Inter, cyangwa komeza Plus Jakarta Sans gusa), uburemere 400/500/600/700 gusa, ushyirwe kuri server yawe (self-host, subset ya Latin) kugira ngo telefoni nke zihute. **Nta `font-extrabold` (800), nta `tracking-tight` ku nyandiko za buri munsi, nta nyuguti nkuru zose (uppercase) uretse ibimenyetso bito.**

| Ikoreshwa | Mobile (px / line) | Desktop | Uburemere |
|---|---|---|---|
| Hero (umutwe w’ingenzi) | 22 / 28 | 34 / 42 | 700 |
| Umutwe w’igice (H2) | 16 / 22 | 20 / 28 | 600 |
| Umutwe w’ikarita (H3) | 14 / 19 (imirongo 2) | 14 / 19 | 500 |
| Inyandiko isanzwe | 14 / 21 | 15 / 22 | 400 |
| Igiciro | 16 / 20 (tabular) | 17 / 22 | 700 |
| Inyandiko ntoya (meta) | 12 / 16 | 12 / 16 | 400 |
| Ikimenyetso gito (badge) | 11 / 14 | 11 / 14 | 600 |
| Buto | 14 / 20 | 14 / 20 | 600 |

**Itegeko:** kuri mobile nta nyandiko irenga 24px mu rubuga rwose (uretse imibare ya dashboard). Ubunini bunini bukoreshwa gusa ku kintu kimwe mu rupapuro.


## 5. Ingano n’imiterere

- Gride ya 4px. Ibice: 4, 8, 12, 16, 24, 32. Ahari mobile: gutter 12px; hagati y’amakarita 8px; hagati y’ibice 20px. Desktop: 24 / 16 / 32.
- Radius: amakarita 8px, inputs na buto 8px, chips 999px, badges 4px. Nta gicucu muri rusange (shadow gusa kuri hover ya desktop, yoroshye).
- Uburebure: buto/input 40px (buto y’ingenzi kuri page y’ikicuruzwa 44–48px); chips 32px; icon 20px (24px mu navigation yo hasi). **Aho gukandira hagomba kuba ≥ 44×44px** (koresha padding, si ukwongera ubunini bw’ikigaragara).
- Amashusho (icons): lucide, 1.5 stroke, ibara ry’icyatsi cyangwa imvi; ntuvange n’izindi seti.


## 6. Logo n’izina (rigomba gushushanywa nk’ikirango)

Ubu logo ni amabara menshi n’inyandiko isanzwe. Intego: **ikirango gifite imiterere imwe, amabara abiri (icyatsi + umutuku)**, gisomeka ku 24px.

- **Ikimenyetso (mark):** igishushanyo kimwe cyoroshye gishingiye ku mugongo w’imigongo (diamond/spiral) cyangwa igisenge cy’isoko; icyatsi nk’ibara ry’ingenzi, umutuku nk’akadomo/akantu kamwe. Nta beads 36 zivanze amabara.
- **Wordmark «Isoko»:** inyuguti zashushanyijwe (convert to outlines/SVG path), si `text`, ngo zidahinduka bitewe na font. Inyuguti ya «i» ifite akadomo k’umutuku; «o» ya kabiri ishobora gufata isura y’umugongo. Uburemere bwa 700, urugero rwo hasi 20px.
- **Ibice bitatu bitangwa:** (1) mark + wordmark, itambitse, ya header; (2) mark yonyine kuri favicon, PWA icons (192/512/maskable), apple-touch-icon; (3) verisiyo y’umweru ku cyatsi (footer, hero).
- Ahari: header 24px yo hejuru ya mark; desktop 28px. Umwanya w’ubusa uzengurutse = ubunini bw’inyuguti «i».
- Dosiye: `src/components/IsokoLogo.tsx` (SVG), `public/icon.svg`, PWA PNGs. Ntugahindure izina rya component/exports.


## 7. Imigongo ya Kinyarwanda (imirongo y’umutako)

Imigongo ni ubugeni nyabwo bw’u Rwanda (imiterere ya geometric, spiral na zigzag). Ubu ikoreshwa nk’ibara ryoroheje cyane (opacity 4–5%) bityo ntigaragara. Ikoreshwe **neza kandi buke**:

- **Umurongo wo munsi ya header:** 4px z’uburebure, icyatsi + umutuku bigaragara neza (opacity 100%), uburyo bwa diamond/zigzag buri gusubiramo (SVG pattern, `background-repeat: repeat-x`). Uyu ni wo «mukono» w’ikirango ugaragara ku rupapuro rwose. Ukoresha kandi hejuru ya footer.
- **Hero:** imigongo ku rubibi/inguni (urugero 120×120px) mu ibara ry’icyatsi 12–16% na umutuku 8–10%; inyandiko iguma ku mweru, isomeka (contrast ≥ 4.5:1).
- **Aho bitagomba kuba:** inyuma y’amakarita y’ibicuruzwa, inyuma y’ifishi n’inyandiko ndende, no ku mafoto y’ibicuruzwa.
- Pattern ibe SVG imwe isubirwamo (< 2 KB), itari ishusho ya PNG, kugira ngo ikomeze kuba nziza ku mpande zose z’ecran.


## 8. Header na navigation: Ubu → Intego

_(Reba igishushanyo cy'imiterere muri PDF: ubu vs intego.)_

| Ikintu | Ubu | Intego |
|---|---|---|
| Umurongo wa 1 (≈ 52px, sticky) | Menu + logo + buto nini y’igare | Logo (mark 24px + wordmark) + umurongo wo gushakisha (40px, flex-1, buto y’icyatsi ya lupe imbere) + akabuto k’aho uri (icon gusa, 40px) |
| Aho uri (Kigali/Hitamo) | Akabuto k’umurongo wose (44px) ku mobile | Chip ya mbere mu murongo w’ibyiciro: «Kigali ▾»; ifunguye LocationSheet isanzwe |
| Umurongo wa 2 (40px, ntujye sticky) | Nta wo | Ibyiciro bitambikiye (chips 32px, scroll itambitse): Byose, Imyambaro, … (bivuye muri categories zisanzwe) |
| Igare | Buto nini y’icyatsi hejuru | Muri navigation yo hasi, icon + badge y’umutuku; kuri desktop icon + umubare muri header |
| Menu y’inyongera | Hamburger hejuru | Muri «Konti/Ibindi» yo hasi (Injira, Fungura iduka, Ubufasha, Amategeko) |
| Navigation yo hasi (mobile) | Nta yo | 5: Ahabanza, Ibyiciro, Shakisha, Igare, Konti. 56px, icon 24 + label 11px. Ihisha ku page y’ikicuruzwa (hari bar ya WhatsApp) |
| Umutwe uhora hejuru (sticky) | ≈ 170px+ (header, gushakisha n’ahandi) | ≈ 56px (umurongo wa 1 + umugongo 4px); chips zivaho iyo ukanze hasi |
| Desktop (≥ 1024px) | Umurongo umwe + gushakisha + aho uri | Umurongo muto 32px (Fungura iduka · Ubufasha · Injira) + umurongo w’ingenzi 64px (logo, gushakisha ndende ≤ 640px, igare) + umurongo w’ibyiciro 44px |


## 9. Ahabanza (Home): uko ibice bikurikirana

- **1. Hero:** 150–180px kuri mobile. Umutwe umwe (22/28), umurongo umwe wa 14px, buto imwe y’ingenzi «Reba ibicuruzwa» n’ihuza rito «Fungura iduka ryawe». Koresha amagambo asanzwe ariho (ntukore inyandiko nshya zo kwamamaza zidahari). Imigongo ku nguni.
- **2. Ibyiciro:** gride y’amashusho 5 ku murongo, imirongo 2 (scroll itambitse): umuzingo 48px w’icyatsi cyoroshye (#E8F3EE) + icon y’icyatsi + izina 12px.
- **3. Akarongo k’icyizere (3 ibintu):** «Vugana n’umucuruzi kuri WhatsApp», «Amaduka yemejwe afite ikimenyetso», «Tanga raporo ku kibazo». Gusa ibyo ari ukuri uyu munsi.
- **4. Ibishya:** gride y’ibicuruzwa 2 ku murongo (mobile), 4 (tablet), 5–6 (desktop). Umutwe w’igice 16px + «Reba byose →».
- **5. Amaduka:** scroll itambitse y’amakarita ya 140×170px (avatar 48, izina, akarere, ikimenyetso cya Verified niba gihari).
- **6. Hafi yawe:** bigaragara gusa iyo umuntu yahisemo aho ari.
- **7. Umurongo w’abacuruzi:** «Fungura iduka ryawe» (amagambo asanzwe), buto imwe.
- **8. Footer:** imigongo hejuru; ku mobile ibice bifungurwa (accordion); desktop inkingi 4.


## 10. Ikarita y’igicuruzwa n’izindi paji

- **Ikarita:** ifoto 1:1 (object-cover) hejuru; padding 8px; umutwe 14px imirongo 2 (500); **igiciro 16px 700 cy’icyatsi** + igiciro cya kera 12px cyakaswe; ikimenyetso cya -% gitukura gito (11px, radius 4) ku ifoto hejuru-ibumoso; hasi 11–12px: izina ry’iduka + ✓ Verified (niba bibaho) + akarere. Nta gicucu, umurongo wa 1px, radius 8px, tap yose ni ikarita.
- **Gride:** mobile 2 inkingi (gap 8); ≥ 640px 3; ≥ 900px 4; ≥ 1200px 5. Amafoto akoresha thumbnail (`loading=lazy`, `decoding=async`, width/height byashyizweho ngo page itazunguruka).
- **Page y’ikicuruzwa:** ifoto y’uruhande-ku-ruhande (swipe) uko ecran ingana, «1/5» ku ifoto; igiciro 22px 700 cy’icyatsi; umutwe 16/22 600; akarongo k’iduka (avatar, izina, ✓ Verified, akarere, «Reba iduka»); ibisobanuro mu mbonerahamwe (ingano, ibara, ikirango); **bar yo hasi ihora ihari (56px)**: buto ya WhatsApp (flex-1, 44px) + «Ongeraho mu igare» (outline). «Tanga raporo» ihuza rito hasi. Desktop: inkingi 2.
- **Page y’iduka:** banner 120px (imigongo cyangwa ifoto), avatar 64 isumbye ku banner, izina 20/26 700, ikimenyetso cya Verified/Unverified nk’uko bimeze uyu munsi (ntihinduke ukuri), buto ya WhatsApp, tabs: Ibicuruzwa / Ibyerekeye; gride y’ibicuruzwa.
- **Igare:** amakarita y’amaduka (ibicuruzwa byakusanyirijwe ku muzucuruzi) nk’uko bimeze; igiciro gishyirwa iburyo; buto imwe nini ya WhatsApp ku iduka.


## 11. Kwiyandikisha no kwinjira (professional)

Imiterere gusa; **ntihindurwe logic y’auth** (SellerAuthGate, neon.ts, MarketplaceContext, api.ts).

- Ifishi mu ikarita yera (radius 8, umurongo wa 1px, nta gicucu), ubugari ≤ 420px, hagati. Umutwe 22/28 700; sub 14/21 imvi.
- Labels 13px 500 hejuru y’input; input 40px, umurongo wa 1px #CBD5D1, focus: umurongo w’icyatsi 2px; placeholder imvi (≥ 4.5:1 si ngombwa, ariko ntiisimbure label).
- Ijambo ry’ibanga rifite «Erekana/Hisha»; `autocomplete` ikwiye (`email`, `current-password`, `new-password`, `tel`); `inputmode` ikwiye; telefoni ifite +250 nk’agaciro k’imbere.
- Ubutumwa: **ku rwego rw’umwanya** (inline) hasi y’input, umutuku 12px, mu Kinyarwanda gisobanutse; ubutumwa rusange bwa alert 13px bufite agace k’ibara ku ruhande (umuhondo wo kumenyesha igihe cyarangiye, umutuku w’ikosa, icyatsi cy’intsinzi).
- Buto imwe y’ingenzi (44px, ubugari bwuzuye), ihuza rito hasi («Wibagiwe ijambo ry’ibanga?», «Nta konti? Iyandikishe»). Mu gihe cyo gutegereza: buto yerekana «Tegereza…», idakandwa kabiri.
- Gufungura iduka: ibyiciro bigaragara hejuru (1 Konti → 2 Iduka → 3 Igicuruzwa cya mbere) niba ibyo biriho muri flow isanzwe; nta kindi gisabwa.
- Ibyo ntihindurwe: gusaba gutinda kwa sesiyo, redirect kuri /injira, ubutumwa buboneye bwa «Igihe winjiraga cyarangiye» (bwakozwe neza).


## 12. Ibyo design idashobora gukemura (ukuri)

- Alibaba isa nk’iy’ukuri kuko ifite **ibicuruzwa n’amafoto nyabyo ibihumbi**. Isoko idafite ibicuruzwa isa n’urubuga rwubusa uko rwaba rwiza kose.
- **Gahunda:** tangira n’abacuruzi 10–20 nyabo mu karere kamwe, bafite amafoto meza (umucyo mwiza, inyuma isukuye, ifoto ya mbere ibumbatiye igicuruzwa). Nta cyo gukina n’amafoto yo kuri internet cyangwa ibinyoma.
- **Amatangazo y’ubusa (empty states):** ntuyahishe n’amakarita y’ibinyoma. Garagaza ukuri n’intambwe: «Nta bicuruzwa biraboneka muri iki cyiciro. Ba uwa mbere ufungura iduka ryawe.» + buto.
- Ntuzimye ikimenyetso cya «Verified/Unverified»: ni cyo gituma urubuga rwizerwa.


## 13. Amategeko ku bakora (AI Studio n’abandi)

- **Soma mbere yo kubaka:** AGENTS.md, docs/audit/AUDIT.md, docs/design/DESIGN_BRIEF.md, src/index.css, src/components/Header.tsx, HomePage.tsx, ProductCard.tsx, IsokoLogo.tsx. Fata main nshya (git pull) mbere ya buri PR; ChatGPT ni we ukora ku mutekano na database.
- **Ni design gusa:** hindura className, imiterere ya markup, src/index.css, amashusho (logo/icons), fonts. **Ntukore ku:** src/lib/*, src/context/*, src/components/SellerAuthGate.tsx, infra/*, .github/*, imigrati ya SQL, validation, n’inyandiko za i18n (usibye guhindura ubunini bw’amagambo iyo ngombwa).
- Ntukureho ibiriho bikora: ishakisha, itumanaho rya WhatsApp, report, igare, guhitamo aho uri, PWA, offline bar.
- **PR ntoya:** PR1 tokens + fonts + logo + imigongo; PR2 header + navigation yo hasi + footer; PR3 Home + ikarita y’igicuruzwa + gride; PR4 page y’ikicuruzwa n’iy’iduka; PR5 login/signup/forgot/reset + seller pages; PR6 isuku n’ibizamini byo kureba. Buri PR ikorerwa ku branch yitwa design/<nomero>-<izina>.
- **Mbere yo guhuza:** `bun install --frozen-lockfile && bunx tsc --noEmit && bun run build` bitambuke, unit/smoke/e2e bitambuke. Shyira muri PR amafoto y’ecran kuri 360, 412, 768 na 1280px (Playwright), mbere/nyuma.
- Buri PR irangiye kandi CI ari icyatsi: yihuze (squash) kuri main, ugenzure ko Render yubatse kandi urubuga rutangiritse; niba rwangiritse, subiza inyuma (revert).
- Ntukore design y’ibinyoma, ntukoreshe amafoto ya Alibaba cyangwa aya ibindi bicuruzwa byafashwe ku mbuga, ntushyire demo data.


## 14. Urutonde rwo kwemeza (rupimwa)

| Ikizamini | Igipimo |
|---|---|
| Uburebure bw’umutwe uhora hejuru kuri 360×640 | ≤ 60px (umurongo wa 1 + imigongo); wongeyeho chips ≤ 100px iyo page iri hejuru |
| Inyandiko nini kuri mobile | Nta nyandiko > 24px (uretse imibare ya dashboard) |
| Font | Umuryango 1; uburemere 400/500/600/700; nta 800; font-display: swap; ≤ 3 dosiye za font |
| Amabara | Muri UI no muri logo hakoreshwa gusa icyatsi, umutuku, imvi/ink, n’icyatsi cya WhatsApp kuri buto yayo |
| Contrast | Inyandiko isanzwe ≥ 4.5:1; inyandiko nini ≥ 3:1 (reba mu ecran ya Lighthouse) |
| Gukandira | Buri kintu gikandwa ≥ 44×44px |
| Ibicuruzwa bigaragara | Ku 360×640 hagaragara nibura umurongo umwe w’ibicuruzwa utarasiga hasi ya mbere (kuri Home isanzwe) |
| Imbaraga | Lighthouse mobile: Performance ≥ 80, Accessibility ≥ 95; CLS < 0.1; JS bundle idasumba iy’ubu ku kigero kirenga 10% |
| Ibikorwa | Kwinjira, kwiyandikisha, kongeraho igicuruzwa, kugura kuri WhatsApp, report, igare — byose bigikora nk’uko byari (e2e) |
| Logo | Isomeka ku 24px, ifite amabara 2, ikora ku mweru no ku cyatsi (verisiyo y’umweru) |

**Icyitonderwa kuri iyi gahunda:** imibare nka 56px, 22/28, n’indi mibare ni **icyerekezo cyatanzwe** gishingiye ku mahame ya UI zikoreshwa mpuzamahanga, si amahame ahamye; AI Studio ishobora kuyihindura gato niba bigaragara ko bidakora, ariko igomba kubivuga mu PR.
