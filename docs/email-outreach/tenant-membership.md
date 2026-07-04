# Tenant Membership

Date: 2026-07-03

## Model

The hosted send-job runtime uses `tenant_memberships` as the source of tenant-scoped authorization.

Step 7D1 adds:

- `status text default 'active'`, with `active` and `disabled`;
- `permissions text[] default '{}'`;
- an index on `(user_id, status)`.

The route adapter requires an active membership. Disabled memberships are rejected.

## Role And Permission Source

Roles and permissions are loaded from hosted persistence after Supabase Auth validates the user. The browser cannot override them.

Role values currently supported by the send-job authorization layer:

- `super_admin`
- `company_owner`
- `marketing_manager`
- `outreach_operator`
- `sales`
- `owner`
- `viewer`

Explicit permissions from membership are honored first, then role-derived defaults are applied.

## Tenant Derivation

For single-membership users, the tenant is derived from the active membership.

For multi-membership users, `GET /api/outreach/send-jobs/tenant-memberships` returns the trusted selector options. Mutating and status routes accept `x-forgeos-selected-tenant-id` only as a server-validated selector. If the selected tenant is missing or outside the active membership set, the route fails closed.

`send_job:prepare` is the explicit permission for preparing approved campaign snapshots for hosted server sending. Role defaults grant it to owners, marketing managers, and outreach operators. View-only users can inspect authorized status but cannot prepare a snapshot.
