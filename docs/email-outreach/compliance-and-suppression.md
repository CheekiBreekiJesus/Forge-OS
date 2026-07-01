# Compliance and Suppression

## Suppression model

Tenant-scoped `emailSuppressions` records:

- `normalizedEmail`, `reason`, `source`, optional `campaignId` / `leadId`
- Audit: `createdBy`, `createdAt`, `removedBy`, `removedAt`, `removalReason`

### Supported reasons (manual MVP)

`manual`, `unsubscribe`, `invalid_address`, `duplicate`, `legal_request`, `other`

Provider-driven `hard_bounce` and `complaint` types exist for future webhook ingestion.

## Enforcement

Creating suppression immediately:

- Blocks approval, external compose, and manual sent confirmation
- Sets matching campaign recipients to `SUPPRESSED`
- Invalidates existing approvals

## Removal rules

- `unsubscribe` and `legal_request` require elevated permission, confirmation, and documented removal reason.
- No bulk unsuppress without explicit review.

## Privacy

- Private imports must not enter Git.
- CSV exports escape formula injection (`=`, `+`, `-`, `@` prefixed cells).
- Suppression data is not included in default campaign review export.
- Logs and QA reports must not contain full private datasets.

## Record correction and deletion

- Organization/contact correction via lead record service (audit events).
- Delete with sent history anonymizes campaign snapshots instead of silent history loss.
- Archive/inactivate available where hard delete is unsafe.

## Backup

Suppressions are included in backup v5 and restored with integrity validation.
