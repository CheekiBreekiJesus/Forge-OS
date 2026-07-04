# Cup Customizer — Artwork

## Supported formats

| Format | Support |
|--------|---------|
| PNG | Yes |
| JPEG | Yes |
| WebP | Yes |
| GIF | Yes |
| SVG | Only when passing `validateLocalAsset` safety checks |

## Limits

- Max file size: 2 MB
- MIME validation on upload
- Reject executable or unsafe types

## Storage

- Uploaded files stored as tenant-scoped `LocalAsset` records in IndexedDB
- Not committed to git
- Not uploaded externally unless a future cloud asset feature is explicitly enabled

## Transforms (persisted on simulation)

- `artworkScale` (0.5–1.6)
- `artworkOffsetX` / `artworkOffsetY` (-20–20 %)
- `artworkRotation` (-30–30 deg)
- `artworkPosition` (left / center / right)

## SVG safety

SVG uploads must pass the shared local asset validator. Raw unsanitized SVG must never be injected into the DOM.

## Replace / remove

- Upload again to replace (previous owned asset deleted)
- Reset view restores default transforms (does not delete asset)
