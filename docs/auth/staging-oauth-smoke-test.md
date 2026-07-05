# Staging OAuth Smoke Test

This checklist is for an explicitly approved non-production Supabase project only. Do not run it against production and do not record tokens, authorization codes, private profile data, or real customer data.

## Prerequisites

- Supabase project reference is confirmed as staging or disposable development.
- Migrations have been applied successfully.
- Google or Microsoft provider is enabled in Supabase Auth.
- Hosted and local callback URLs are configured in Supabase Auth redirect allow-list.
- Provider-side redirect URI points to the callback URL shown by Supabase.
- A synthetic or authorized test user exists.
- A tenant row exists.
- First-owner/test membership will be bootstrapped only through a trusted admin channel.

## Flow

1. Open `https://<staging-host>/pt-PT/login`.
2. Start Google or Microsoft OAuth.
3. Confirm callback returns to `/auth/callback` and then an internal ForgeOS route.
4. With no active membership, confirm the user lands on pending or denied access.
5. Run the private bootstrap procedure with the test user UUID, tenant UUID, role `company_owner`, and status `active`.
6. Sign out through `/auth/signout`.
7. Sign in again through the same provider.
8. Confirm the user reaches the application and selected tenant cookie is set server-side.
9. Confirm protected LeadOps and send-job routes do not accept browser-injected tenant, role, or permission values.
10. Sign out and confirm a protected route redirects to localized login.

## Membership States

Repeat with synthetic memberships where practical:

- `pending`: authenticated, no tenant access.
- `suspended`: authenticated, no tenant access.
- `revoked`: authenticated, no tenant access.
- multiple `active`: routed to tenant selection and selection is revalidated server-side.

## Account-Linking Review

- Same provider account: should return the same Supabase user.
- Google then Microsoft with the same verified email: follow Supabase Auth identity-linking behavior; verify tenant access remains tied to `auth.users.id`.
- Different provider emails: do not merge automatically; administrator must inspect identities and create or update membership deliberately.
- Identity collision: stop and resolve in Supabase Auth/admin tooling before granting tenant membership.

## Current Result

Not executed in this branch. External provider credentials, callback settings, and an explicitly approved staging target were not available in the repository worktree.
