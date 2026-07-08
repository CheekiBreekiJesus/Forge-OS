# Outreach Pilot Workflow

## End-to-end local workflow

1. Open **Settings** (`/pt-PT/settings`)
2. Configure **Company** — trading name, website, legal footer, logo (local upload + optional public HTTPS URL)
3. Configure **My profile** — name, email, phone, language (PT / EN label)
4. Create or select a **Sender identity** — default from email, signature preview
5. Open **Products** — set `productPageUrl`, image URLs, customizer link, email title
6. Open **Outreach** lead workspace (`/pt-PT/leadops/[leadId]`)
7. Select sender identity and products
8. **Generate** email (Abacus when configured, deterministic otherwise)
9. Review trusted links, media placeholders, signature, legal footer
10. **Approve** message
11. **Copy** plain text / formatted HTML or open Gmail, Outlook, default mail app
12. Optionally **Simulate send** through ForgeOS queue (Smartlead when configured)

## Branding guarantees

- AI generates commercial copy only
- URLs, signatures, and footers come from stored profile/product data
- Approved emails snapshot sender and company data

## Known local limitations

- Logo without public HTTPS URL shows placeholder in external HTML
- Team users are local preview accounts only
- Google/Microsoft login shows hosted-version information dialog only
