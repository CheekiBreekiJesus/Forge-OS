# Marketing Data Safety

Date: 2026-07-01

## Privacy Rules

Marketing Studio must not commit or expose:

- Real customer lists.
- Contact details.
- Supplier records.
- Private pricing.
- Confidential product files.
- Provider credentials.
- OAuth tokens.
- Generated assets containing private customer data.

## Current Safeguards

- The foundation uses local IndexedDB persistence.
- Provider implementations are deterministic mocks.
- Live ad publishing is disabled.
- Paid image and video generation are not implemented.
- Tests use synthetic records only.
- Export packages are local browser downloads.

## Remaining Security Work

Before production:

- Add authenticated tenant resolution.
- Enforce tenant boundaries server-side.
- Add role-based approval and publishing permissions.
- Store provider credentials in an encrypted server-side secret store.
- Add audit logs for generation, approval, export, and publishing.
- Add data retention and deletion workflows.

## AI Safety

AI or image providers must receive only the minimum necessary data. Any future provider adapter should strip private notes, internal IDs, contact details, pricing, and confidential operational data unless explicitly required and approved.
