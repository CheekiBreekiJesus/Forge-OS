# Troubleshooting

## Import

| Symptom | Check |
|---------|-------|
| Zero rows imported | Mapping, required company/contact columns, file encoding |
| Duplicates skipped | Expected; review duplicate panel |
| Repeat import blocked | Enable allow re-import for same fingerprint |

## Drafts / approval

| Symptom | Check |
|---------|-------|
| Cannot approve | Blockers panel: email, opt-out, sender identity, unresolved `{{vars}}`, suppression |
| Approval disappeared after edit | Expected invalidation; re-approve |
| Bulk approve skipped recipients | Review skipped count and reasons |

## Gmail / Outlook

| Symptom | Check |
|---------|-------|
| Gmail opens sign-in page | Normal when logged out; compose URL is in `continue` param |
| Body truncated in URL | Use copy controls for full plain/formatted body |
| Cannot open compose after sent | Expected; duplicate protection active |

## Suppression

| Symptom | Check |
|---------|-------|
| Recipient blocked unexpectedly | Suppression list; remove only with proper reason |
| Cannot remove unsubscribe | Elevated confirmation required |

## Backup / restore

| Symptom | Check |
|---------|-------|
| Invalid backup | Version 4 or 5 JSON from Settings → Backup |
| Warnings after restore | Review orphaned recipient/suppression report in activity |

## Demo reset vs clear data

- **Reset Demo Data** removes seed demo records only; preserves imported outreach data.
- **Clear All Local Data** wipes IndexedDB; requires strong confirmation; separate action.
