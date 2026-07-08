# Customer PC runtime baseline

Captured during `feat/customer-pc-local-runtime` implementation.

**Starting commit:** `83209dd` (`docs(outreach): document sender and salutation behavior`)  
**Worktree:** `Forge-OS-local-runtime`  
**Branch:** `feat/customer-pc-local-runtime`

## Runtime toolchain

| Item | Value |
|------|-------|
| Node.js (supported majors) | 20, 22 |
| Node.js (capture host) | v25.1.0 |
| Package manager | npm (lockfile: `package-lock.json`) |
| Framework | Next.js 16.2.9 |

## Commands (repository defaults)

| Purpose | Command |
|---------|---------|
| Development server | `npm run dev` |
| Production build | `npm run build` |
| Production server | `npm run start` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm test` |
| E2E | `npm run test:e2e` |
| Acceptance | `npm run test:acceptance` |
| Full validate | `npm run validate` |
| Agent health | `npm run agent:health` |

Customer PC scripts wrap these commands and bind to `localhost:3000` only.

## Environment validation

- Primary customer template: `.env.customer.local.example`
- Setup copies template to `.env.local` only when `.env.local` is absent.
- Existing `.env.local` is never overwritten.
- Main schema reference: `.env.example`
- No dedicated `validateEnv` module; feature modules read env at runtime.

## Local database naming

| Source | Name |
|--------|------|
| Code default (`src/domain/constants.ts`) | `forgeos:jhgomes:development` |
| Customer PC template (`.env.customer.local.example`) | `forgeos:jhgomes:local` |
| E2E acceptance (`.env.test.example`) | `forgeos:e2e:acceptance` |

Customer PC scripts require `FORGEOS_LOCAL_DB_NAME` and `NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME` to match in `.env.local`.

## Backup and restore UI

- Location: Settings → Backup section (`src/components/settings-shell.tsx`)
- Export: JSON backup download (`exportBackup`)
- Import: JSON backup restore with validation (`validateBackup`)
- Backup format version: v8+ (includes outreach mapping profiles)

## Health checks

| Check | Path / command |
|-------|----------------|
| Local runtime health endpoint | `GET /api/health/local` |
| Agent orchestrator health | `npm run agent:health` → `qa/reports/latest-health.json` |

## Browser storage assumptions

- Persistence: IndexedDB via Dexie (`src/persistence/db.ts`)
- Database name from `LOCAL_DB_NAME` constant (env override supported)
- Origin-sensitive: data is tied to exact browser origin
- Stable customer origin: `http://localhost:3000`
- Do not mix `localhost` and `127.0.0.1`
- Do not use Incognito/InPrivate for normal operation
- Clearing site data deletes local ForgeOS data
- Source updates do not normally delete IndexedDB; migrations should be tested before upgrades

## Baseline validation results (pre-change)

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (12 warnings, 0 errors) |
| `npm run typecheck` | Pass |
| `npm test` | Pass (52 files, 244 tests) |
| `npm run build` | Pass |

## Windows compatibility risks

| Risk | Mitigation |
|------|------------|
| Port 3000 occupied by another app | Start scripts detect owner and refuse to start |
| Node not on PATH | Setup/start scripts verify Node and npm |
| Unsupported Node major | Scripts allow majors 20 and 22 only |
| PowerShell execution policy | `.cmd` wrappers use `-ExecutionPolicy Bypass` |
| Paths with spaces | Repo root resolved dynamically from script location |
| Accidental broad `node.exe` kill | Stop script terminates only saved ForgeOS PID |
| `.env.local` loss on update | Update script never deletes `.env.local` |
| Browser origin drift | Documentation and scripts enforce `http://localhost:3000` |
