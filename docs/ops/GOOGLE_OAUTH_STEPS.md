# Gushyiraho Google OAuth kuri ISOKO (kuri Android)

Google sign-in iracyahishe inyuma ya feature flag. Ntuyifungure kugeza Google credentials zibitswe muri Neon Auth kandi login igeragejwe kuri QA account.

## 1. Kora Google Cloud project
1. Fungura Chrome kuri telefoni ya Android ujye kuri https://console.cloud.google.com/.
2. Injira muri konti ya Google izacunga ISOKO.
3. Kanda ku izina rya project hejuru, uhitemo **New Project**.
4. Andika izina `ISOKO Marketplace`, ukande **Create**.
5. Hitamo project nshya umaze kuyikora.

## 2. Tegura OAuth consent screen
1. Fungura **Google Auth Platform** cyangwa **APIs & Services → OAuth consent screen** (amazina ashobora gutandukana bitewe na Google Console).
2. Hitamo **External** niba abaguzi n'abacuruzi bo hanze y'umuryango wa Google Workspace bazayikoresha.
3. Andika App name: `ISOKO`.
4. Shyiramo email yo gushyigikira App n'email ya Developer contact ukoresha.
5. Emeza Privacy Policy URL na Terms URL bya ISOKO:
   - `https://isoko-marketplace-9i69.onrender.com/ibanga`
   - `https://isoko-marketplace-9i69.onrender.com/amategeko`
6. Mu gihe Google app ikiri muri Testing, ongeramo email yawe mu **Test users**.
7. Bika. Ntugasabe scopes zirenze iz'ibanze za profile na email.

## 3. Kora Web OAuth Client
1. Jya kuri **Google Auth Platform → Clients** cyangwa **APIs & Services → Credentials**.
2. Hitamo **Create Client → Web application**.
3. Izina: `ISOKO Production Web`.
4. Muri **Authorised JavaScript origins**, shyiramo neza:
   `https://isoko-marketplace-9i69.onrender.com`
5. Muri **Authorised redirect URIs**, shyiramo callback ya Neon Auth Production:
   `https://ep-damp-poetry-ba0bdwcn.neonauth.c-8.eu-central-1.aws.neon.tech/isoko/auth/callback/google`
6. Mbere yo kubika, fungura Neon Console → project `isoko-marketplace` → branch `isoko-production` → **Auth → Social providers → Google**, ugenzure ko Neon yerekana callback URI imwe n'iyi. Iyo Console yerekanye indi URL, koresha iyo Neon yerekanye, ntukoreshe URL itandukanye.
7. Kanda **Create**. Google izaguha Client ID na Client Secret. Ntuzishyire muri GitHub, chat, screenshot cyangwa Render environment.

## 4. Bika credentials muri Neon Auth
1. Fungura Neon Console kuri telefoni: https://console.neon.tech/.
2. Hitamo project `isoko-marketplace`, branch `isoko-production`.
3. Jya kuri **Auth → Social providers → Google**.
4. Shyiramo Client ID na Client Secret mu mirima ya Google, ubike.
5. Ntufungure feature flag ubu. OAuth credentials zitarageragezwa ntizihagije ngo tuvuge ko login ikora.

## 5. Gerageza kuri QA mbere ya Production
1. Hitamo branch ya QA/Setup, si Production.
2. Kora Google OAuth Web Client ya QA cyangwa wongere QA redirect URI nk'uko Neon Auth ibigaragaza.
3. Shyira credentials muri Neon Auth ya QA gusa.
4. Gerageza konti nshya n'iyari isanzweho; urebe ko session isubira neza, email y'umukoresha iboneka, kandi seller atabasha gukora shop atanyujije ku masezerano.
5. Emeza ko callback ijyana ku rubuga rwa QA, atari Production.

## 6. Igihe feature flag izafungurirwa
Feature flag ikoreshwa na frontend ni:
`VITE_ISOKO_GOOGLE_SIGNIN_ENABLED=true`

Kuri ubu ntiri muri `render.production.yaml`, bityo Google buttons ziguma zihishe. Nyuma ya QA yatsinze, Production flag izashyirwaho gusa nyuma yo kwandika impinduka muri `docs/ops/PRODUCTION_STEPS.md` no kubona uburenganzira bw'umuyobozi w'umushinga.

## Ibyo bitarashyirwaho
- Google Client ID na Client Secret ntibiraboneka muri Neon Auth.
- Google One Tap / account chooser ntiyashyizwemo. Ubu buryo bukoresha Better Auth social redirect button isanzwe; One Tap ntiyongerwaho tutabanje kwemeza ko Neon Auth 0.9.0-beta iyishyigikira.
- Seller Google onboarding isaba izina ry'iduka, WhatsApp n'amasezerano gusa igomba kugeragezwa kuri QA mbere yo gufungura flag.
