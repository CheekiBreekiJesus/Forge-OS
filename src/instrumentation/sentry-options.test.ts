import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import {
  buildSentryInitOptions,
  isSentryConfigured,
  scrubSentryEvent,
  shouldEnableSentry
} from "./sentry-options";

describe("sentry options", () => {
  it("treats Sentry as optional when DSN is absent", () => {
    expect(isSentryConfigured({})).toBe(false);
    expect(shouldEnableSentry({ SENTRY_DSN: "https://example.ingest.sentry.io/1", NODE_ENV: "development" })).toBe(
      false
    );
  });

  it("enables Sentry only in production when DSN is configured", () => {
    expect(
      shouldEnableSentry({ SENTRY_DSN: "https://example.ingest.sentry.io/1", NODE_ENV: "production" })
    ).toBe(true);
    expect(buildSentryInitOptions({ SENTRY_DSN: "https://example.ingest.sentry.io/1", NODE_ENV: "production" }).enabled).toBe(
      true
    );
  });

  it("redacts outreach-sensitive fields from events", () => {
    const scrubbed = scrubSentryEvent({
      extra: {
        recipientEmail: "lead@example.com",
        requestId: "req_123"
      },
      user: {
        email: "operator@example.com",
        id: "user_1"
      }
    } as unknown as ErrorEvent);

    expect(scrubbed?.extra).toEqual({
      recipientEmail: "[redacted]",
      requestId: "req_123"
    });
    expect(scrubbed?.user?.email).toBeUndefined();
    expect(scrubbed?.user?.id).toBe("user_1");
  });
});
