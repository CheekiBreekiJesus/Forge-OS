import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/leadops/email-provider/test-send", {
    body: JSON.stringify(body),
    method: "POST"
  });
}

const payload = {
  approvedContentHash: "hash_123",
  campaignId: "cmp_1",
  campaignRecipientId: "cmr_1",
  confirmation: "SEND TEST",
  html: "<p>Hello</p>",
  idempotencyKey: "test:cmp_1:cmr_1:hash_123:qa@example.com",
  initiatedBy: "operator@example.com",
  leadId: "lead_1",
  mode: "provider_test",
  plainText: "Hello",
  subject: "Test",
  tenantId: "tenant_a",
  toEmail: "qa@example.com",
  toName: "QA"
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("/api/leadops/email-provider/test-send", () => {
  it("rejects requests without explicit confirmation", async () => {
    const response = await POST(request({ ...payload, confirmation: "SEND" }));

    expect(response.status).toBe(400);
  });

  it("blocks Brevo send when test-send gate is disabled", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    vi.stubEnv("OUTREACH_REAL_SEND_ENABLED", "true");
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "false");
    vi.stubEnv("OUTREACH_TEST_RECIPIENT_ALLOWLIST", "qa@example.com");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(request(payload));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.errorCode).toBe("test_send_disabled");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses mocked Brevo HTTP for allowlisted protected test sends", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    vi.stubEnv("OUTREACH_REAL_SEND_ENABLED", "true");
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
    expect(body.providerMessageId).toBe("<message@relay.example>");
  });
});
