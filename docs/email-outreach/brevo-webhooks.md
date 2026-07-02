# Brevo Webhooks

Date checked: 2026-07-02

Official documentation reviewed:

- https://developers.brevo.com/docs/transactional-webhooks
- https://developers.brevo.com/docs/send-a-transactional-email
- https://developers.brevo.com/docs/how-to-use-webhooks
- https://developers.brevo.com/docs/secured-webhooks
- https://developers.brevo.com/docs/retry-mechanism
- https://developers.brevo.com/reference/get-transac-blocked-contacts

## Supported Events

Brevo transactional email webhooks document these relevant events:

- sent/request;
- delivered;
- soft bounce;
- hard bounce;
- spam/complaint;
- unsubscribed;
- deferred;
- invalid email;
- blocked;
- error;
- opened/clicked events.

Open and click events are parsed as low-priority events and do not drive suppression.

## Payload Fields Used

ForgeOS currently uses:

- `event`
- `email`
- `id`
- `message-id`
- `messageId`
- `ts_event`
- `ts_epoch`
- `ts`
- `date`
- `reason`
- `tag`
- `tags`

Subject is reduced to `subjectPresent`; raw subject is not persisted.

## Webhook Protection

Brevo documents secure webhook calls through allowlisted IPs, username/password authentication, bearer token authorization, and Cloudflare header authorization. ForgeOS implements:

- bearer token in `Authorization: Bearer <BREVO_WEBHOOK_SECRET>`;
- Basic auth password fallback;
- `x-forgeos-webhook-secret` fallback for controlled tests;
- JSON-only content type;
- 64 KB request body cap;
- sanitized metadata storage.

No official transactional webhook signing scheme was found in the reviewed Brevo docs. ForgeOS therefore does not claim cryptographic signature verification for Brevo transactional webhooks. Compensating controls are shared-secret authentication, HTTPS deployment, strict parsing, small payload limit, idempotent event fingerprints, and sanitized logging/storage.

## Retry Behavior

Brevo documents an original webhook attempt plus four retries. Retry delays are 10 minutes, 1 hour, 2 hours, and 8 hours. Brevo documentation says most `4xx` responses except `429`, and `5xx` responses, stop retries and discard the webhook.

## Webhook URL

Configure the transactional webhook notify URL as:

`https://<production-host>/api/outreach/brevo/webhook`

Select transactional events: sent, delivered, soft bounce, hard bounce, spam, unsubscribed, deferred, invalid email, blocked, and error.
