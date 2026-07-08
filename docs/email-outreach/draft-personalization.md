# Draft personalization

## Salutation resolver

Resolution order:

1. Manual `greetingOverride` on the campaign recipient
2. Named contact + explicit male → `Exmo. Senhor {name},`
3. Named contact + explicit female → `Exma. Senhora {name},`
4. Named contact + unknown gender → `Exmo(a). Senhor(a) {name},`
5. No genuine contact → `Exmos. Senhores,` (EN: `Dear Sir or Madam,`)

Contact is treated as unnamed when empty, equals organization, matches municipality name, or email local part is generic (`geral`, `info`, `contacto`, etc.).

## Organization display

- `organizationName` — imported snapshot value (unchanged)
- `organizationDisplayName` — presentation value (e.g. `Tábua` → `Município de Tábua`)
- Existing prefixes (`Município de`, `Câmara Municipal de`) are preserved

## Category localization

Internal English codes (e.g. `Municipality`) map to PT-PT labels and category-specific body lines. Raw English codes never appear in Portuguese drafts.

## Website

Recipient website is not repeated in the email body. Company website may appear only in sender context / signature when configured.

## Subject

Default PT subject: `Copos personalizados para {{subjectOrganizationTarget}}` (e.g. `Copos personalizados para o Município de Tábua`).

## Preview

Draft preview shows greeting, contact, organization, display name, localized category, sender profile, subject, and warnings for demo values, org-as-contact, and untranslated categories.
