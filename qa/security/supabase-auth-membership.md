# Supabase Auth Membership Security Notes

## Controls

- External and protocol-relative redirects are rejected by existing safe redirect utilities.
- OAuth callback loops and sign-out loops are rejected.
- Supabase mode blocks protected routes without authenticated cookies.
- App access requires active membership.
- Pending, suspended, and revoked memberships do not grant access.
- Tenant selection is revalidated server-side.
- Service-role client is server-side only and is not imported by browser clients.
- OAuth access tokens and authorization codes are not logged.

## Known Limitations

- Route protection currently enforces active membership, not fine-grained per-module permissions.
- Migration runtime validation is pending until a safe local or staging Supabase environment is available.
- Account linking behavior depends on hosted Supabase Auth configuration and still requires administrator procedure documentation before production rollout.
