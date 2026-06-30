# Auth and Mailbox Roadmap

## Current local MVP

- Login page offers **Google** and **Microsoft** buttons that open an information dialog
- No fake OAuth — local demo login continues to dashboard
- User profiles and sender identities are stored in IndexedDB

## Future hosted flow

```text
Google or Microsoft login
  → Supabase Auth session
  → workspace / tenant membership
  → user profile prefill from IdP claims
  → company onboarding wizard
  → sender identity configuration
  → Outreach with branded composer
```

## Mailbox actions (implemented locally)

| Action | Mechanism |
|--------|-----------|
| Copy plain text | Clipboard API |
| Copy formatted email | HTML + plain multipart clipboard |
| Default email app | `mailto:` with length guard |
| Gmail | `mail.google.com/mail/?view=cm&...` |
| Outlook web | `outlook.office.com/mail/deeplink/compose?...` |

## Production blockers

- Supabase Auth + OAuth provider configuration
- Workspace membership and role enforcement
- Hosted asset CDN for embeddable email images
- Optional mailbox send API (Gmail API / Microsoft Graph) — not in local MVP
