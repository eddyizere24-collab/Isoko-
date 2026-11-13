# ISOKO OCI foundation (Terraform)

This directory contains the first infrastructure-as-code scaffold for Oracle Cloud Infrastructure Always Free.

## Important status

- This is code only. It does not mean an OCI account exists or that any resource has been created.
- There is no apply workflow.
- The GitHub Actions workflow only runs fmt, init -backend=false, and validate.
- No OCI credentials, private keys, tenancy IDs, or production data belong in this repository.
- No database is created here. Database architecture is deliberately left for a separate owner decision.
- The VM and Object Storage bucket have Terraform prevent_destroy protection.

## Intended free-only baseline

- One VM.Standard.A1.Flex VM: 2 OCPU and 12 GB RAM.
- One 50 GB boot volume.
- One private Standard Object Storage bucket for ISOKO assets.
- A public subnet exposing HTTP/HTTPS only.
- Public SSH is disabled unless a specific admin CIDR is deliberately supplied. Never set it to 0.0.0.0/0.
- Docker, Docker Compose, unattended-upgrades, and fail2ban are installed by cloud-init.

The 50 GB boot volume counts against the 200 GB combined Always Free block-volume quota. The Object Storage free-only allowance is 20 GB combined across storage tiers. Image storage must therefore use responsive variants, WebP/AVIF where supported, compression, and retention rules.

## Before running Terraform

1. Create/confirm one Oracle Free Tier tenancy. Do not upgrade to Pay As You Go for this project without a separate owner decision.
2. Choose the tenancy home region only after comparing nearby latency and confirming A1 capacity. The example uses Johannesburg only as an initial candidate. The home region is not a setting to casually change later.
3. Create a dedicated compartment called ISOKO.
4. Select an Ubuntu ARM64 image that the OCI Console marks Always Free eligible in the home region.
5. Create a temporary or admin SSH keypair. Put only the public key in terraform.tfvars; keep the private key off GitHub and out of chat.
6. Review Terraform remote state. Do not use a local state file as the permanent source of truth. OCI Resource Manager is an Always Free candidate, but its access and state workflow must be reviewed before first apply.
7. Establish short-lived workload identity federation for GitHub Actions before any cloud plan or apply. Do not paste API keys into source files or chat.

## ChatGPT control bridge

Oracle documents JWT-to-RPST workload identity federation for external workloads such as GitHub Actions. The intended design is a protected GitHub Environment and a tightly restricted OCI trust configuration bound to this exact repository/workflow. It should exchange a short-lived GitHub OIDC token for a short-lived OCI Resource Principal Session Token. OCI's documentation describes an OAuth client and trust configuration as part of the setup; any OAuth client secret must live only in a protected GitHub Environment secret. The signing key should be generated ephemerally inside the workflow, not stored in the repository.

Federation is not configured by this scaffold. The first workflow intentionally performs validation only and has no OCI credentials or permission to create resources.

## Commands (after account setup and remote state/auth review)

- cd infra/oci
- cp terraform.tfvars.example terraform.tfvars
- terraform init
- terraform fmt -check
- terraform validate
- terraform plan

Do not run terraform apply until the owner has reviewed a plan proving that every resource is Always Free eligible and the remote state and recovery path are ready.

## Recovery and image storage

- Keep the bucket private. Public image delivery should be implemented through signed URLs or an application-controlled image endpoint later.
- Keep original images and generated thumbnails in separate prefixes.
- Generate small card thumbnails, medium detail images, and compressed originals.
- Track the bucket's approximate size and alert well before 20 GB.
- Back up the database separately once its engine is selected. Object Storage versioning is initially disabled to avoid silently accumulating old copies against the free quota.
