# ISOKO Hosting Decision — Oracle Cloud Infrastructure

**Decision date:** 2026-11-13  
**Repository:** eddyizere24-collab/Isoko-  
**Status:** Approved architecture direction; account provisioning not yet performed.

## Decision

Use **Oracle Cloud Infrastructure (OCI) Always Free as ISOKO's primary hosting target**.

This is the best fit for the current constraint: ISOKO must be able to start without a recurring hosting bill while the project has no revenue. AWS Lightsail remains available as a fallback, but its regular instance plans are paid and therefore do not meet the current zero-monthly-cost requirement.

This is an architecture decision, not a claim that a cloud account or server already exists. No Oracle account has been connected to this repository and no OCI resource has been provisioned.

## Why OCI wins for this stage

- OCI has a published Always Free resource allowance that continues beyond the 30-day promotional trial, provided the account remains active and usage stays inside the limits.
- The free allowance includes Arm compute, block storage, object storage, outbound transfer, networking, certificates, monitoring, Bastion, and Terraform Resource Manager.
- OCI's newer JWT-to-RPST workload identity federation supports external CI/CD workloads such as GitHub Actions. This gives us a path to short-lived OCI access without putting a long-lived OCI API key in source code.
- The OCI Terraform provider is actively maintained. Infrastructure can be described, reviewed, versioned, and validated in this GitHub repository.

Official references:
- Always Free resources: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Free Tier overview: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
- Workload identity federation / JWT-to-RPST: https://docs.oracle.com/en-us/iaas/Content/Identity/api-getstarted/token_exchange_grant_type_workload_id-federation.htm
- OCI Terraform provider: https://registry.terraform.io/providers/oracle/oci/latest

## Important Always Free limits

For a normal Always Free tenancy after trial expiry, current Oracle documentation lists:

| Resource | Free allowance | ISOKO rule |
|---|---:|---|
| Ampere A1 compute | 2 OCPUs + 12 GB RAM total | Use one A1.Flex VM at 2 OCPU / 12 GB maximum |
| Block Volume | 200 GB combined boot + block volumes | Start with one 50 GB boot volume; do not create extra disks without reviewing the total |
| Block-volume backups | 5 total | Keep backup retention inside this limit |
| Object Storage | 20 GB combined across Standard, Infrequent Access and Archive | Keep the full image library below 20 GB until a paid-storage decision is approved |
| Object Storage requests | 50,000 API requests/month | Use caching and image variants; monitor request volume |
| Outbound transfer | 10 TB/month | Monitor traffic and avoid unneeded large image downloads |
| Flexible Load Balancer | One, 10 Mbps minimum/maximum | Optional; do not add until needed |
| Bastion | Free | Prefer time-limited, restricted administration over public SSH |
| Resource Manager | Always Free allowance | Consider it for managed Terraform state/workflows after review |

The values above are ceilings, not a guarantee that a particular region has available capacity.

### Risks we accept and must monitor

1. Always Free compute must be in the tenancy's home region. The home region is selected at account signup and cannot simply be changed later. Johannesburg (af-johannesburg-1) is the first candidate to investigate for Rwanda, but actual latency, A1 capacity, and available Always Free services must be checked before selecting the account's home region.
2. Oracle can reclaim an Always Free compute instance that meets its idle criteria over a 7-day period: CPU 95th-percentile below 20%, network below 20%, and (for A1) memory below 20%.
3. Oracle's signup/FAQ warns that accounts left idle for 30 days or more may be deemed abandoned and become eligible for suspension or termination. The account must remain actively maintained.
4. The free-only Object Storage allowance is 20 GB combined. Objects above that amount when trial credits expire can be deleted. Images must be resized, converted to modern formats, deduplicated, and monitored.
5. Always Free alone does not include a production SLA or normal Oracle Support entitlement.
6. Oracle may report “out of host capacity” for A1 in a selected home region. We must not upgrade to a paid shape just to get around this without explicit owner approval.

We will not promise 100% uptime or unlimited free storage. We will build backups, monitoring, exportability, and a clear path to paid expansion only when revenue can support it.

## Initial technical shape

- One Ubuntu ARM64 VM using VM.Standard.A1.Flex, capped at 2 OCPU and 12 GB RAM.
- A 50 GB boot volume.
- One private Object Storage bucket for original and derived images. Public bucket access remains disabled; the application will later deliver authorized image reads.
- A VCN with public HTTP/HTTPS only. Public SSH is disabled by default. Administration should use OCI Bastion or another reviewed, time-limited method.
- Docker installed on the VM to keep application deployment portable.
- No database is provisioned by this first infrastructure scaffold. Database engine, backups, data model and migration plan will be agreed separately.
- No domain, public production deployment, payment gateway, SMS provider or paid services are configured by this decision.

## ChatGPT / GitHub control model

There is no confirmed native OCI connection in this ChatGPT session. Therefore, the control path will be:

1. ChatGPT reviews and updates the infrastructure-as-code files in GitHub.
2. GitHub Actions validates the Terraform changes.
3. OCI workload identity federation is configured using Oracle's JWT-to-RPST flow, with trust restricted to this repository and a protected GitHub Environment.
4. GitHub Actions obtains short-lived OCI credentials at job runtime. Secrets or signing material must never be committed or pasted into chat.
5. Terraform plans are reviewed before any apply. Apply requires an explicit protected approval from the owner.

Oracle's JWT-to-RPST flow supports external workloads such as GitHub Actions and issues short-lived Resource Principal Session Tokens. Oracle's documentation describes a trust configuration, OAuth client authorization, claim validations, and signing-key material. The federation setup is not complete merely because the workflow exists; it must be configured and tested in the actual OCI tenancy.

The GitHub Actions workflow in this branch performs format/init/validate only. It has no apply step and no OCI credentials.

## State management decision still required before provisioning

Terraform state must not be committed to Git. Before the first apply, select and validate an encrypted remote state location and access policy. Candidate: OCI Resource Manager, which is included in the Always Free service set. Do not use a local state file as the permanent source of truth.

## Rollout gates

- [ ] Owner creates or confirms one Oracle Free Tier account using accurate account details.
- [ ] Owner verifies that the account is Free Tier / Always Free and does not upgrade to Pay As You Go.
- [ ] Home region is selected only after reviewing region choice, nearby latency, and A1 capacity.
- [ ] Dedicated ISOKO compartment and least-privilege access model are prepared.
- [ ] Workload identity federation is configured and tested without exposing long-lived credentials.
- [ ] Terraform remote state is selected and protected.
- [ ] A no-cost plan is reviewed and verified against Always Free limits.
- [ ] First infrastructure apply is explicitly approved by the owner.
- [ ] Server, object storage, backups, monitoring, and recovery are verified before application deployment.

## Explicit non-goals of this decision

- Do not reuse AHABONA's Lightsail instance for ISOKO.
- Do not modify or delete AHABONA resources.
- Do not provision paid OCI resources.
- Do not create a production database in this phase.
- Do not connect or migrate real customer or KYC data.
- Do not deploy the public ISOKO website yet.
