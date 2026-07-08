import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const SENSITIVE_KEY_PATTERN =
  /email|password|token|secret|api[_-]?key|authorization|recipient|body|payload|plaintext|html|subject|brevo|smtp|unsubscribe/i;

export function isSentryConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.SENTRY_DSN?.trim());
}

export function shouldEnableSentry(env: Record<string, string | undefined> = process.env): boolean {
  return isSentryConfigured(env) && env.NODE_ENV === "production";
}

export function scrubSentryEvent(event: ErrorEvent, hint?: EventHint): ErrorEvent | null {
  void hint;
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
  }

  if (event.extra) {
    event.extra = scrubRecord(event.extra as Record<string, unknown>);
  }

  if (event.contexts) {
    for (const [key, value] of Object.entries(event.contexts)) {
      if (value && typeof value === "object") {
        event.contexts[key] = scrubRecord(value as Record<string, unknown>);
      }
    }
  }

  return event;
}

function scrubRecord(record: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      scrubbed[key] = "[redacted]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      scrubbed[key] = scrubRecord(value as Record<string, unknown>);
      continue;
    }
    scrubbed[key] = value;
  }
  return scrubbed;
}

export function buildSentryInitOptions(env: Record<string, string | undefined> = process.env) {
  const enabled = shouldEnableSentry(env);
  return {
    dsn: env.SENTRY_DSN,
    enabled,
    environment: env.VERCEL_ENV ?? env.NODE_ENV ?? "development",
    tracesSampleRate: enabled ? 0.1 : 0,
    beforeSend(event: ErrorEvent, hint: EventHint) {
      return scrubSentryEvent(event, hint);
    }
  };
}
