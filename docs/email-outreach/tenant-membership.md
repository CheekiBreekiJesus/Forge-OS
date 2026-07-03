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

For Step 7D1, the tenant is derived from the single active membership. If a user has multiple active memberships, the server returns `tenant_selection_required`.
