# Supabase OAuth Setup

ForgeOS uses Supabase Auth as the hosted identity provider for OAuth sign-in. This is app-side foundation only: provider credentials, hosted project settings, database policies, and tenant membership data are configured outside the repository.

## App Flow

1. The localized login page renders Google and Microsoft sign-in buttons.
2. The browser client starts Supabase OAuth with `signInWithOAuth`.
3. Supabase redirects back to `/auth/callback?next=<internal-path>`.
4. The callback exchanges the OAuth code for a Supabase session using the server-side cookie client.
5. ForgeOS redirects to the sanitized internal `next` path.
6. ForgeOS resolves tenant membership before granting tenant access.

OAuth proves identity only. Tenant access still depends on an active ForgeOS tenant membership.

## Providers

| Provider | Supabase provider id | Scopes | Callback URL |
| --- | --- | --- | --- |
| Google | `google` | Supabase default scopes | `https://<forgeos-host>/auth/callback` |
| Microsoft Entra ID | `azure` | `openid email profile` | `https://<forgeos-host>/auth/callback` |

Configure equivalent localhost callback URLs for development, for example `http://localhost:3000/auth/callback`.

## External Provider Setup

Supabase:

- Site URL: `https://<forgeos-host>`.
- Redirect allow-list: `https://<forgeos-host>/auth/callback`, `http://localhost:3000/auth/callback`, and any explicit staging callback host.
- Google provider: enable the `google` provider and paste the Google OAuth client ID and secret only into Supabase/provider secret storage.
- Microsoft provider: enable the `azure` provider and paste the Microsoft client ID and secret only into Supabase/provider secret storage.
- Do not store provider client secrets in `.env.example`, screenshots, docs, tickets, or chat logs.

Google Cloud:

- Application type: Web application.
- Authorized JavaScript origins: `https://<forgeos-host>` and local/staging origins used for OAuth testing.
- Authorized redirect URI: the Supabase provider callback URL shown in the Supabase Google provider settings.
- Configure consent screen and test users for non-production validation before broad access.

Microsoft Entra:

- Platform: Web.
- Redirect URI: the Supabase provider callback URL shown in the Supabase Azure provider settings.
- Supported account type: choose the tenant policy deliberately; do not broaden account access by default.
- Scopes: `openid`, `email`, and `profile`.
- Store the client secret only in Supabase/provider secret storage.

ForgeOS:

- Local callback URL: `http://localhost:3000/auth/callback`.
- Hosted callback URL: `https://<forgeos-host>/auth/callback`.
- OAuth `next` is sanitized to internal paths only. External URLs, protocol-relative values, and auth-loop paths are rejected.

## Environment

Use placeholders in committed files only. Real values belong in local or hosted environment settings.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
FORGEOS_PERSISTENCE_MODE=supabase
FORGEOS_ACTIVE_TENANT_KEY=<tenant-key>
```

Do not expose service-role keys in browser code or committed files.

## Redirect Safety

ForgeOS only accepts internal redirect paths for OAuth `next` values. External URLs, protocol-relative URLs, backslash paths, decoded backslash paths, URL schemes, and auth-loop routes are rejected and replaced with the default locale route.

## Local Development Behavior

When public Supabase configuration is missing, the OAuth buttons stay on the login page and show a localized configuration error. This keeps local and CI tests deterministic and prevents accidental external provider navigation.

When `FORGEOS_PERSISTENCE_MODE` is not `supabase`, the local demo login remains visible for prototype workflows.

## Hosted Configuration Checklist

- Enable Google and Microsoft providers in Supabase Auth.
- Add hosted and local callback URLs to Supabase Auth redirect allow-list.
- Add matching redirect URLs in Google Cloud Console and Microsoft Entra ID.
- Configure tenant membership records for the authenticated user before granting app access.
- Validate that no service-role key is present in browser-visible environment variables.
- Keep membership activation as a trusted administrator or service-side operation.

## Deferred Work

- Add hosted smoke tests against real Supabase Auth only in an approved environment with non-production accounts.
- Add user onboarding or invitation flows after the tenant membership model is finalized.

References:

- Supabase SSR client guidance: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase SSR advanced guide: https://supabase.com/docs/guides/auth/server-side/advanced-guide
- Next.js Proxy convention: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
