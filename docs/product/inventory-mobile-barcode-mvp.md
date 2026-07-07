# Inventory mobile barcode MVP

## Scope implemented

This milestone delivers a narrow vertical slice for JH Gomes warehouse operators:

- Desktop inventory workspace summary (active items, low-stock count, reorder status, recent movements)
- Smartphone route at `/[locale]/inventory/scan`
- Camera scanning when the browser exposes `BarcodeDetector` in a secure context
- Manual barcode entry and USB keyboard-wedge scanner support
- Stock receipt, consumption, and adjustment through the existing IndexedDB `InventoryRepository`
- Movement history per item
- Unknown barcode handling without auto-creating items or permanent mappings

## Barcode resolution (MVP fallback)

A durable barcode registry exists in the in-memory inventory-product preview (`resolveBarcode` in `src/features/inventory-product/ledger.ts`) but is **not persisted** in Dexie.

For this MVP:

- Internal barcode value = inventory item `sku` (string, leading zeroes preserved)
- Resolver interface: `src/features/inventory-mobile/barcode-resolver.ts`
- Implementation: `createSkuBarcodeResolver` — tenant-scoped, active items only
- Supplier/packaging barcode mappings are **deferred**

Replace the resolver implementation when a persisted barcode registry ships; UI and transaction flows should remain stable.

## Smartphone route

| Locale | Path |
|--------|------|
| Portuguese | `/pt-PT/inventory/scan` |
| English | `/en/inventory/scan` |

Entry points:

- Desktop inventory header button **Mobile scanner** / **Leitor móvel**
- Mobile inventory summary card

## Secure context requirement

`navigator.mediaDevices.getUserMedia` requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS or `localhost`).

When ForgeOS is opened over an insecure LAN HTTP URL on a phone, the scanner shows an explicit message and keeps manual entry available. Real smartphone camera validation should use HTTPS (or localhost during development).

## Camera privacy

- No camera frames, photos, or scan results are sent to external services
- No image upload for recognition
- Media tracks stop when: scan succeeds, operator stops camera, component unmounts, or navigation occurs
- Duplicate frame detections are suppressed with a short cooldown; posting requires explicit quantity/type confirmation

## Supported barcode formats (native `BarcodeDetector`)

When available: Code 128, Code 39, Code 93, EAN-13, EAN-8, UPC-A, UPC-E, ITF, Codabar, QR Code, Data Matrix.

No additional scanner npm dependency was added; manual entry covers unsupported browsers.

## Stock operations

All mutations use existing repository methods:

| UI action | Repository method |
|-----------|-------------------|
| Receipt | `recordReceipt` |
| Consumption | `recordConsumption` |
| Adjustment | `adjustStock` |

Adjustment UI supports:

- **Add/subtract quantity** — signed delta passed to `adjustStock`
- **Set balance to** — delta computed as `target - currentQuantity`

Negative stock is blocked unless the repository receives `allowNegative: true` (not exposed in this MVP).

## Unknown barcode workflow

1. Show scanned value
2. Offer rescan and manual inventory search
3. Allow selecting an existing item for the current session only
4. Display note that permanent registration requires authorised review
5. Do **not** auto-create items or persist barcode mappings

## Data preservation

- Demo seed items are inserted only when the tenant has **zero** inventory rows (`seedOperationsDefaults`)
- Existing user inventory data is not overwritten on startup
- Stock balance changes go through repository movement logic (atomic item + movement write)

## Deferred features

- Supplier barcode registry (persisted)
- Package-level barcode hierarchy
- GS1 parsing
- Offline command queue and conflict resolution (Milestone 3)
- Direct label printer integration
- Supabase / mobile synchronisation

## Local validation

```powershell
Set-Location "C:\Users\J35U5\Desktop\VS Code\Forge-OS-inventory-mobile"
npm run lint
npm run typecheck
npm test
npm run build
.\node_modules\.bin\next.cmd dev --hostname 0.0.0.0 --port 3011
```

Manual checks in Chrome:

- `/pt-PT/inventory`, `/en/inventory`
- `/pt-PT/inventory/scan`, `/en/inventory/scan`

## Tests

- `src/features/inventory-mobile/*.test.ts` — resolver, transactions, cooldown, copy, camera utilities
- `e2e/inventory-mobile-scan.spec.ts` — manual entry flow (no real camera)
