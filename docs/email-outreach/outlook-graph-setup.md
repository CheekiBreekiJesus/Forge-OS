# Microsoft Entra app registration for Outlook Graph (local MVP)

Use placeholders only. Do not commit tenant IDs, client secrets, or real mailbox data.

## 1. Register a public client application

1. Open [Microsoft Entra admin center](https://entra.microsoft.com/).
2. **Applications → App registrations → New registration**.
3. Name: `ForgeOS Local Outlook (dev)`.
4. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**.
5. Redirect URI: **Web** → `http://localhost:3000/api/integrations/outlook/callback`.
6. Register and copy the **Application (client) ID** into `MICROSOFT_CLIENT_ID`.

Do **not** create a client secret for this local public-client PKCE flow.

## 2. Delegated API permissions

Add Microsoft Graph delegated permissions:

| Permission | Purpose |
|---|---|
| `openid` | Sign-in |
| `profile` | Display name |
| `offline_access` | Refresh token |
| `User.Read` | Mailbox validation |
| `Mail.Send` | Send as connected user |

Grant admin consent only if your tenant requires it for work accounts.

## 3. Authentication settings

- Enable **Allow public client flows** if prompted (authorization code + PKCE without secret).
- Redirect URI must match `MICROSOFT_REDIRECT_URI` exactly.

## 4. Local environment

```env
OUTLOOK_GRAPH_ENABLED=true
OUTLOOK_LIVE_SEND_ENABLED=false
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_AUTHORITY=https://login.microsoftonline.com/common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/integrations/outlook/callback
FORGEOS_LOCAL_ENCRYPTION_KEY=<32+ random chars, never commit>
OUTLOOK_TEST_RECIPIENTS=you@yourdomain.com
```

## 5. Connect mailbox

1. `npm run dev`
2. Open `/pt-PT/settings/integrations/outlook`
3. Click **Ligar Outlook** → complete Microsoft sign-in
4. Token cache path: `%LOCALAPPDATA%\ForgeOS\auth\outlook-token-cache.enc`

## Limitations

- HTTP **202** from Graph means accepted for delivery, not proof of inbox delivery.
- Reconnect required when refresh token is missing or invalid.
- No Brevo dependency in this path.
