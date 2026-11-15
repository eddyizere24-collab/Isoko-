# ISOKO implementation rules

One rule per line. Add a line whenever behaviour or an operational boundary changes.

- Seller avatar, shop logo and shop cover are persisted immediately after each successful upload — sellers must not lose an uploaded image because they missed a later general Save action.
- Avatar, logo and cover use distinct upload kinds and storage prefixes (`profiles/`, `logos/`, `shops/`) — each image has a separate purpose and must never be confused with another.
- Seller image ownership is derived from the authenticated Neon user on the server — a browser-supplied seller id is not an ownership credential.
- Seller uploads are limited by a server-side per-seller daily counter — client-side limits can be bypassed.
- Upload quotas fail closed when the server cannot verify the current count — an unavailable quota check must not silently disable abuse protection.
- Image MIME and magic-byte checks plus the 500 KB server limit remain authoritative — file extensions and browser labels are not trustworthy.
- Public image URLs must match the configured HTTPS Object Storage origin and bucket path — reject unexpected hosts and unsafe object keys.
- A rejected public image URL is logged only in development and never exposes secrets — developers need diagnostics without leaking production details.
- Broken seller profile, logo and cover images show an honest local placeholder — a failed image must not be replaced with an invented seller/product photo.
- Seller avatar is at least 72 px and its upload control is at least 44 px — identity photos need to be recognisable and usable on touch screens.
- Seller avatar and shop logo sit below, not on top of, the cover image — three separate assets must remain visually distinguishable.
- Storage base URLs and Content Security Policy image hosts must point to the same Neon Object Storage endpoint — a correct upload is useless if the browser blocks the image.
- Production SQL, Function deployment, environment variables, DNS and billing are not changed without the owner's documented release approval — the public marketplace must not be altered by an unreviewed change.
- Additive schema changes are verified on an isolated QA branch before Production — test writes and policy checks must never run against live seller data.
- A feature is not reported complete until CI, device-size screenshots and the required real-account QA evidence are available — source code alone does not prove the user journey works.
