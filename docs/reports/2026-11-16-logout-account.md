# ISOKO — Logout and account centre report (2026-11-16)

## Status

Implementation branch: `fix/account-logout-20261116`  
Base: `main` at `4da491c1cb38d6622dab1a3d4bb7c63f8332e997`  
PR: Pending Draft creation.  
Production: untouched. No Production SQL, Function deployment, env-var, Render, DNS or billing changes.

## What changed

- Neon `signOut()` is now awaited. A returned SDK error leaves the user signed in locally and displays an error instead of pretending logout succeeded.
- After a successful server sign-out, the app aborts requests using the shared private-request signal, clears matching auth-related keys from localStorage/sessionStorage, deletes matching IndexedDB databases where supported, clears matching Cache Storage entries, clears auth/profile/shop React state, and replaces browser history with the public home route.
- The guest cart, followed public shops, recently viewed products, size preferences, and chosen language are deliberately preserved; these are anonymous shopping state rather than authenticated account data.
- New `/konti` account hub. Signed-out buyers see an explanation that product discovery and WhatsApp contact do not require registration, plus links to sign in or open a shop. Signed-in users see account actions and a prominent red `Sohoka` button.
- New `/konti/yanjye` page. It shows the email-verification state from the profile, a password-change path only if the installed Neon Auth client exposes `changePassword`, other-device sign-out only if `revokeOtherSessions` is available, and sign-out from the current device.
- Private seller/admin routes are guarded until Neon session restore finishes. The router verifies both an authenticated session and the expected role before rendering the private page. Unauthorized navigation replaces the current history entry with a safe route.
- Sign-out actions are surfaced in the desktop Header, seller dashboard, Admin dashboard, Konti page and Konte yanjye page. On mobile, the five-tab Konti entry opens the same account hub.
- Direct account-related upload and Admin CSV requests use the shared abort signal.
- Unit tests cover private request cancellation and the removal of auth keys while anonymous shopping preferences remain. E2E tests cover signed-out seller/admin/account routes and the public Konti hub.
- The current email verification state is shown, but this PR does not send email verification links or enforce email verification before product publishing.

## Files changed

- `src/lib/authLifecycle.ts`
- `src/lib/authLifecycle.test.ts`
- `src/context/MarketplaceContext.tsx`
- `src/lib/api.ts`
- `src/pages/AccountPage.tsx`
- `src/App.tsx`
- `src/components/BottomNav.tsx`
- `src/components/Header.tsx`
- `src/pages/SellerDashboardPage.tsx`
- `src/pages/AdminPage.tsx`
- `e2e/seller-auth.spec.cjs`
- `docs/RULES.md`
- `docs/reports/2026-11-16-logout-account.md`

## API support and assumptions

- The app is pinned to `@neondatabase/neon-js 0.9.0-beta`. The session restore and sign-out use the already-used SDK methods `getSession()` and `signOut()`.
- Password change and revocation of other devices are runtime feature-detected. If the installed SDK does not expose the method, the UI offers the existing password-reset email flow instead. No method is assumed to exist just because a newer Better Auth documentation page describes it.
- The app currently stores a local auth marker in `isoko_auth_session`, not a copy of the actual JWT. Neon Auth itself remains responsible for clearing its own cookie/session persistence through `signOut()`.
- Anonymous cart, public follows and browsing preferences are not cleared at logout to avoid deleting guest shopping data.

## Tests and evidence

### Passed CI

- GitHub Actions run [43774651469](https://github.com/eddyizere24-collab/Isoko-/actions/runs/43774651469) passed on commit `3eb3cd4e6fdd062d84f8c5f4cc44eb0e6b513682`: TypeScript, unit tests, Neon Setup/Production smoke checks, Production CORS, Vite build, Playwright browser smoke tests, and Neon Function bundling.

### Tests added

- `src/lib/authLifecycle.test.ts`: cancellation and storage cleanup/preservation checks.
- `e2e/seller-auth.spec.cjs`: signed-out `/admin`, `/konti/yanjye`, and public `/konti` behaviour.
- Existing Playwright seller signup/login and signed-out seller product route tests remain in place.

### Not yet tested

- The successful CI run uses browser mocks and synthetic anonymous catalogue data; it is not a real authenticated session or Android device test.
- A real QA account sign-in followed by sign-out in Android Chrome.
- Server-side session invalidation after logout read-back.
- Back-button verification on an Android device.
- Password change / other-device sign-out against a real QA account; runtime method detection is not a substitute for a successful authenticated test.
- Whether Neon Auth uses IndexedDB or Cache Storage for any extra private state not named with an auth-related key. The SDK's signOut handles its managed session, but no undocumented storage key names are assumed.
- Internal Data API requests issued by the Neon SDK do not currently accept this app-level AbortSignal through the existing client abstraction. Direct upload and Admin CSV fetches are cancellable; the private route guard and cleared Neon session prevent rendering private pages after logout.

No real account or mobile screenshot result is claimed. The existing CI Playwright smoke suite does not produce the required 320×800/360×800 screenshot matrix.

## Production impact

No Production writes, migrations, Functions, Render deploys, environment changes, DNS or billing changes were performed. This PR contains only frontend code, tests and documentation.

## Owner actions (Android only, Kinyarwanda)

1. Fungura Draft PR ya GitHub iri kuri compare link ChatGPT izatanga.
2. Reba ibisubizo bya GitHub Actions. Niba hari test itatsinze, ntukande Merge.
3. Claude agomba gusuzuma ibihindutse muri `MarketplaceContext`, `App.tsx`, `authLifecycle.ts` na `AccountPage.tsx`.
4. Nyuma y’uko CI na QA byemejwe, ushobora gukoresha buto **Merge** muri GitHub. Ntugire SQL cyangwa environment variable uhindura kuri iyi PR.
5. Gerageza kuri telefoni: Injira muri konti ya QA → fungura Konti → kanda Sohoka → kanda Back. Ugomba kuguma ku rubuga rusange, ntugaruke mu ibiro by’umucuruzi/Admin.

## Risks and open issues

- `changePassword` and `revokeOtherSessions` may not be exposed by the exact SDK beta. The page hides unavailable controls and uses the reset-password link as fallback.
- Email verification is not enforced yet. This belongs in the separate security work package after verification that the installed Neon Auth provider can send/confirm verification emails.
- The current auth cleanup relies on Neon Auth's own signOut for its managed session and removes known auth-named browser storage. It does not delete guest shopping preferences.
- Some Neon SDK Data API requests cannot yet be cancelled via an AbortSignal through the current SDK query interface; this is documented rather than claimed as fully covered.
- The Playwright run uses an anonymous empty catalogue fixture and no real accounts. It proves route and UI behaviour only, not account security against real sellers.
