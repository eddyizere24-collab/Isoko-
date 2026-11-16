# Gushyiraho Google OAuth kuri ISOKO (kuri Android)

Google sign-in iracyahishe inyuma ya feature flag. Ntuyifungure kugeza Google credentials zibitswe muri Neon Auth kandi login igeragejwe neza kuri QA frontend ikoresha QA Neon Auth.

## 1. Ibyo ufite mbere yo gutangira

- Telefoni ya Android ifite Chrome.
- Konti ya Google izacunga ISOKO.
- Email ukoresha nka Developer contact na Support contact.
- Ntushyire Client Secret muri GitHub, WhatsApp, screenshot, chat cyangwa Render environment.
- Google sign-in flag igume `false` kugeza QA OAuth login yatsinze.

## 2. Kora Google Cloud project

1. Fungura Chrome ujye kuri https://console.cloud.google.com/.
2. Injira muri Google account yawe.
3. Kanda project selector iri hejuru.
4. Kanda **New Project**.
5. Andika izina `ISOKO Marketplace`, ukande **Create**.
6. Hitamo project umaze gukora.

## 3. Tegura OAuth consent screen

1. Fungura **Google Auth Platform → Branding** (cyangwa **APIs & Services → OAuth consent screen**).
2. Hitamo **External** kuko abaguzi n'abacuruzi bashobora gukoresha Google account zitari muri Workspace yawe.
3. App name: `ISOKO`.
4. Shyiramo email yo gushyigikira App na Developer contact email.
5. Privacy Policy URL: `https://isoko-marketplace-9i69.onrender.com/ibanga`.
6. Terms URL: `https://isoko-marketplace-9i69.onrender.com/amategeko`.
7. Mu gihe app ikiri muri Testing, shyiramo email yawe muri **Test users**.
8. Koresha scopes z'ibanze gusa: `openid`, `email`, `profile`. Bika.

## 4. Kora Web OAuth Client

1. Jya kuri **Google Auth Platform → Clients** (cyangwa **APIs & Services → Credentials**).
2. Kanda **Create Client**.
3. Application type: **Web application**.
4. Izina: `ISOKO Production Web`.
5. Muri **Authorised JavaScript origins**, shyiramo:

   `https://isoko-marketplace-9i69.onrender.com`

6. Muri **Authorised redirect URIs**, shyiramo Production callback URI ikurikira:

   `https://ep-damp-poetry-ba0bdwcn.neonauth.c-8.eu-central-1.aws.neon.tech/isoko/auth/callback/google`

7. Kanda **Create**. Google izerekana **Client ID** na **Client Secret**. Uzibike mu buryo bwizewe; ntuzohereze screenshot irimo Secret.

## 5. Shyira Client ID na Client Secret muri Neon Auth

1. Fungura https://console.neon.tech/ kuri telefoni.
2. Hitamo project **isoko-marketplace**.
3. Hitamo branch **isoko-production**.
4. Mu ruhande rw'ibumoso, fungura **Auth**.
5. Hitamo **Social providers**.
6. Hitamo **Google**.
7. Muri **Client ID**, shyiramo agaciro Google yatanze ka Client ID.
8. Muri **Client Secret**, shyiramo agaciro ka Client Secret.
9. Fungura Google provider toggle niba Neon isaba kuyifungura, hanyuma ukande **Save**.
10. Ntufungure frontend feature flag, kandi ntutangaze ko Google sign-in ikora. Credentials ziriho gusa ntizerekana ko callback na session bikora.

## 6. QA callback n'impamvu tutarayigerageza kuri Production site

Neon Auth ikoresha URL itandukanye kuri buri branch. QA branch ya ISOKO ni `isoko-full-flow-qa-20261114` (`br-cold-forest-badn9wlr`). Base URL yayo ni:

`https://ep-jolly-poetry-ba3o1jwc.neonauth.c-8.eu-central-1.aws.neon.tech/isoko/auth`

QA Google callback URI ni:

`https://ep-jolly-poetry-ba3o1jwc.neonauth.c-8.eu-central-1.aws.neon.tech/isoko/auth/callback/google`

**Ntukoreshe Production website nk'aho ari QA:** frontend ya Production ihuzwa na Production Neon Auth. QA callback ntizakoreshwa neza keretse hari QA frontend URL yihariye, yashyizwe muri QA Neon Auth trusted origins kandi yubatswe ikoresheje QA Auth/Data API/Function endpoints. Iyi QA frontend origin ntiyemejwe ko iri live ubu, bityo Google login round trip ntirakorwa.

Igihe QA frontend izaba yemejwe:
1. Kora Web OAuth client ya QA cyangwa wongere QA callback URI kuri client usanzwe.
2. Muri **Authorised JavaScript origins**, shyiramo QA frontend origin nyayo Neon/Render yemeje. Ntugahimbe URL.
3. Muri Neon Console, hitamo QA branch `isoko-full-flow-qa-20261114` → **Auth → Social providers → Google**.
4. Shyiramo QA Client ID na QA Client Secret muri ayo mafishi ya QA gusa, ukande **Save**.
5. Gerageza Google sign-in kuri QA frontend. Emeza callback, email, session no kugaruka ku rubuga rwa QA.
6. Gerageza konti nshya n'iyari isanzweho. Ntukoreshe cyangwa ngo uhindure konti ya Production muri iki kizamini.

## 7. Igihe feature flag izafungurirwa

Flag ya frontend ni:

`VITE_ISOKO_GOOGLE_SIGNIN_ENABLED=true`

Kuri ubu Production flag iguma `false`. Izafungurwa gusa nyuma y'uko:
- QA frontend origin nyayo yemejwe;
- QA Neon Auth ifite credentials;
- QA Google OAuth redirect/login/session round trip yatsinze;
- CI yatsinze;
- habonetse uburenganzira bwihariye bwo gukora Production config change.

Google One Tap/account chooser ntabwo iri muri implementation iriho; ubu ni redirect-button isanzwe ya Neon Auth social login.

## 8. Igenzura rya nyuma

- [ ] Google project na External consent screen byakozwe.
- [ ] Production Web client ifite origin nyayo n'uriya Production redirect URI.
- [ ] Production Client ID/Secret byashyizwe muri Neon Auth Social providers → Google.
- [ ] QA frontend origin nyayo iraboneka kandi yemejwe.
- [ ] QA callback URI yongewe kuri QA Google client.
- [ ] QA Client ID/Secret byashyizwe muri QA Neon Auth.
- [ ] QA Google sign-in yageragejwe kandi session yemejwe.
- [ ] Feature flag iracyazimye kugeza release yemejwe.

**Imiterere y'ubu (2026-11-16):** Production Client ID/Secret biracyari null; QA Google OAuth round trip ntiyageragejwe; QA frontend origin yihariye ntiramenyekana. Ntukoreshe Google button kuri Production ubu.
