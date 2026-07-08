import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/outreach/brevo/webhook", {
    body: JSON.stringify(body),
    headers: {
      authorization: "Bearer test-webhook-secret-with-enough-entropy",
      "content-type": "application/json",
      ...headers
    },
    method: "POST"
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("/api/outreach/brevo/webhook", () => {
  it("rejects unauthenticated webhook requests", async () => {
    vi.stubEnv("BREVO_WEBHOOK_SECRET", "test-webhook-secret-with-enough-entropy");

    const response = await POST(request({ event: "delivered" }, { authorization: "" }));

    expect(response.status).toBe(401);
  });

  it("rejects non-json payloads", async () => {
    vi.stubEnv("BREVO_WEBHOOK_SECRET", "test-webhook-secret-with-enough-entropy");

    const response = await POST(request({ event: "delivered" }, { "content-type": "text/plain" }));

    expect(response.status).toBe(415);
  });

  it("stores sanitized normalized events through durable storage", async () => {
    vi.stubEnv("BREVO_WEBHOOK_SECRET", "test-webhook-secret-with-enough-entropy");
    vi.stubEnv("OUTREACH_WEBHOOK_TENANT_ID", "tenant_a");
    vi.stubEnv("SUPABASE_URL", "https://db.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 201 }));

    const response = await POST(
      request({
        email: "lead@example.com",
        event: "delivered",
        id: 26224,
        "message-id": "<message@relay.example>",
        subject: "Private subject",
        tags: ["tenant:untrusted"],
        ts_event: 1598034509
      })
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://db.example/rest/v1/outreach_provider_events?on_conflict=tenant_public_id,event_fingerprint",
      expect.objectContaining({
        body: expect.stringContaining('"tenant_public_id":"tenant_a"')
      })
    );
    expect(String(fetchSpy.mock.calls[0]?.[1]?.body)).not.toContain("Private subject");
  });
});
