# ForgeOS — Edge Cases Analysis (MVP)

## Multi-Tenant

| Scenario | Expected behavior |
|----------|-------------------|
| User belongs to multiple tenants | Tenant selector switches JWT claim or session context; full data reload |
| JWT missing `tenant_id` | 403; redirect to tenant onboarding |
| API request with another tenant's resource ID | 404 (do not leak existence) |
| Platform admin cross-tenant | Separate `apps/admin` role; explicit audit log |

## i18n

| Scenario | Expected behavior |
|----------|-------------------|
| Missing translation key | Fallback to `en`, log warning in dev |
| User switches language mid-session | Copilot continues in new locale; dates/numbers reformat immediately |
| DB entity has no translation for locale | Fall back to English canonical field |
| Mixed-language user input to Copilot | Detect language; respond in UI locale unless user overrides |

## Dashboard

| Scenario | Expected behavior |
|----------|-------------------|
| No data for date range | Empty states with i18n keys, not blank widgets |
| OEE division by zero | Show `—` or 0% with tooltip |
| Negative stock (data error) | Show alert styling; flag for admin |
| Widget hidden by user | Skip fetch for that widget where possible |
| Slow API | Skeleton loaders per widget; independent error boundaries |

## Inventory

| Scenario | Expected behavior |
|----------|-------------------|
| Concurrent movements | Optimistic locking or DB constraint; retry |
| Movement without sufficient stock | 422 VALIDATION_ERROR |
| Immutable ledger | No UPDATE/DELETE on `inventory_movements` |

## Production

| Scenario | Expected behavior |
|----------|-------------------|
| `quantity_completed` > `quantity` | Cap at 100% progress; validation warning |
| Overdue order (past planned_end) | Dashboard highlights in danger color |

## Auth & RBAC

| Scenario | Expected behavior |
|----------|-------------------|
| Warehouse operator opens CRM | 403 or hidden nav item |
| Session expired mid-action | Redirect to login; preserve return URL |
| Offline warehouse (future mobile) | Queue movements; sync conflict resolution UI |

## AI Copilot

| Scenario | Expected behavior |
|----------|-------------------|
| Tool call fails | Localized error in chat; no hallucinated data |
| User asks in Spanish, tenant default pt-PT | Respond in Spanish if detected; respect explicit UI locale |
| Prompt injection | System prompt hardening; tools only via allowlist |
| Rate limit OpenAI | Graceful degradation message |

## Formatting

| Scenario | Expected behavior |
|----------|-------------------|
| pt-PT currency | `€124.850,00` or `124 850 €` per locale config |
| en-US vs en-GB | Use `en` catalog; tenant can set `number_format` in settings later |
