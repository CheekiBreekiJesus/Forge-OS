# Customer PC local architecture

ForgeOS on the JH Gomes customer computer runs as a **local browser application** served from the same Windows machine. No cloud deployment or public internet exposure is required for normal operation.

## Components

```text
┌─────────────────────────────────────────────────────────────┐
│ Windows PC (JH Gomes)                                       │
│                                                             │
│  PowerShell scripts (scripts/customer-pc/)                  │
│    Setup → npm ci, .env.local from customer template        │
│    Start → Next.js on localhost:3000                        │
│    Stop  → saved PID only                                   │
│                                                             │
│  Next.js application                                        │
│    Mode A: npm run dev (development testing)                │
│    Mode B: npm run build + npm run start (local production) │
│                                                             │
│  Browser (Edge/Chrome)                                      │
│    http://localhost:3000                                    │
│    IndexedDB (Dexie) — tenant operational data                │
└─────────────────────────────────────────────────────────────┘
```

## Network binding

- Host: `localhost` only (`-H localhost`)
- Port: `3000` (`-p 3000`)
- URL: `http://localhost:3000` (stable; do not alternate with `127.0.0.1`)
- No firewall rules, port forwarding, or tunnels are created by ForgeOS scripts.

## Runtime modes

| Mode | Script | Use case |
|------|--------|----------|
| Development testing | `Start-ForgeOS-Dev.ps1` | Active debugging, hot reload |
| Local production-like | `Start-ForgeOS-Local.ps1` | Demonstrations and daily use |

Both modes use the same `.env.local` database name variables.

## Local state

| Artifact | Location | Git tracked |
|----------|----------|-------------|
| Environment | `.env.local` | No |
| Runtime logs | `.customer-pc/logs/` | No |
| Server PID | `.customer-pc/runtime/*.pid` | No |
| Application data | Browser IndexedDB | No |
| JSON backups | User downloads folder | No |

## Health endpoint

`GET /api/health/local` returns non-sensitive readiness metadata used by start scripts before opening the browser.

## Data safety rules

1. Data is tied to the browser profile and origin `http://localhost:3000`.
2. `FORGEOS_LOCAL_DB_NAME` and `NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME` must match.
3. Do not use private browsing.
4. Do not clear site data for `localhost:3000`.
5. Export JSON backup before source upgrades.
6. Use ForgeOS Settings → Backup for export/import; do not copy IndexedDB files manually.

## Out of scope

- Outlook local send (disabled by default in customer template)
- Brevo live delivery (disabled by default)
- Production Supabase (disabled unless explicitly configured)
- Docker, WSL, or cloud hosting
