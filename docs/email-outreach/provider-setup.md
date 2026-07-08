# Email Provider Setup

Local development must keep email delivery in simulation mode:

```env
EMAIL_DELIVERY_PROVIDER=simulation
OUTREACH_REAL_SEND_ENABLED=false
OUTREACH_TEST_SEND_ENABLED=false
```

Brevo protected test mode requires:

```env
EMAIL_DELIVERY_PROVIDER=brevo
OUTREACH_REAL_SEND_ENABLED=true
OUTREACH_TEST_SEND_ENABLED=true
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=
BREVO_REPLY_TO=
OUTREACH_TEST_RECIPIENT_ALLOWLIST=
OUTREACH_PROVIDER_TIMEOUT_MS=15000
```

Rules:

- `BREVO_API_KEY` must be configured only in private runtime env.
- `OUTREACH_TEST_RECIPIENT_ALLOWLIST` must contain internal test addresses only.
- Diagnostics do not send email.
- Configuration validation does not call Brevo.
- No campaign batch sending is available in this step.
- A protected test send must use an approved draft and must not mark the original lead as contacted.
