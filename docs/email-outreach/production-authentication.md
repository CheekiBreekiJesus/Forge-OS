# Production Authentication

Date: 2026-07-03

## Current Mechanism

Send-job API routes resolve production actors in `resolveTrustedSendJobActorContext`.

In production:

- request body values are never used for user, tenant, role, or permissions;
- ForgeOS trusted headers are ignored;
- a `Bearer` access token is required;
- the token is validated server-side through Supabase Auth `/auth/v1/user`;
- the authenticated user ID is loaded from the Auth response;
- active tenant membership is loaded with server-only Supabase credentials;
- users with multiple active memberships must select a tenant returned by the trusted server membership endpoint.

In development and test only, trusted headers remain available behind `NODE_ENV !== "production"` for deterministic local tests.

## Fail-Closed Cases

Production route execution fails closed when:

- Supabase URL, anon/publishable key, or service-role key is missing;
- no bearer token is present;
- Supabase Auth rejects the token;
- no active tenant membership exists;
- more than one active membership exists and no selected tenant is supplied;
- the selected tenant is not in the authenticated user's active membership set.

## Tenant Selection

`GET /api/outreach/send-jobs/tenant-memberships` returns active memberships derived server-side after token validation. The campaign UI can display those memberships. Follow-up calls may include `x-forgeos-selected-tenant-id`, but production treats that value only as a selector and validates it against the active membership list before deriving tenant, roles, and permissions.

The browser cannot elevate role, permission, actor, or tenant by sending `x-forgeos-actor-id`, `x-forgeos-tenant-id`, or `x-forgeos-roles` in production.
