# Gufunga main branch kuri GitHub ukoresheje Android

Iyi ni setup y'umutekano wa GitHub, ntabwo ikora impinduka kuri Render cyangwa Neon Production. Uyikoresha agomba kuba afite **Admin** permission kuri repository.

## Ibyo dushaka kurinda

- Branch pattern: `main`.
- Guhuza code bikorwa binyuze muri Pull Request gusa.
- Pull Request igomba kunyura muri CI check `TypeScript and Vite build` munsi ya workflow `ISOKO checks`.
- Ntihagire umuntu ukoresha force-push cyangwa ngo asibe `main`.
- Ntabwo dusaba required approval count ya 1 muri iyi setup y'ibanze, kuko owner umwe ashobora kuba ari we wenyine ufite uburenganzira bwo gusuzuma PR; kwishyiriraho itegeko ryo kwemezwa na we ubwe byatuma PR zidashobora kwemezwa.

## Uko bikorwa kuri Android

1. Fungura Chrome kuri Android.
2. Jya kuri: https://github.com/eddyizere24-collab/Isoko-/settings/rules
3. Kanda Chrome utudomo dutatu (`⋮`) hejuru, uhitemo **Desktop site** niba page itagaragaza menus zose.
4. Muri GitHub repository settings, fungura **Rules → Rulesets**.
5. Kanda **New ruleset → New branch ruleset**.
6. Izina: `Protect main`.
7. Muri **Enforcement status**, hitamo **Active**.
8. Muri **Target branches**, kanda **Add target** → **Include default branch** cyangwa wandike branch pattern `main` (hitamo uburyo bwerekana main gusa).
9. Muri **Branch rules**, fungura **Require a pull request before merging**.
10. Fungura **Require status checks to pass**.
11. Kanda **Add checks**, ushakishe `TypeScript and Vite build` (workflow check: `ISOKO checks`). Hitamo iyo check yonyine nk'iya ngombwa.
12. Ntushyire required approvals kuri 1 mu gihe nta reviewer wa kabiri uhari. PR izakomeza kunyura muri CI.
13. Fungura **Block force pushes** kandi **Restrict deletions** cyangwa **Prevent deletions** niba bihari.
14. Muri **Bypass list**, ntushyiremo umuntu cyangwa role yo kurenga ayo mategeko ku buryo busanzwe.
15. Kanda **Create ruleset** cyangwa **Save changes**.
16. Subira kuri **Rulesets**, urebe ko `Protect main` igaragara kandi status ari **Active**.

## Uko wemeza ko byakoze

- Fungura repository home, ujye kuri **Settings → Rules → Rulesets**.
- Fungura `Protect main`; reba ko target ari `main`, enforcement ari Active, PR requirement na status check byashyizweho, force-push/delete bibujijwe.
- Niba GitHub ikubwiye ko udafite Admin permission, saba repository owner/admin kubikora. Ntugahindure main ukoresheje direct commit kugira ngo urenge iryo tegeko.

## Icyo twagenzuye kugeza ubu

- GitHub API rulesets read yasubije list irimo ruleset 0.
- Classic branch protection read yasubije 403 kuko connected GitHub app idafite permission isabwa.
- Ibyo ntibihamya ko classic protection itariho; bivuga ko connector itabashije kuyisoma. Ntituvuga ko `main` yamaze kurindwa kugeza umuntu abonye ruleset Active muri GitHub UI.
- CI status context ishobora kugaragara mu GitHub dialog nka `ISOKO checks / TypeScript and Vite build`. Hitamo check ihura n'iyo run yakoze kuri PR; ntuhitemo check itagaragara muri list.

