# Rate Limits And Retries

Date: 2026-07-03

Each send job persists batch size, per-recipient delay value, daily real-send limit, and max retry count.

Simulation does not consume real-send allowance. Brevo mode checks daily usage before processing. The Supabase migration includes `increment_outreach_send_job_daily_usage` so hosted real-send usage can be incremented atomically through the server-only store.

Retryable failures are:

- timeout;
- rate limit;
- provider unavailable;
- network error.

Permanent provider rejections, suppression, stale approval, invalid requests, and invalid unsubscribe readiness are not retried.

Retries are not run in a tight loop. A retryable recipient receives a future `nextAttemptAt` and is processed by a later explicit batch call.
