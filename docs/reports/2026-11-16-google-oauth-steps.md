# ISOKO Google OAuth Android instructions update

Date: 2026-11-16

## Changes
- Rewrote the Android tap-only Google OAuth instructions.
- Added exact Production JavaScript origin and Neon Auth callback URI.
- Added exact QA Neon Auth base URL and callback URI.
- Explicitly explains that Production frontend cannot be used to test QA OAuth because the deployed frontend uses Production Neon Auth.
- Documents the missing QA frontend origin as a release prerequisite; no QA origin or redirect URL is guessed.
- Gives exact Neon Console location for Client ID and Client Secret: project → branch → Auth → Social providers → Google.
- Keeps Google feature flag disabled until a real QA OAuth round-trip succeeds.
- Lists the required verification checklist and keeps One Tap out of scope.

## Current configuration evidence
- Production Google Client ID/Secret are currently null.
- QA Google credentials and QA OAuth sign-in are not verified.
- No Neon Auth provider settings, Render variables, Production Function, database, or website were changed.
