# Sender profiles

## Model boundaries

| Layer | Purpose |
|-------|---------|
| **User profile** | Local operator identity, UI preferences |
| **Company profile** | Tenant trading/legal name, website, phone, branding |
| **Sender identity** | From/reply-to, phone, signature used in outreach drafts |

Campaign drafts read **sender identity** and **company profile**. Editing the user profile does not change the sender unless the sender identity is updated in **Settings → Identidades de remetente**.

## Persistence

- Stored in IndexedDB (`companyProfiles`, `senderIdentities`) scoped by tenant.
- Same database as campaigns (`FORGEOS_LOCAL_DB_NAME` / `NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME`).
- Included in JSON backup v8.

## Campaign binding

- New campaigns snapshot `senderProfileId` from the default sender at creation time.
- Draft rendering loads sender via `campaign.senderProfileId` or default sender.
- **Atualizar dados do remetente** on draft campaigns refreshes `senderProfileId` and regenerates non-approved, non-edited drafts.

## Demo values

Explicit demo seed may use placeholder operator data. Approval is blocked while known demo sender values (`joao.gomes@demo.local`, `João Gomes`, `+351 910 000 000`) remain on the active sender identity.

## Save feedback

Sender identity edits show **A guardar…**, **Definições guardadas.**, or **Falha ao guardar** after reload verification.
