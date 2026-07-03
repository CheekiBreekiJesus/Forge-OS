# Customer PC update and rollback

## Before updating

1. **Export a ForgeOS backup**  
   In the app: Settings → Backup → Export JSON backup.

2. **Stop ForgeOS**  
   Run `scripts\customer-pc\Stop-ForgeOS.ps1` or `Stop-ForgeOS.cmd`.

3. Confirm no local source edits are pending (for Git-based installs).

## Update procedure

Run from the ForgeOS folder:

```powershell
.\scripts\customer-pc\Update-ForgeOS.ps1
```

Optional branch parameter (default: `feat/customer-pc-local-runtime`):

```powershell
.\scripts\customer-pc\Update-ForgeOS.ps1 -Branch feat/customer-pc-local-runtime
```

The update script will:

1. Refuse to run if the working tree has uncommitted changes
2. Show the current commit and incoming commits
3. Require typing `YES` to continue
4. Remind you to export a backup
5. Stop the local server safely
6. `git fetch` and **fast-forward only** merge
7. Run `npm ci`
8. Run `npm run build`
9. Print rollback instructions

### What is preserved

- `.env.local`
- `.customer-pc/logs/`
- Browser IndexedDB data (unless migrations fail or site data is cleared)

### What is not done automatically

- No `git reset --hard`
- No browser storage reset
- No deletion of `.env.local`

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
