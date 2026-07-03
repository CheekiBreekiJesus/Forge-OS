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
- active tenant membership is loaded with server-only Supabase credentials.

In development and test only, trusted headers remain available behind `NODE_ENV !== "production"` for deterministic local tests.

## Fail-Closed Cases

Production route execution fails closed when:

- Supabase URL, anon/publishable key, or service-role key is missing;
- no bearer token is present;
- Supabase Auth rejects the token;
- no active tenant membership exists;
- more than one active membership exists and no trusted tenant selector has been implemented.

## Remaining Step 7D2 Need

Multi-tenant users need a trusted tenant selector, probably a server-created session/cookie value tied to a validated membership. Until then, multiple active memberships are rejected rather than guessed.
