# AGENTS.md — Amategeko y'abakora kuri ISOKO (abantu na AI)

Soma mbere: [docs/audit/AUDIT.md](docs/audit/AUDIT.md) (ibibazo 25 n'urutonde rw'ibikorwa) na [docs/ISOKO_PRODUCTION_SECURITY_GATE.md](docs/ISOKO_PRODUCTION_SECURITY_GATE.md).

## Iki ni iki
Isoko: catalogue y'amaduka yo mu Rwanda ihuza abaguzi n'abacuruzi kuri WhatsApp. Vite + React 19 + Tailwind 4 + TypeScript; Neon (Postgres, Data API, Auth, Function `isokoapi`, Object Storage); Render static site. Ikinyarwanda ni rwo rurimi rw'ibanze rwa UI.

## Intego
Gutuma umucuruzi afungura iduka, akongeraho ibicuruzwa, abaguzi bakabona bakamwandikira kuri WhatsApp — **neza kandi mu mutekano**. Gukosora ibya mbere bibanza; ntugakore ibishya mbere y'ibyo.

## Urutonde rw'ibanze (ntuhindure)
1. A (#1–#3 mu AUDIT.md) → B (#4–#11) → C → D. Fata kimwe, ugikore neza, ugipime, ukomeze.
2. **Ntugasenye ibikora neza:** RLS, grants za migration 007, RPC-only writes, magic-byte checks, ikimenyetso cya «Verified», nta demo data, CI.

## Amategeko y'ubwubatsi
- Buri gikorwa kiri muri **PR ntoya imwe** (ikibazo kimwe = PR imwe) ku branch yitwa `fix/<nomero>-<ijambo>`; ntihagire ukora kuri `main` ataciye muri PR.
- PR igomba kuvuga: nomero ya audit (#), icyahinduwe, uko wapimye, icyo utapimye. Ntibyemewe kuvuga «bikora» utarapimye.
- **Amategeko yose y'ubucuruzi ajye muri SQL/RPC (server)**, si kuri client gusa. Client igenzura kugira ngo UX ibe nziza; server ni yo yizerwa.
- Migrations: dosiye nshya `infra/neon/migrations/NNN_*.sql` (ntuhindure izashyizweho); ibe idempotent; yandike uko isubizwa inyuma; ntugakoreshe `supabase/` (ni iya kera).
- Ntukoreshe `server.ts`, `src/server/`, `supabase/` — bigomba gusibwa (#20), ntibikoreshwe.
- Ntugashyire **ibanga** muri repo (keys, tokens, kode ya Admin). Env vars zijya Render/Neon. Niba ibanga ryigeze kujya muri git, rivuguruzwe.
- Ntugashyire demo/ibinyoma (amaduka, ibicuruzwa, ubuhamya, imibare). Ntugasezeranye ibyo urubuga rudakora (nta «ubwishyu bwizewe»).
- Amakosa mu Kinyarwanda yoroshye (nta jargon); ubutumwa bw'ikosa buhe umuntu icyo gukora.
- Telefoni nke n'internet nke: amafoto thumbnail kuri lisiti; ntukurure icyegeranyo cyose (#5); ntuzamure ingano ya bundle utabyemeje.
- Ikiguzi: Neon Free ifite 5 GB y'urujya n'uruza, 5 GB ububiko, 1 GB DB. Ntukongere ikintu cyiyongera nta gisenge (quota, cleanup).
- Amakuru y'abantu (email, telefoni) arinzwe; reba #19 (Law 058/2021). Ntukabike amakuru mashya y'umuntu utabanje kubaza.

## Mbere yo gusaba merge
- `bun install --frozen-lockfile && bunx tsc --noEmit && bun run build` bitambuka; unit na smoke tests bitambuke (reba `.github/workflows/isoko-checks.yml`).
- Ku bikorwa bya UI: gerageza kuri telefone nyayo (Chrome Android), si kuri desktop gusa.
- Ku bikorwa bya auth/upload/RPC: ikizamini cy'umuntu **utinjiye**, **winjiye nk'umuguzi**, **winjiye nk'umucuruzi**, kandi **winjiye nk'undi mucuruzi** (agomba kunanirwa).
- Vugurura `docs/audit/AUDIT.md` (tick) n'inyandiko zindi zihinduka.

## Ibyo ukwiye guhagarara ukabaza umuntu
Guhindura Production DB, gusiba amakuru, guhindura privileges/RLS, ibijyanye n'amafaranga cyangwa amategeko, guhindura domaine/DNS, gusiba imirimo ya kera ya benshi.

## Uko ushyira hanze (nyuma ya A na B)
Soft launch: abacuruzi 10–20 bazwi mu karere kamwe, ugakurikirana amakosa buri munsi, hanyuma ugatangaza kuri rubanda.
