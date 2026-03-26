# Terraform (Phase 1 starter)

This directory holds a **minimal** Terraform root module so the repo is not at **0%** IaC forever: you can `terraform init` / `terraform validate` here and grow modules over time.

- Files: `terraform.tf` (required version), `variables.tf` (commented placeholders), `outputs.tf` (commented stubs for future ALB/RDS outputs).
- **No AWS resources are defined yet** — `terraform validate` only checks HCL/module shape; nothing is deployed or planned against a cloud account until you add providers and resources (RDS, ElastiCache, ECS, ALB, etc.).
- **Operator runbook** for manual AWS steps until then: [`docs/roadmap/INFRA_AWS_PHASE1.md`](../../docs/roadmap/INFRA_AWS_PHASE1.md).
- **Secrets:** never commit state or `.tfvars` with real credentials; use a remote backend and CI OIDC when you wire deploys.

```bash
cd infra/terraform
terraform init -backend=false
terraform validate
```

**CI:** GitHub Actions runs the same **`init -backend=false`** + **`validate`** after **`npm run build`** (see root `.github/workflows/ci.yml` and **`DEPLOYMENT.md`** § CI).
