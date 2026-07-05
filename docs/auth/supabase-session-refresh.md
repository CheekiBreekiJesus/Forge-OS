# Supabase Session Refresh

ForgeOS uses the Next.js 16 `src/proxy.ts` convention for Supabase session refresh.

## Behavior

- In local persistence mode, proxy leaves requests unchanged.
- In Supabase persistence mode, proxy creates an `@supabase/ssr` server client from request cookies.
- `auth.getUser()` refreshes expired or near-expiry sessions and writes refreshed cookies through `NextResponse`.
- Public routes stay accessible.
- Protected localized pages and non-public API routes require an authenticated Supabase user and active tenant membership.

## Public Routes

- `/auth/callback`
- `/auth/signout`
- `/<locale>/login`
- `/<locale>/access/*`
- `/<locale>/unsubscribe`
- `/api/health/*`
- `/api/outreach/unsubscribe`
- `/api/outreach/brevo/webhook`
- Next.js/static assets

## Notes

The proxy uses anon/publishable credentials for user-session operations. Membership lookup remains server-side and uses the service-role client. Service-role values are never referenced by browser clients.
