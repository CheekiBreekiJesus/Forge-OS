# Customer PC local architecture

ForgeOS on the JH Gomes customer computer runs as a **local browser application** served from the same Windows machine. No cloud deployment or public internet exposure is required for normal operation.

## Components

```text
┌─────────────────────────────────────────────────────────────┐
│ Windows PC (JH Gomes)                                       │
│                                                             │
│  PowerShell scripts (scripts/customer-pc/)                  │
│    Setup → npm ci, first build, .env.local from template  │
│    Start → reuse build when current; optional -Rebuild      │
│    Stop  → verified ForgeOS process identity only           │
│    Update → configured branch (deploy/jh-gomes-local)       │
│                                                             │
│  Next.js application                                        │
│    Mode A: npm run dev (development testing)                │
│    Mode B: npm run build + npm run start (local production) │
│                                                             │
│  Browser (Edge/Chrome)                                      │
│    http://localhost:3000                                    │
│    IndexedDB (Dexie) — tenant operational data              │
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
| Runtime metadata | `.customer-pc/runtime/*.runtime.json` | No |
| Production build manifest | `.customer-pc/runtime/production-build.json` | No |
| Last update branch | `.customer-pc/runtime/last-update-branch.txt` | No |
| Application data | Browser IndexedDB | No |
| JSON backups | User downloads folder | No |

## Runtime metadata (process identity)

Each running server writes structured metadata (not a bare PID) including:

- PID, mode, repository root, Node executable path
- Next.js CLI command-line signature
- Expected port, process start time, ForgeOS commit

`Stop-ForgeOS.ps1` verifies all fields before termination. If metadata is stale or a PID was reused by an unrelated process, ForgeOS refuses to stop the process and prints port-conflict diagnostics.

## Production build reuse

| Event | Build behaviour |
|-------|-----------------|
| `Setup-ForgeOS.ps1` | Runs first `npm run build` |
| `Update-ForgeOS.ps1` | Runs `npm run build` after update |
| Daily `Start-ForgeOS-Local.ps1` | Reuses `.next` when manifest matches current commit |
| `Start-ForgeOS-Local.ps1 -Rebuild` | Forces rebuild |

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

- Outlook live send (disabled by default: `OUTLOOK_GRAPH_ENABLED=false`, `OUTLOOK_LIVE_SEND_ENABLED=false`)
- Brevo live delivery (disabled by default)
- Production Supabase (disabled unless explicitly configured)
- Docker, WSL, or cloud hosting

## E2E test isolation

Developer E2E tests use isolated port `3012` with `pretest:e2e` (`scripts/qa/resolve-e2e-port.ps1`) that stops only a prior ForgeOS E2E server from this repository on that port. Unrelated processes are never terminated automatically.
