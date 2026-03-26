# User data scope (Phase 1)

## Current model: logical isolation

Phantom Phase 1 uses a **single PostgreSQL database** with **one schema**. Every user-owned row is scoped by **`userId`** (foreign key to `User`). Queries in route handlers **must** filter by `req.user.id` from the JWT; there is no separate database per user.

This is **logical multi-tenancy**: isolation is enforced in application code and Prisma `where` clauses, not by separate DB instances.

## Naming & schema direction

- Prefer explicit **`userId`** on all tenant tables (already the pattern for aliases, inbox, scans, etc.).
- Avoid cross-user joins except for global reference data (e.g. `DataBroker` catalog).

## Future: stronger isolation (not Phase 1)

- **Schema-per-tenant** or **database-per-tenant** would be a migration project with connection routing and backups.
- **Row-level security (RLS)** in PostgreSQL could add a defense-in-depth layer without splitting databases.

Phase 1 documentation that mentioned “per-user schema isolation” refers to this **logical** boundary unless and until a migration ships.
