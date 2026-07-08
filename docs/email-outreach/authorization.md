# Email Outreach Authorization

Date: 2026-07-03

## Permissions

Step 7C defines explicit server permissions:

- `send_job:view`
- `send_job:view_errors`
- `send_job:queue`
- `send_job:process`
- `send_job:pause`
- `send_job:resume`
- `send_job:cancel`
- `send_job:retry`

## Role Mapping

Authorized operational roles:

- `super_admin`: all send-job permissions
- `company_owner`: all send-job permissions
- `marketing_manager`: all send-job permissions
- `outreach_operator`: operational send-job permissions
- `sales`: view, queue, process, pause, resume
- `owner`: compatibility alias with all permissions
- `viewer`: view only

Not every authenticated user is authorized by default.

## Tenant Rule

Server mutations use the tenant from trusted actor context. The browser cannot choose or override tenant identity in the request body.

## Production Auth Gap

ForgeOS still needs a production auth provider and tenant membership model before hosted send-job routes can be enabled. The development/test header adapter is not a production security mechanism.
