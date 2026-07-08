# Inventory mobile barcode MVP

## Architecture

### 1. Reused branch code

Cherry-picked from `6a99030` and adapted to Inventory Foundation on `main`:

- `inventory-barcode-scanner.tsx` — native `BarcodeDetector` camera loop, manual entry, torch, device picker
- `camera-context.ts` — secure-context checks, `getUserMedia`, detection helpers
- `scan-cooldown.ts` — duplicate frame suppression
- `inventory/scan` route and mobile-first shell layout
- `e2e/inventory-mobile-scan.spec.ts` structure

### 2. Scanner library

No additional npm dependency. Uses the browser-native [`BarcodeDetector`](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) API when available in a secure context. Manual entry and USB keyboard-wedge scanners remain the fallback.

### 3. Camera permission flow

1. Operator taps **Start camera**
2. `isSecureCameraContext()` gates insecure HTTP LAN access
3. `isBarcodeDetectorSupported()` gates unsupported browsers
4. `requestCameraStream()` calls `getUserMedia`
5. `NotAllowedError` → permission-denied state with manual entry
6. `NotFoundError` → no-camera state
7. Tracks stop on detect, stop button, unmount, or navigation

### 4. Offline queue design

Limited MVP queue in `localStorage` (`forgeos:inventory-mobile:queue:{tenantId}`):

- Stores confirmed movements only (after operator confirmation)
- Each entry carries the movement payload and `idempotencyKey`
- Pending / failed states are visible in `PendingSyncIndicator`
- `online` event and initial load trigger `syncQueue()`
- Failures remain visible with last error text

### 5. Idempotency strategy

- Client generates `mobile:{uuid}` keys per confirmed movement
- `InventoryProductRepository.postTransaction` deduplicates on `(tenantId, idempotencyKey)`
- Queued offline movements reuse the same key on retry
- UI disables duplicate submission while `submitting` is true

### 6. Inventory API dependencies

All stock changes use Inventory Foundation repositories — no second ledger:

| Mobile action | Repository method | Foundation builder |
|---------------|-------------------|--------------------|
| Receive | `receiveStock` | `buildReceiptTransaction` |
| Issue | `issueStock` | `buildIssueTransaction` |
| Transfer | `transferStock` | `buildTransferTransaction` |
| Lookup | read-only snapshot | — |

Barcode resolution uses persisted `BarcodeRecord` rows via `resolveBarcode()` in `inventory-product/ledger.ts`.

Permissions use `assertInventoryPermission()` with preview-role mapping (`receive`, `adjust` for issue, `transfer`, `manage_products` for barcode linking).

### 7. UI components

| Component | Purpose |
|-----------|---------|
| `inventory-scan-shell.tsx` | Route orchestration |
| `inventory-barcode-scanner.tsx` | Camera + manual entry |
| `inventory-item-stock-panel.tsx` | Item card, actions, quantity, locations, confirm |
| `inventory-unknown-barcode-panel.tsx` | Unknown code, session pick, authorised link |
| `pending-sync-indicator.tsx` | Offline queue + failures |
| `inventory-movement-history.tsx` | Item summary + recent transactions |

Entry points: `/[locale]/inventory/scan`, legacy `/[locale]/inventory` header link, inventory workspace header link.

### 8. Testing strategy

- Unit: resolver, movement service, offline queue, permissions, idempotency, cooldown, copy
- Integration: IndexedDB inventory foundation posting via `movement-service.test.ts`
- E2E: Playwright mobile viewport manual-entry flows (no real camera)
- CI: `npm run typecheck`, `npm run lint`, `npm run build`, targeted vitest, Playwright spec

## Supported barcode formats

When `BarcodeDetector` is available: Code 128, Code 39, Code 93, EAN-13, EAN-8, UPC-A, UPC-E, ITF, Codabar, QR Code, Data Matrix.

## Demo barcodes

| Barcode | Item |
|---------|------|
| `05601234001005` | Clear cup 330 ml blank |
| `0001234567890` | Clear cup 330 ml blank (supplier alias) |

## Deferred

- Full offline cache of all items/locations
- Conflict resolution across devices
- Supabase-hosted mobile API routes (local IndexedDB MVP uses repository permission checks)
- GS1 parsing, label printing from scanner

## Local validation

```powershell
Set-Location "C:\Users\J35U5\Desktop\VS Code\Forge-OS-inventory-mobile"
npm run typecheck
npm test -- src/features/inventory-mobile
npm run lint
npm run build
npx playwright test e2e/inventory-mobile-scan.spec.ts
```

Manual checks:

- `/pt-PT/inventory/scan`, `/en/inventory/scan`
- `/pt-PT/inventory` → **Leitor móvel** link
