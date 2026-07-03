# Import mapping profiles

Reusable header mappings for JH Gomes lead databases. Profiles store **metadata only** — never lead rows or email addresses.

## Stored fields

- `label` — operator-facing name
- `sourceLabel` — internal slug
- `headerMappings` — ForgeOS field → spreadsheet column
- `defaultCategory`, `defaultCountry`, `defaultSource`
- `ignoredColumns`
- `normalizationOptions`

## Built-in profiles

Seeded on first import for each tenant:

| Profile | Typical source |
|---------|----------------|
| Event Companies | `potential_customers_portugal_events_*` |
| Municipalities | `Municipios_*`, municipalities sheets |
| Associations | `Associações_*`, student/academic lists |
| Sports Clubs | communities/hobbies exports |
| Hospitality | cafés / pastelarias sheets |
| Generic Portuguese Leads | `Base_de_Dados_de_Entidades_Locais` |

## Operator actions

1. **Apply** — select profile before or after upload; re-runs preview.
2. **Save** — persist current manual mapping under a new label.
3. **Update** — change mapping and save again (creates new profile or use save with new name).
4. **Delete** — confirmation required; does not delete imported leads.

## Persistence

- IndexedDB table: `importMappingProfiles` (schema v12)
- Included in JSON backup v8
- Survives reload; not affected by demo reset

## ForgeOS import fields

`companyName`, `contactName`, `email`, `phone`, `website`, `region`, `country`, `industry`, `notes`, `sourceDatabase`, `status`, `language`

Portuguese and English header aliases are documented in `src/features/leadops/import-mapping.ts`.
