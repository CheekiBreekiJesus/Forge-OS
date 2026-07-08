# Private import profile (aggregate only)

Generated: 2026-07-02  
Source directory: `JH Gomes/Databases/Lead Databases/Portugal` (local, not in Git)

No email addresses, contact names, or row-level data are recorded here.

## Summary

| Metric | Value |
|--------|-------|
| Files profiled | 12 |
| Primary format | XLSX |
| CSV in lead set | 0 |
| Total data rows (all sheets) | ~3,500+ |
| Multi-sheet workbooks | 2 |

## Private acceptance run (2026-07-02)

| Metric | Value |
|--------|-------|
| Workbook category | municipalities-cafes-events-combined |
| Selected sheet | Municipalidades (sheet 1 of 5) |
| Sheet options listed | 5 |
| Mapping profile | Municipalities |
| Mapped fields | 6 |
| Total rows | 271 |
| Valid rows | 271 |
| Invalid rows | 0 |
| Missing-email rows | 0 |
| Exact duplicates | 0 |
| Possible duplicates | 0 |
| Imported organizations | 271 |
| Skipped on import | 0 |
| Persistence after reload | pass (271 stored; 25 visible per page) |
| Defect found | stale mapping after sheet switch (fixed) |

## Files (sanitized labels)

| Source label | Format | Sheets | Approx rows | Missing email rows | Possible dup emails |
|--------------|--------|--------|-------------|--------------------|---------------------|
| AnexoLista_deFreguesias.xlsx | xlsx | 1 | 612 | 612 | 0 |
| Associacoes_Estudantes_Academicos.xlsx | xlsx | 6 | 187 (Lisboa active) | 7 | 15 |
| Base_de_Dados_de_Entidades_Locais.xlsx | xlsx | 1 | 95 | 0 | 0 |
| Municipios_Cafes_Eventos.xlsx | xlsx | 5 | 1,160 | 9 | 36 |
| potential_customers_portugal_communities_hobbies.xlsx | xlsx | 1 | 287 | 0 | 13 |
| potential_customers_portugal_education_sector.xlsx | xlsx | 1 | 282 | 12 | 7 |
| potential_customers_portugal_events_celebrations.xlsx | xlsx | 1 | 287 | 2 | 13 |
| potential_customers_portugal_fairs_entrepreneurship.xlsx | xlsx | 1 | 299 | 2 | 39 |
| potential_customers_portugal_fairs_entrepreneurship_2.xlsx | xlsx | 1 | 18 | 0 | 0 |
| potential_customers_portugal_food_beverage_sector.xlsx | xlsx | 1 | (see raw profile) | low | moderate |
| potential_customers_portugal_municipalities.xlsx | xlsx | 1 | (see raw profile) | low | low |
| potential_customers_portugal_organizations_communities.xlsx | xlsx | 1 | (see raw profile) | low | moderate |

Raw machine-readable aggregate: `qa/outreach/private-import-profile.raw.json` (gitignored).

## Common header patterns

**Portuguese / mixed PT workbooks**

- `Nombre` / `Name` → organization
- `Tipo` / `Business Category` / `Company Sector` → category
- `Ciudad` / `City` / `Concelho` / `Distrito` → region
- `Telefono` / `Contact Phone` → phone
- `Email` / `Contact Email` → email
- `Website` / `Link` → website
- `Endereço` → address notes / region hint

**English export templates**

- `Name`, `Business Category`, `Contact Email`, `Contact Phone Number`, `City`, `Country`, `Notes`

## Category distribution (top themes)

- Municipalities and local entities
- Hospitality (cafés, pastelarias, padarias)
- Events and wedding planners
- Sports clubs and associations
- Education sector
- Fairs, festivals, and markets

## Formatting notes

- Multi-sheet books require sheet selection (only one sheet populated in some workbooks)
- Portuguese characters present throughout (UTF-8 in XLSX)
- Some sheets use Spanish header spellings (`Nombre`, `Ciudad`, `Telefono`)
- Merged/sparse header rows in parish reference sheet (no emails — reference data only)
- Duplicate emails appear within single sheets (10–40 rows per file in larger sets)
- **Operator note:** after switching XLSX sheets, re-apply the mapping profile so headers match the active sheet

## Privacy

- Profiler script: `scripts/data-preparation/profile-lead-files.mjs`
- Private acceptance runner: `scripts/qa/private-import-acceptance.ts` (aggregate output only)
- No private files copied into the repository
- No emails printed in logs or committed reports
