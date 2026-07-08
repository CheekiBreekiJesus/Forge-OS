# Customer PC installation

Installation guide for ForgeOS on a Windows customer computer (JH Gomes).

## Prerequisites

- Windows 10 or later
- Node.js 20 LTS or 22 LTS ([https://nodejs.org/](https://nodejs.org/))
- Git (optional if copying a ZIP instead of cloning)
- A modern browser (Microsoft Edge or Google Chrome)
- No administrator rights required for normal setup

## 1. Copy ForgeOS to the computer

Either:

- Clone the repository branch `deploy/jh-gomes-local` after integration (or the branch your operator provides), or
- Copy the ForgeOS folder from removable media / network share

Place the folder in a path without special restrictions, for example:

`C:\ForgeOS`

Paths with spaces are supported.

## 2. First-time setup

Open **Windows Terminal** or **PowerShell** in the ForgeOS folder, then run:

```powershell
.\scripts\customer-pc\Setup-ForgeOS.ps1
```

Setup will:

1. Verify Node.js and npm
2. Create `.customer-pc/logs` and runtime directories
3. Create `.env.local` from `.env.customer.local.example` **only if** `.env.local` does not exist
4. Run `npm ci` to install dependencies
5. Run the **first production build** (stored for faster daily startup)

**Important:** If `.env.local` already exists, setup preserves it.

## 3. Start ForgeOS (normal use)

Double-click:

`scripts\customer-pc\Start-ForgeOS-Local.cmd`

Or run:

```powershell
.\scripts\customer-pc\Start-ForgeOS-Local.ps1
```

Daily startup **reuses** the existing production build when it matches the current commit. To force a rebuild:

```powershell
.\scripts\customer-pc\Start-ForgeOS-Local.ps1 -Rebuild
```

Wait until the terminal reports that ForgeOS is ready. The browser opens automatically at:

**http://localhost:3000**

Keep the terminal window open while using ForgeOS.

## 4. Development testing (optional)

For hot-reload development testing:

```powershell
.\scripts\customer-pc\Start-ForgeOS-Dev.ps1
```

Development mode does not change the production build reuse behaviour for local production starts.

## 5. Stop ForgeOS

Before shutting down the PC or updating source:

```powershell
.\scripts\customer-pc\Stop-ForgeOS.ps1
```

`Stop-ForgeOS.ps1` verifies ForgeOS process identity (PID, start time, Node executable, Next.js CLI path, repository path, and port owner) before terminating a process. It **never** stops unrelated Node processes.

Or double-click `scripts\customer-pc\Stop-ForgeOS.cmd`.

## 6. Optional desktop shortcuts

```powershell
.\scripts\customer-pc\Create-ForgeOS-Shortcuts.ps1
```

Creates Start, Stop, and Open shortcuts on the current user's desktop.

## 7. IndexedDB and browser rules

- Always use **http://localhost:3000** (not `127.0.0.1`)
- Do not use Incognito/InPrivate mode
- Do not clear browser site data for localhost
- Database name is configured in `.env.local` (`forgeos:jhgomes:local` by default in customer template)

## 8. Backup before changes

In ForgeOS: **Settings → Backup → Export JSON backup**

Store the downloaded file safely before updates or major changes.

## 9. Update branch configuration

Customer updates use `FORGEOS_UPDATE_BRANCH` from `.env.local` (default in template: `deploy/jh-gomes-local`). The update script displays the configured branch and refuses blank values. Development testing may pass `-Branch` explicitly to `Update-ForgeOS.ps1`.

## Related documents

- [JH Gomes quick start (PT)](jh-gomes-local-quick-start-pt.md)
- [JH Gomes troubleshooting (PT)](jh-gomes-local-troubleshooting-pt.md)
- [Update and rollback](customer-pc-update-and-rollback.md)
- [Architecture](customer-pc-local-architecture.md)
