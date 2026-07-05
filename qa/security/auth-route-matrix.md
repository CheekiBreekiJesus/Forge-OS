# Auth Route Matrix

Date: 2026-07-05
Branch: `integration/jh-gomes-auth-activation`

Source of truth: `src/lib/auth/routes.ts` and `src/proxy.ts`.

## Route Classes

| Route or pattern | Classification | Enforcement |
| --- | --- | --- |
| `/_next/*`, `/assets/*`, `/images/*`, public files | Public static asset | Excluded or allowed by route classifier. |
| `/` | Public root redirect | Locale redirect remains available. |
| `/auth/callback` | OAuth callback | Public to proxy; route exchanges code, sanitizes `next`, then membership resolution gates app access. |
| `/auth/signout` | Sign-out | Public to proxy; route clears Supabase session and selected-tenant cookie. |
| `/{locale}/login` | Public localized login | Starts OAuth or local demo flow depending on persistence mode. |
| `/{locale}/access/pending` | Public access-state page | Used when authenticated identity lacks active membership. |
| `/{locale}/access/denied` | Public access-state page | Used for denied states. |
| `/{locale}/access/tenants` | Public access-state page with server revalidation | Tenant selection submission revalidates membership server-side before setting cookie. |
| `/{locale}/unsubscribe` | Public page | Token-based unsubscribe flow, not app-session protected. |
| `/api/health/*` | Public health | No tenant data returned. |
| `/api/outreach/unsubscribe` | Unsubscribe-token authenticated | Public to app-session proxy; endpoint validates unsubscribe token/secret behavior. |
| `/api/outreach/brevo/webhook` | Provider-webhook authenticated | Public to app-session proxy; endpoint validates webhook secret/signature behavior. |
| `/{locale}` | Active tenant membership | Supabase mode requires authenticated user and active membership. |
| `/{locale}/demo` | Active tenant membership in Supabase mode | Local demo behavior is not an auth bypass in Supabase mode. |
| `/{locale}/{module}` | Active tenant membership | Covers dashboard modules such as customers, products, orders, production, inventory, machines, maintenance, marketing, and settings. |
| `/{locale}/inventory/{section}` | Active tenant membership | Protected localized operational route. |
| `/{locale}/products/{section}` | Active tenant membership | Protected localized operational route. |
| `/{locale}/quotations*` | Active tenant membership | Protected localized quotation/customizer routes. |
| `/{locale}/jobs/{orderId}` | Active tenant membership | Protected localized job route. |
| `/{locale}/leadops*` | Active tenant membership | Protected LeadOps pages and campaign pages. |
| `/api/demo/*` | Active tenant membership in Supabase mode | Non-public API route, blocked by proxy without active membership. |
| `/api/leadops/*` | Active tenant membership in Supabase mode | Non-public API route, blocked by proxy without active membership. |
| `/api/outreach/messages/{messageId}/send` | Active tenant membership plus route logic | Non-public API route; real sending remains controlled by delivery flags. |
| `/api/outreach/send-jobs/*` | Active tenant membership plus send-job route logic | Non-public API route; actor context must derive tenant/role from trusted auth context. |

## Security Findings

- No protected localized page is classified as public except login, access-state, and unsubscribe pages.
- Non-public API routes require active membership in Supabase mode.
- Webhook and unsubscribe routes remain reachable because they use independent provider/token authentication.
- Current route protection is active-membership gating, not fine-grained per-module permission enforcement.
- Browser-provided tenant, role, membership, or permission values are not trusted for proxy access.
