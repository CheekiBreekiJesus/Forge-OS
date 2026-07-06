import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSelfTestIdempotencyKey,
  sendEmailDeliverySelfTest,
  validateSelfTestInput
} from "@/application/email-delivery-self-test-service";
import type { EmailDeliveryProvider } from "@/features/email-delivery/provider";

const input = {
  confirmation: "SEND SELF TEST",
  initiatedBy: "operator@example.com",
  messageBody: "ForgeOS delivery self-test body.",
  recipientEmail: "qa@example.com",
  subject: "ForgeOS delivery self-test"
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("email delivery self-test service", () => {
  it("rejects when test sending is disabled", () => {
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "false");

    const error = validateSelfTestInput(input);

    expect(error).toContain("OUTREACH_TEST_SEND_ENABLED");
  });

  it("rejects invalid recipient emails", () => {
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "true");

    const error = validateSelfTestInput({ ...input, recipientEmail: "not-an-email" });

    expect(error).toContain("invalid");
  });

  it("blocks when Brevo API key is missing", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "true");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await sendEmailDeliverySelfTest(input);

    expect(result.status).toBe("blocked");
    expect(result.errorCode).toBe("configuration_missing");
    expect(result.errorMessage).toContain("BREVO_API_KEY");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts mocked Brevo success without touching campaign recipients", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    vi.stubEnv("OUTREACH_REAL_SEND_ENABLED", "false");
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "true");
    vi.stubEnv("OUTREACH_TEST_RECIPIENT_ALLOWLIST", "qa@example.com");
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ messageId: "<message@relay.example>" }), { status: 201 })
    );

    const result = await sendEmailDeliverySelfTest(input);
    const [, init] = fetchSpy.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));

    expect(result.status).toBe("accepted");
    expect(result.providerMessageId).toBe("<message@relay.example>");
    expect(body.tags).toEqual(["forgeos:self-test"]);
    expect(body.to).toEqual([{ email: "qa@example.com", name: "qa@example.com" }]);
    expect(body.htmlContent).toContain("<img");
    expect(body.textContent).toContain("ForgeOS delivery self-test body.");
    expect(result.idempotencyKey).toBe(buildSelfTestIdempotencyKey(input.recipientEmail, input.subject, input.messageBody));
  });

  it("returns sanitized Brevo errors from mocked fetch", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    vi.stubEnv("OUTREACH_REAL_SEND_ENABLED", "false");
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "true");
    vi.stubEnv("OUTREACH_TEST_RECIPIENT_ALLOWLIST", "qa@example.com");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: "invalid_parameter", message: "sender not verified test-api-key" }), {
        status: 400
      })
    );

    const result = await sendEmailDeliverySelfTest(input);

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("provider_rejected");
    expect(result.errorMessage).not.toContain("test-api-key");
  });

  it("does not call provider when validation fails before send", async () => {
    const provider: EmailDeliveryProvider = {
      diagnostic: vi.fn(),
      send: vi.fn()
    };

    const result = await sendEmailDeliverySelfTest(
      { ...input, confirmation: "SEND" },
      provider
    );

    expect(result.status).toBe("blocked");
    expect(provider.send).not.toHaveBeenCalled();
  });
});
