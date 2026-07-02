# Rate Limits And Retries

Date: 2026-07-02

Each send job persists batch size, delay value, daily real-send limit, and max retry count.

Simulation does not consume real-send allowance. Brevo mode checks daily usage before processing.

Retryable failures are timeout, rate limit, provider unavailable, and network error. Permanent provider rejections, suppression, stale approval, invalid requests, and invalid unsubscribe readiness are not retried.

Retries are not run in a tight loop. A retryable recipient receives a future `nextAttemptAt` and is processed by a later explicit batch call.
