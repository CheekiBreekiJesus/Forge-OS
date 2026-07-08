# Event Reconciliation

ForgeOS normalizes provider events before applying effects.

## Event Model

Local demo table:

- `outreachProviderEvents`

Durable server table:

- `outreach_provider_events`

Each event stores provider, provider event ID when present, deterministic fingerprint, provider message ID, normalized event type, occurred/received timestamps, safe outreach references, sanitized metadata, processing status, effect, and duplicate flag.

## Mapping

| Provider event | Normalized event | Effect |
|---|---|---|
| delivered | `delivered` | Mark recipient delivered |
| soft_bounce | `soft_bounce` | Mark temporary delivery issue |
| hard_bounce | `hard_bounce` | Suppress as hard bounce |
| invalid_email | `invalid_email` | Suppress as hard bounce |
| spam / complaint | `complaint` | Suppress as complaint |
| unsubscribed / unsubscribe | `unsubscribe` | Suppress as unsubscribe |
| error / blocked | `failed` / `blocked` | Mark failed |
| deferred | `deferred` | Mark deferred |
| opened / click | `opened` / `clicked` | Record only |
| unknown | `unknown` | Store as ignored/unmatched |

## Precedence

Terminal suppression outcomes win:

1. complaint;
2. unsubscribe;
3. hard bounce / invalid email;
4. explicit suppression;
5. manual sent state.

Later lower-priority events such as delivered or deferred do not reverse terminal suppression states.

## Idempotency

Events are deduplicated by SHA-256 fingerprint built from provider, provider event ID, provider message ID, event type, normalized email, and occurred time. Duplicate webhook deliveries are stored as duplicate records locally without repeating recipient updates or suppression effects.
