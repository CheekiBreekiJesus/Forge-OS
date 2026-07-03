# Outlook token storage (local MVP)

## Principles

- OAuth tokens **never** reach browser storage (localStorage, IndexedDB, Dexie, React persistence).
- Tokens **never** appear in URLs after callback processing.
- Tokens **never** logged.
- No client secret in the browser (PKCE public client).

## Cache location

```
%LOCALAPPDATA%\ForgeOS\auth\outlook-token-cache.enc
```

## Encryption

- Algorithm: **AES-256-GCM**
- Key: `FORGEOS_LOCAL_ENCRYPTION_KEY` (32+ characters, machine-local, not committed)
- Envelope: `{ version, iv, authTag, ciphertext }`

If encryption key is missing, tokens fall back to **in-memory only** (reconnect after restart required).

## OAuth pending state

PKCE verifier and OAuth `state` live in a **server memory map** (10-minute TTL). Not written to disk.

## Disconnect

`POST /api/integrations/outlook/disconnect` deletes the encrypted cache file and clears memory fallback.

## Audit exclusions

Never audit: access tokens, refresh tokens, authorization codes, PKCE verifiers, encryption keys, full message bodies.
