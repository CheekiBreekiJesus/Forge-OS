# Send Job Server Mutations

Date: 2026-07-03
Status: Step 7D1 production auth adapter and hosted repository bundle added; staging DB validation pending

## Routes

The following Next.js route handlers exist under `/api/outreach/send-jobs`:

- `POST /queue`
- `POST /process`
- `POST /pause`
- `POST /resume`
- `POST /cancel`
- `POST /retry`
- `POST /status`
- `POST /prepare-campaign`

Each route uses the shared server wrapper in `src/app/api/outreach/send-jobs/_shared.ts` and the mutation service in `src/application/send-job-server-mutations.ts`.

## Trusted Context

Routes derive actor and tenant from `resolveTrustedSendJobActorContext`. In development/test this uses explicit trusted headers:

- `x-forgeos-actor-id`
- `x-forgeos-tenant-id`
- `x-forgeos-roles`
- `x-forgeos-correlation-id`

In production, routes require a Supabase Auth bearer token. The server validates the token, loads active tenant membership, and derives tenant, roles, and permissions from hosted persistence. Request bodies must not supply tenant, actor, role, permissions, recipient lists, or approved email content.

## Validation

Inputs are parsed through explicit allowlists. Unknown fields are rejected. Step 7C only accepts durable simulation mode:

- `provider: "simulation"`
- `deliveryMode: "simulation"`
- `confirmation: "QUEUE SIMULATION"`

Brevo campaign batch sending remains disabled.

## State Transitions

- Queue requires an approved, eligible campaign and no duplicate active job.
- Process accepts only `QUEUED` or `PROCESSING`.
- Pause accepts only `QUEUED` or `PROCESSING`.
- Resume accepts only `PAUSED`.
- Cancel rejects terminal jobs and preserves sent history.
- Retry accepts only transient retry-eligible failures.

## Status Response

The status route returns sanitized operational fields only:

- job and campaign IDs;
- status, provider, delivery mode;
- counters and limits;
- timestamps;
- summarized lock state;
- recipient status counts;
- recent sanitized errors.

It does not return API keys, authorization headers, raw provider payloads, private email bodies, or service-role data.

## Hosted Runtime

The default runtime dependency provider now uses the hosted send-job repository bundle when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured. Without those values, it still returns `503 server_persistence_unavailable`.

Hosted execution remains simulation-only. Brevo campaign batch delivery is still rejected by request parsing and provider configuration.

`/prepare-campaign` is a preparation boundary only. It accepts an approved campaign snapshot, rechecks tenant ownership and approval hashes server-side, and writes the hosted projection. It does not queue, process, or send email.
