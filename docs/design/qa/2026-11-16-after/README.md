# ISOKO redesign screenshots — after

Captured by GitHub Actions on 2026-11-16 from the PR #60 redesigned build, using the public Production read endpoints.

- Viewports: 360×800 and 320×800.
- Public routes: 12, each captured at both sizes.
- Language states: 7, each captured at both sizes.
- Screenshots: 38 PNG files.
- Observations: 2 JSON files.
- The test blocks every request except GET, HEAD and OPTIONS, so POST/PUT/PATCH/DELETE requests cannot change Production data.
- Signed-out only. No login, seller uploads, account edits, KYC actions or purchases were performed.

## Public routes

| Page | 360×800 | 320×800 |
|---|---|---|
| home | [PNG](home-360x800.png) | [PNG](home-320x800.png) |
| category-shoes | [PNG](category-shoes-360x800.png) | [PNG](category-shoes-320x800.png) |
| category-other | [PNG](category-other-360x800.png) | [PNG](category-other-320x800.png) |
| product | [PNG](product-360x800.png) | [PNG](product-320x800.png) |
| shop | [PNG](shop-360x800.png) | [PNG](shop-320x800.png) |
| seller-entry | [PNG](seller-entry-360x800.png) | [PNG](seller-entry-320x800.png) |
| login | [PNG](login-360x800.png) | [PNG](login-320x800.png) |
| account-signed-out | [PNG](account-signed-out-360x800.png) | [PNG](account-signed-out-320x800.png) |
| terms | [PNG](terms-360x800.png) | [PNG](terms-320x800.png) |
| privacy | [PNG](privacy-360x800.png) | [PNG](privacy-320x800.png) |
| help | [PNG](help-360x800.png) | [PNG](help-320x800.png) |
| about | [PNG](about-360x800.png) | [PNG](about-320x800.png) |

## Languages

| Language | 360×800 | 320×800 |
|---|---|---|
| Kinyarwanda (`rw`) | [PNG](language-rw-360x800.png) | [PNG](language-rw-320x800.png) |
| English (`en`) | [PNG](language-en-360x800.png) | [PNG](language-en-320x800.png) |
| French (`fr`) | [PNG](language-fr-360x800.png) | [PNG](language-fr-320x800.png) |
| Swahili (`sw`) | [PNG](language-sw-360x800.png) | [PNG](language-sw-320x800.png) |
| Kirundi (`rn`) | [PNG](language-rn-360x800.png) | [PNG](language-rn-320x800.png) |
| Lingala (`ln`) | [PNG](language-ln-360x800.png) | [PNG](language-ln-320x800.png) |
| Luganda (`lg`) | [PNG](language-lg-360x800.png) | [PNG](language-lg-320x800.png) |

## Observations

- [observations-320x800.json](observations-320x800.json)
- [observations-360x800.json](observations-360x800.json)

All 12 routes returned HTTP 200 at both sizes. Neither viewport had horizontal overflow or visible broken images; no JavaScript page errors were recorded. All seven language switcher states changed the document language as expected. The route observations recorded no blocked mutations because the inspected public flows made no unsafe requests.
