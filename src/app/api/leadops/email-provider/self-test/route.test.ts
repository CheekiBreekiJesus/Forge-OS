import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/leadops/email-provider/self-test", {
    body: JSON.stringify(body),
    method: "POST"
  });
}

const payload = {
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

describe("/api/leadops/email-provider/self-test", () => {
  it("rejects requests without explicit confirmation", async () => {
    const response = await POST(request({ ...payload, confirmation: "SEND" }));

    expect(response.status).toBe(400);
  });

  it("blocks when test sending is disabled", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "false");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(request(payload));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.errorCode).toBe("test_send_disabled");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects invalid recipient emails", async () => {
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "true");

    const response = await POST(
      request({
        ...payload,
        recipientEmail: "not-an-email"
      })
    );

    expect(response.status).toBe(403);
  });

  it("uses mocked Brevo HTTP for allowlisted self-test sends", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    vi.stubEnv("OUTREACH_REAL_SEND_ENABLED", "false");
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "true");
    vi.stubEnv("OUTREACH_TEST_RECIPIENT_ALLOWLIST", "qa@example.com");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ messageId: "<message@relay.example>" }), { status: 201 })
    );

    const response = await POST(request(payload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provider).toBe("brevo");
    expect(body.status).toBe("accepted");
    expect(body.mode).toBe("delivery_self_test");
    expect(body.providerMessageId).toBe("<message@relay.example>");
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
      new Response(JSON.stringify({ code: "invalid_parameter", message: "sender not verified" }), {
        status: 400
      })
    );

    const response = await POST(request(payload));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.status).toBe("failed");
    expect(body.errorCode).toBe("provider_rejected");
  });
});
