# Cup Customizer — Marketing visualization assets

## Guardar visualização

Saves the current design preview or realistic mockup as a tenant-scoped `LocalAsset` and records metadata in the meta table:

- Key prefix: `cup-customizer:marketing-visualization:{simulationId}`
- Links: `customerId`, `leadId`, `simulationId`, `source`, `configurationFingerprint`

## Outreach handoff (future)

Outreach/campaign modules can resolve visuals by `simulationId` using `MARKETING_VISUALIZATION_META_PREFIX` without importing customizer UI.

This task does **not** wire email send or Brevo attachments.

## Export

Local PNG download is not enabled until deterministic raster export is added. SVG blobs are stored locally.
