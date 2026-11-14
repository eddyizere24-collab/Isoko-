# ISOKO — Audit (14 Ugushyingo 2026)

Ishingiye kuri commit `f13db971`. PDF yuzuye: [ISOKO_Audit_2026-11-14.pdf](./ISOKO_Audit_2026-11-14.pdf).
Amategeko y'uko bikorwa: [../../AGENTS.md](../../AGENTS.md).

**Icyemezo:** urubuga ntiruriteguye gufungurirwa rubanda; umusingi mwiza, ibibazo birakosorwa. Ibi byavuye mu gusoma kode gusa — urubuga live ntirwageragejwe (robots), nta signup nyayo yakozwe, database ya Production ntiyasomwe. Ibigomba kugenzurwa byanditse « (genzura) ».

## Ibyo kurinda (bimaze gukorwa neza — ntugasenye)
- RLS + least-privilege grants; abacuruzi bandika gusa muri RPC (migration 007).
- «Verified» igaragara gusa iyo `identity_status='verified'`.
- Nta demo data. Kwiyandikisha byoroshye (nta KYC).
- Gusuzuma amafoto (magic bytes, 500 KB), igare rigabanywa ku mucuruzi, ishakisha ry'Ikinyarwanda.
- CI (tsc, unit, smoke) n'inyandiko z'ubunyangamugayo (Security Gate).

## Gahunda — ikurikirana (tick uko bikorwa)

### A. Gikomeye cyane — mbere y'umucuruzi wa mbere
- [ ] **#1 Kwinjira kw'ikinyoma.** `getNeonJwt()` (src/lib/neon.ts) itera «Ongera winjire muri konti yawe» kuko `SellerAddProductPage` yizera `authSession` yo muri localStorage; `MarketplaceContext` ntigenzura token nyayo iyo ikimenyetso `managed-neon-auth` gihari. **Gukosora:** mbere yo kwerekana ifishi, genzura `neon.auth.token()`; niba ibuze → siba ikimenyetso → /injira. Shakisha niba ari cookies za domaine zitandukanye (onrender.com vs neon.tech) kuri telefone.
- [ ] **#2 Ikizamini cyuzuye (E2E).** signup → igicuruzwa+amafoto 3 → kigaragare → WhatsApp, kuri telefone 3. Ongeraho Playwright muri CI.
- [ ] **#3 Backup yigenga.** `pg_dump` ya buri munsi ibitse hanze ya Neon + kopi y'amafoto; gerageza restore rimwe.

### B. Gikomeye — mbere yo gutangaza kuri rubanda
- [ ] **#4** Amafoto: Neon Free ifite 5 GB/ukwezi y'urujya n'uruza → CDN (Cloudflare) cyangwa plan yishyurwa; alert.
- [ ] **#5** `fetchBootstrap()` ikurura byose → paginasiyo + ishakisha kuri server (view `v_public_bootstrap` igenzurwe).
- [ ] **#6** `track_marketplace_event_v1` / `track_campaign_v1` birabeshyeka (session_id ya client) → bara kuri server; ntukoreshe `popularity_7d` mu ranking kugeza ikingiwe.
- [ ] **#7** `event_dedup`, `report_rate`, subscribers bikura nta cleanup → cron yo gusiba + rate limit ya IP.
- [ ] **#8** `turnstileOk` ntiyoherezwa muri RPC → Turnstile nyayo ugenzurwa na server, cyangwa ukureho.
- [ ] **#9** Amategeko (izina 5–60, nta telefoni/link, amafoto ya nyirayo) ari kuri client gusa → subiramo muri SQL; emera gusa `products/<profile-id>/…`; `publicAssetUrl` ntiyemere URL zo hanze.
- [ ] **#10** Buto ya Google ntiragenwa (Security Gate ibivuga) → shyiraho credentials cyangwa ukureho buto.
- [ ] **#11** Admin yiyandikisha na `nimero@login.isoko.invalid` (nta recovery, nta 2FA) → email nyayo + 2FA; rate limit kuri `claim_first_admin_v1`.

### C. Hagati — icyumweru cya mbere
- [ ] **#12** «Provisional session» + `allowAnonymous:true` byitiranya UI.
- [ ] **#13** Nimero ya telefoni itemejwe → OTP (WhatsApp/SMS).
- [ ] **#14** SMTP yawe; kwemeza email.
- [ ] **#15** Amafoto y'imfubyi (nta delete endpoint); igisenge cy'ibicuruzwa 50–100 mu kwezi kwa 1.
- [ ] **#16** Quota ku munsi ku mafoto kuri function ya upload.
- [ ] **#17** `social_links`/about bigenzurwe muri SQL; `rel=noopener` kuri links.
- [ ] **#18** Neon Free isinzira nyuma y'iminota 5 → skeleton/retry cyangwa plan yishyurwa.
- [ ] **#19** Law 058/2021 (NCSA, ububiko mu Rwanda, amasaha 48) → baza umunyamategeko; politiki y'ibanga. *Si inama z'amategeko.*

### D. Gito / isuku
- [ ] **#20** Siba `server.ts`, `src/server/`, `supabase/`, `.env.example` (GEMINI), `@google/genai`, `express`; `npm start` ntigakoreshe server ya kera.
- [ ] **#21** Vugurura docs (HOSTING_DECISION, CHANGELOG) kugira ngo bihuze na Render+Neon.
- [ ] **#22** Migrations: umuyoboro umwe, drift check, rollback.
- [ ] **#23** Beta ya `@neondatabase/neon-js 0.9.0-beta`: bika version; ihindure izina `react-example`.
- [ ] **#24** Tekereza kugira repo private.
- [ ] **#25** Domaine yawe (isoko.rw) + Auth/API kuri subdomaine imwe.

## Ibyo ntabashije kugenzura (genzura)
Urubuga live; Google OAuth; niba Admin yarashyizweho; ingano ya `v_public_bootstrap`; pages: HomePage, SellerApplyPage, ShopPage, SellerProductsPage, AdminPage; migrations 006, 008, 009, 011, 012, 014, 015; igenamiterere rya Neon Auth/Render.

## Ukuri ku bijyanye no kugereranya
ISOKO ubu ni **catalogue y'amaduka ihuza abaguzi na WhatsApp**, si marketplace nka Jumia/Amazon (nta checkout, ubwishyu, ubuhamya, delivery). Ntibikwiye kwitwa «ubwishyu bwizewe» cyangwa «amaduka yose yemejwe». Jumia isaba KYC (indangamuntu, TIN, bank) n'iminsi 2–3 yo kugenzura; Iduka Online, RwandaMart, Lulu.rw, Yubeyi zerekana ko **ikizere** ari cyo kibazo gikomeye. «Mazu»: nta soko ryizewe ryabonetse. Amakuru ya Amazon ni ubumenyi rusange.
Inkomoko: vendorhub.jumia.sn; vendorhub.jumia.ug/kyc-documents-mandatory; allafrica.com/stories/202507220286.html; Disrupt Africa (Iduka Online, Yubeyi); GIZ (RwandaMart); DLA Piper, PKF Rwanda, PwC Rwanda (Law 058/2021).
