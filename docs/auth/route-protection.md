# Route Protection

Route classification lives in `src/lib/auth/routes.ts` and is enforced in Supabase mode by `src/proxy.ts`.

## Public

Login, OAuth callback, sign-out, access-state pages, unsubscribe routes, explicit health routes, Brevo webhooks, and static assets.

## Active Membership Required

Localized application pages, LeadOps, settings, operational modules, and non-public API routes.

## Webhook or Token Authenticated

Brevo webhook and unsubscribe endpoints remain public to the app-session proxy because they use their own authentication/token validation.

## Server Enforcement

Navigation visibility is supplementary. Server routes and server actions must derive tenant, role, and permission from trusted server-side membership resolution.
