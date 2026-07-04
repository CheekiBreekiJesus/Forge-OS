# Tenant Membership

The hosted schema stores tenant access in `public.tenant_memberships`.

## Runtime Fields

- `id`
- `tenant_id`
- `user_id`
- `role`
- `permissions`
- `status`
- timestamps
- optional invitation/approval/suspension/revocation metadata

## Migration

`202607040001_auth_membership_status_permissions.sql` adds the runtime fields that were missing from the original demo schema and constrains status and role values.

Existing rows without a status are marked `active` to preserve prior behavior. New rows default to `pending`.

## Administration

Membership activation must be performed by a trusted administrator or service-side bootstrap process. Anonymous users and pending members must not activate themselves.
