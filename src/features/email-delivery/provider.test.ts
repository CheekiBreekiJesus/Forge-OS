import { afterEach, describe, expect, it, vi } from "vitest";
import { BrevoEmailDeliveryProvider } from "./brevo-provider";
import { buildEmailProviderDiagnostic, readEmailDeliveryConfig } from "./config";
import type { EmailDeliveryRequest } from "@/domain/email-delivery-types";

const request: EmailDeliveryRequest = {
  approvedContentHash: "hash_123",
  campaignId: "campaign_001",
  campaignRecipientId: "recipient_001",
  html: "<p>Hello</p>",
  idempotencyKey: "test:campaign_001:recipient_001:hash_123:qa@example.com",
  initiatedBy: "operator@example.com",
  leadId: "lead_001",
  mode: "provider_test",
  plainText: "Hello",
  subject: "ForgeOS test",
  tenantId: "tenant_jh_gomes",
  toEmail: "qa@example.com",
  toName: "QA",
  unsubscribeUrl: "https://forgeos.example/pt-PT/unsubscribe?token=test-token"
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("email delivery configuration", () => {
  it("defaults to simulation with disabled real and test sending", () => {
    const config = readEmailDeliveryConfig({});
    const diagnostic = buildEmailProviderDiagnostic(config);

    expect(config.provider).toBe("simulation");
    expect(config.realSendEnabled).toBe(false);
    expect(config.testSendEnabled).toBe(false);
    expect(diagnostic.configured).toBe(true);
    expect(diagnostic.apiKeyPresent).toBe(false);
  });

  it("maps Brevo environment without exposing secret values", () => {
    const config = readEmailDeliveryConfig({
      BREVO_API_KEY: "test-api-key",
      BREVO_REPLY_TO: "reply@example.com",
      BREVO_SENDER_EMAIL: "sender@example.com",
      BREVO_SENDER_NAME: "ForgeOS",
      EMAIL_DELIVERY_PROVIDER: "brevo",
      FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
      OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
      BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
      OUTREACH_REAL_SEND_ENABLED: "true",
      OUTREACH_TEST_RECIPIENT_ALLOWLIST: "qa@example.com, QA@example.com",
      OUTREACH_TEST_SEND_ENABLED: "true"
    });
    const diagnostic = buildEmailProviderDiagnostic(config);

    expect(config.provider).toBe("brevo");
    expect(config.testRecipientAllowlist).toEqual(["qa@example.com"]);
    expect(diagnostic.configured).toBe(true);
    expect(diagnostic.apiKeyPresent).toBe(true);
    expect(JSON.stringify(diagnostic)).not.toContain("test-api-key");
  });
});

describe("BrevoEmailDeliveryProvider", () => {
  it("blocks when real-send flag is disabled", async () => {
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        BREVO_API_KEY: "test-api-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "ForgeOS",
        EMAIL_DELIVERY_PROVIDER: "brevo",
        FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
        OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
        BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
        OUTREACH_REAL_SEND_ENABLED: "false",
        OUTREACH_TEST_RECIPIENT_ALLOWLIST: "qa@example.com",
        OUTREACH_TEST_SEND_ENABLED: "true"
      })
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await provider.send(request);

    expect(result.status).toBe("blocked");
    expect(result.errorCode).toBe("real_send_disabled");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks non-allowlisted test recipients", async () => {
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        BREVO_API_KEY: "test-api-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "ForgeOS",
        EMAIL_DELIVERY_PROVIDER: "brevo",
        FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
        OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
        BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
        OUTREACH_REAL_SEND_ENABLED: "true",
        OUTREACH_TEST_RECIPIENT_ALLOWLIST: "other@example.com",
        OUTREACH_TEST_SEND_ENABLED: "true"
      })
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await provider.send(request);

    expect(result.status).toBe("blocked");
    expect(result.errorCode).toBe("recipient_not_allowed");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("constructs a Brevo transactional email request and normalizes accepted response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ messageId: "<message@relay.example>" }), { status: 201 })
    );
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        BREVO_API_KEY: "test-api-key",
        BREVO_REPLY_TO: "reply@example.com",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "ForgeOS",
        EMAIL_DELIVERY_PROVIDER: "brevo",
        FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
        OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
        BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
        OUTREACH_REAL_SEND_ENABLED: "true",
        OUTREACH_TEST_RECIPIENT_ALLOWLIST: "qa@example.com",
        OUTREACH_TEST_SEND_ENABLED: "true"
      })
    );

    const result = await provider.send(request);
    const [, init] = fetchSpy.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    const headers = init?.headers as Record<string, string>;

    expect(result.status).toBe("accepted");
    expect(result.providerMessageId).toBe("<message@relay.example>");
    expect(headers["api-key"]).toBe("test-api-key");
    expect(body.sender).toEqual({ email: "sender@example.com", name: "ForgeOS" });
    expect(body.replyTo).toEqual({ email: "reply@example.com", name: "ForgeOS" });
    expect(body.to).toEqual([{ email: "qa@example.com", name: "QA" }]);
    expect(body.subject).toBe("ForgeOS test");
    expect(body.textContent).toContain("Opt-out: https://forgeos.example/pt-PT/unsubscribe?token=test-token");
    expect(body.htmlContent).toContain("Opt out of future outreach");
  });

  it("sanitizes provider error messages and classifies rate limits as retryable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ code: "rate_limit", message: "retry later test-api-key" }),
        { status: 429 }
      )
    );
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        BREVO_API_KEY: "test-api-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "ForgeOS",
        EMAIL_DELIVERY_PROVIDER: "brevo",
        FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
        OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
        BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
        OUTREACH_REAL_SEND_ENABLED: "true",
        OUTREACH_TEST_RECIPIENT_ALLOWLIST: "qa@example.com",
        OUTREACH_TEST_SEND_ENABLED: "true"
      })
    );

    const result = await provider.send(request);

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("rate_limited");
    expect(result.retryable).toBe(true);
    expect(result.errorMessage).not.toContain("test-api-key");
  });

  it("blocks when Brevo is not fully configured", async () => {
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        EMAIL_DELIVERY_PROVIDER: "brevo",
        OUTREACH_REAL_SEND_ENABLED: "true",
        OUTREACH_TEST_SEND_ENABLED: "true"
      })
    );

    const result = await provider.send(request);

    expect(result.status).toBe("blocked");
    expect(result.errorCode).toBe("configuration_missing");
  });

  it("blocks protected test sends when the test-send gate is disabled", async () => {
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        BREVO_API_KEY: "test-api-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "ForgeOS",
        EMAIL_DELIVERY_PROVIDER: "brevo",
        FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
        OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
        BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
        OUTREACH_REAL_SEND_ENABLED: "true",
        OUTREACH_TEST_RECIPIENT_ALLOWLIST: "qa@example.com",
        OUTREACH_TEST_SEND_ENABLED: "false"
      })
    );

    const result = await provider.send(request);

    expect(result.status).toBe("blocked");
    expect(result.errorCode).toBe("test_send_disabled");
  });

  it("blocks provider delivery without an unsubscribe URL", async () => {
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        BREVO_API_KEY: "test-api-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "ForgeOS",
        EMAIL_DELIVERY_PROVIDER: "brevo",
        FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
        OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
        BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
        OUTREACH_REAL_SEND_ENABLED: "true",
        OUTREACH_TEST_RECIPIENT_ALLOWLIST: "qa@example.com",
        OUTREACH_TEST_SEND_ENABLED: "true"
      })
    );

    const result = await provider.send({ ...request, unsubscribeUrl: "" });

    expect(result.status).toBe("blocked");
    expect(result.errorCode).toBe("invalid_request");
  });

  it("classifies Brevo timeouts as retryable failures", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          const error = new DOMException("Aborted", "AbortError");
          reject(error);
        })
    );
    const provider = new BrevoEmailDeliveryProvider(
      readEmailDeliveryConfig({
        BREVO_API_KEY: "test-api-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "ForgeOS",
        EMAIL_DELIVERY_PROVIDER: "brevo",
        FORGEOS_PUBLIC_BASE_URL: "https://forgeos.example",
        OUTREACH_UNSUBSCRIBE_SECRET: "test-secret-with-enough-entropy-for-hmac-signing",
        BREVO_WEBHOOK_SECRET: "test-webhook-secret-with-enough-entropy",
        OUTREACH_REAL_SEND_ENABLED: "true",
        OUTREACH_TEST_RECIPIENT_ALLOWLIST: "qa@example.com",
        OUTREACH_TEST_SEND_ENABLED: "true",
        OUTREACH_PROVIDER_TIMEOUT_MS: "1"
      })
    );

    const result = await provider.send(request);

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("timeout");
    expect(result.retryable).toBe(true);
  });
});
