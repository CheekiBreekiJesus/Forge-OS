# Customer PC update and rollback

## Before updating

1. **Export a ForgeOS backup**  
   In the app: Settings → Backup → Export JSON backup.

2. **Stop ForgeOS**  
   Run `scripts\customer-pc\Stop-ForgeOS.ps1` or `Stop-ForgeOS.cmd`.

3. Confirm no local source edits are pending (for Git-based installs).

## Configured update branch

Customer updates read `FORGEOS_UPDATE_BRANCH` from `.env.local`. The customer template default is:

```env
FORGEOS_UPDATE_BRANCH=deploy/jh-gomes-local
```

The branch `deploy/jh-gomes-local` will be created on the remote after integration. Until then, operators may pass an explicit override for development testing only.

The update script:

- Displays the configured branch clearly
- Rejects blank branch names
- Requires confirmation when the configured branch changes from the last successful update
- Never silently follows the current Git feature branch

## Update procedure

Run from the ForgeOS folder:

```powershell
.\scripts\customer-pc\Update-ForgeOS.ps1
```

Development-only explicit override:

```powershell
.\scripts\customer-pc\Update-ForgeOS.ps1 -Branch feat/customer-pc-local-runtime
```

When the configured branch changes (for example after integration cutover):

```powershell
.\scripts\customer-pc\Update-ForgeOS.ps1 -AllowBranchChange
```

The update script will:

1. Refuse to run if the working tree has uncommitted changes
2. Show the configured update branch and current commit
3. Show incoming commits
4. Require typing `YES` to continue
5. Remind you to export a backup
6. Stop the local server only after verified process identity
7. `git fetch` and **fast-forward only** merge
8. Run `npm ci`
9. Run `npm run build` and record the build manifest
10. Print rollback instructions

### What is preserved

- `.env.local`
- `.customer-pc/logs/`
- Browser IndexedDB data (unless migrations fail or site data is cleared)

### What is not done automatically

- No `git reset --hard`
- No browser storage reset
- No deletion of `.env.local`
- No termination of unrelated processes on port 3000

## After updating

Start ForgeOS again:

```powershell
.\scripts\customer-pc\Start-ForgeOS-Local.ps1
```

Verify the application at http://localhost:3000. If data looks wrong, restore from JSON backup in Settings → Backup → Import.

## Manual rollback

If an update causes problems:

1. Stop ForgeOS (`Stop-ForgeOS.ps1`)
2. Note the prior commit hash printed by the update script (example: `83209dd`)
3. In the ForgeOS folder:

```powershell
git fetch origin
git checkout <prior-commit-hash>
npm ci
npm run build
```

4. Start ForgeOS again
5. If needed, import the JSON backup from Settings

## Database migrations

IndexedDB schema changes may require a one-time migration. Test updates on a copy or export backup first. Source updates do not normally delete IndexedDB, but failed migrations can leave the app in a bad state — restore from backup if that happens.

## Diagnostics after a failed update

```powershell
.\scripts\customer-pc\Collect-ForgeOS-Diagnostics.ps1
```

Send the generated ZIP to the developer (no secrets included).
