# Supabase Auth Membership

ForgeOS treats Supabase OAuth as identity only. Application access requires an active tenant membership resolved server-side.

## Boundary

- Browser initiates OAuth.
- Server exchanges the OAuth code and verifies the Supabase user with `auth.getUser()`.
- Server loads memberships using the service-role client.
- Tenant, role, and permissions are derived from membership rows, not from request bodies or browser headers.
- Local preview role controls remain UI-only and do not authorize server actions.

## Membership Statuses

- `pending`: authenticated but awaiting administrator approval.
- `active`: grants tenant access.
- `suspended`: denied.
- `revoked`: denied.

Only `active` grants application access.

## Tenant Selection

Users with one active membership are routed into that tenant. Users with multiple active memberships are sent to `/<locale>/access/tenants`, which lists only memberships loaded for the authenticated Supabase user. The submitted tenant is revalidated before the `forgeos.selected_tenant_id` httpOnly cookie is set.

## Fail-Closed Rules

When `FORGEOS_PERSISTENCE_MODE=supabase`, missing Supabase configuration, missing cookies, missing membership, pending membership, suspended membership, or revoked membership blocks application access. The local demo fallback is only available outside Supabase persistence mode.

## Account Linking and Email Collisions

Supabase Auth currently supports automatic identity linking for OAuth identities with the same verified email address, and manual linking for signed-in users when enabled. SAML SSO accounts are excluded from automatic/manual linking by Supabase for security reasons.

ForgeOS does not implement custom account merging in this slice. Administrators should inspect Supabase Auth identities and tenant memberships before assigning access when Google and Microsoft accounts use the same email or when provider email claims differ. Tenant access remains tied to the Supabase `auth.users.id`, not to email-domain matching.
