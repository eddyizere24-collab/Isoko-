# ISOKO Hosting Decision (2026-11-13)

## Decision

Use a split, free-tier architecture for the first public ISOKO release:

- **Cloudflare Pages Free**: static React/Vite storefront and dashboard assets, built from this GitHub repository. The planned production address is the generated `*.pages.dev` hostname until a custom domain is deliberately added.
- **Neon Free**: a dedicated ISOKO project for PostgreSQL, Node.js 24 Functions, and S3-compatible Object Storage.
- **GitHub**: source of truth, pull requests, code review, build checks, and deployment history.

No paid plan, card, domain purchase, R2 subscription, or usage-based upgrade is part of this decision. If a free quota is reached, the service must stop safely and we review usage; we do not silently enable billing.

## Why this choice

ISOKO is not a static brochure. Its current server has seller registration/login, product and shop management, moderation, analytics, campaigns, reports, and image uploads. The current implementation writes application data to `data/db.json` and uploaded images to a local `uploads/` directory. A static host alone cannot replace that backend, and a free server with ephemeral local disk is not acceptable.

Neon gives the project a durable PostgreSQL database and Object Storage that are independent of a function's local filesystem. Functions run close to the database and use the standard Node.js runtime. Cloudflare Pages serves the compiled Vite frontend globally and builds from Git.

## Exact ISOKO resources created

These resources are separate from the existing AHABONA Neon project:

| Resource | Value |
|---|---|
| Neon organization | `org-royal-dream-23363731` (Free plan) |
| ISOKO Neon project | `isoko-marketplace` |
| Neon project ID | `square-queen-83418379` |
| Region | `aws-eu-central-1` (Frankfurt) |
| PostgreSQL | 17 |
| Database | `isoko` |
| Default branch | `main` (`br-fancy-queen-ba25orv1`) |
| Setup branch | `isoko-setup` (`br-raspy-resonance-baqfwhuh`) |
| Public assets bucket | `isoko-public-assets` (`public_read`) |
| Private KYC bucket | `isoko-private-kyc` (`private`) |

Both buckets have been created on the ISOKO default branch and its setup branch. The setup branch is ready. Both databases are still empty: no schema, seller records, product data, or images have been migrated.

**AHABONA is not part of this project.** Its existing Neon project `ahabona-platform` was only identified while checking the account and was not modified, queried for application data, or used by ISOKO. The AWS Lightsail AHABONA service is also out of scope and must never be changed by this project.

## Free-tier limits that matter

Neon's Free plan currently lists:

- 100 Compute Unit-hours per project per month.
- 1 GB PostgreSQL storage per project (up to 20 GB across the Free organization).
- 5 GB public network transfer per project per month.
- 5 GB Object Storage per project.
- 1 million Function invocations, plus included Function capacity quotas.
- Compute suspends after 5 minutes of inactivity and wakes on the next request.
- 6-hour instant-restore history and one manual snapshot.

When the monthly compute or network quota is used, compute is suspended until the next monthly reset or an explicitly approved plan change. Reaching the database storage cap blocks writes that would increase it. **The quotas do not themselves delete existing database data.** These are real caps, not unlimited production capacity.

Cloudflare Pages Free currently lists 500 builds per month, one concurrent build, up to 20,000 files per site, and a 25 MiB limit per individual asset.

The first user request after Neon compute sleeps can be slower while the database wakes. This is acceptable for an early low-traffic launch only if the UI handles loading and retries cleanly.

## Inactivity, backups, and the user's deletion concern

Neon's documented scale-to-zero behavior suspends compute; it does not delete the root branch's data. The current Free-plan quota documentation also states that hitting the monthly compute/network limits does not delete data.

However, **this is not a promise that a provider account can never be suspended or terminated**. The Neon platform agreement can be changed, workspaces can be suspended for policy violations, and the agreement requires the customer to back up its content. The reviewed current documents did not state a specific automatic "delete the whole Free account after 90 days of inactivity" rule, but absence of such a rule is not a data-retention guarantee.

Therefore, before public seller onboarding:
1. Add automated encrypted backups to a second, independent destination.
2. Verify a full restore from those backups, including metadata and image objects.
3. Keep export/restore instructions in this repository.
4. Add an operational reminder to review the Neon and Cloudflare accounts and quota dashboards at least monthly.
5. Never treat the 6-hour restore window or one manual snapshot as the only backup.

No KYC or seller identity data may go into the public bucket or a Git repository.

## Why the earlier options were rejected

- **Oracle Cloud Always Free**: signup required payment-card identity verification, and the owner has no funds available. No OCI resources were created. The earlier OCI Terraform draft PR was closed without merging.
- **Render Free**: its free web-service filesystem is ephemeral, the service sleeps after inactivity, and its free Postgres is time-limited. It is unsuitable for the current local-file-based app without a separate durable backend.
- **Supabase Free**: the connected Supabase project belongs to IWACU RWANDA, not ISOKO. It must not be reused. Its free inactivity pause is also an avoidable operational risk.
- **Cloudflare R2**: the current R2 signup flow requires a subscription/billing setup, so it is excluded while there is no payment method.
- **Vercel Hobby**: the existing connected Vercel account had no ISOKO project, and we are not relying on a hobby plan's commercial-use terms for a marketplace.

## Current state versus what is not done

Completed:
- Neon Free ISOKO project created and read back successfully.
- Separate `main` and `isoko-setup` branches created and read back.
- Public product/shop image bucket and private KYC bucket created on both branches.
- This hosting decision recorded in GitHub on a feature branch.

Not yet completed:
- Cloudflare account/GitHub Pages integration is not connected.
- No Cloudflare Pages site or public URL exists yet.
- Neon schema is not deployed.
- No Neon Function has been deployed.
- App code still uses Express + local JSON/files and must be migrated.
- Authentication, demo seed removal, KYC protections, rate limiting, and backups must pass the production security gate.
- No real seller data or existing database data has been moved.
- No production deployment has occurred.

## Release policy

All code work remains on feature branches and reviewed pull requests. Do not merge to `main`, connect a custom domain, import production data, or make a public production release without a release review. No tool may select a paid plan or enable billing without the owner's explicit approval.
