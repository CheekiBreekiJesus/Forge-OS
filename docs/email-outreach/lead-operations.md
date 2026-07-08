# Lead operations (LeadOps table)

## Lead management panel

Path: `/{locale}/leadops` → lead list section.

### Filters (persisted in `localStorage`)

- Search (company, contact, email, region, source, category)
- Category / industry
- Region, country
- Email validity (valid / missing / invalid)
- Suppression (none / unsubscribed / bounced)
- Source database
- Outreach status
- Never contacted
- Language
- Sendability (ready for outreach / blocked)

### Status indicators

Each row exposes:

- Email validity badge
- Suppression state
- Sendability reasons (missing email, invalid, suppressed, duplicate, inactive)
- Campaign assignment count
- Last contacted date

### Selection and campaigns

- Select visible rows or filter → **Create campaign from filters**
- Selection → **Create campaign from selection**
- Segment builder uses the same sendability evaluator as the lead table

## Sendability consistency

Canonical evaluator: `src/features/leadops/sendability.ts`

Used by:

- Lead table rows (`buildLeadManagementRows`)
- Campaign segment preview (`resolveSegmentCandidates`)
- Campaign recipient snapshots
- Manual Gmail/Outlook workflow (approval service + suppression table)

Blocking reasons are shown verbatim in the lead table sendability column.

## Import history

**Import history** button opens batch list with summary:

- Status, row counts, organizations/contacts imported
- Mapping profile and worksheet used
- Linked organization count (via `sourceImportId`)

No destructive rollback when records are referenced by campaigns.

## Duplicate review queue

Unresolved `possible_duplicate` import rows remain in IndexedDB with `proposedAction: review`. Operators approve per-row at import time or revisit via import batch summary.

## Performance

- Client-side pagination (25 rows/page)
- Filters applied before pagination
- Suitable for low thousands of rows in local MVP
