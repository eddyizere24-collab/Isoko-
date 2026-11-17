# ISOKO live visual QA screenshots

Captured by GitHub Actions run [#1](https://github.com/eddyizere24-collab/Isoko-/actions/runs/43815618048) on 2026-11-16 against the public Production site.

- Viewports: 360×800 and 320×800.
- 11 public pages at both sizes.
- All 7 language switcher states at both sizes.
- Total: 36 PNG screenshots plus two JSON observation files.
- The JSON files record routes, HTTP response status, document language, horizontal overflow, visible broken images, placeholder WhatsApp anchors, visible Verified text and browser page errors.

## Public page screenshots

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

## Language switcher

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

- See [360×800 observations](observations-360x800.json) and [320×800 observations](observations-320x800.json).
- Public GET checks were used only; no login, uploads, account edits, database writes or purchases were performed.
- Signed-in account, logout/back navigation, and seller photo upload persistence are intentionally excluded until an isolated QA seller session is available.
