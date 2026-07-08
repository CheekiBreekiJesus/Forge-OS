import { afterEach, describe, expect, it, vi } from "vitest";
import { createUnsubscribeToken } from "@/features/email-delivery/unsubscribe-token";
import { POST } from "./route";

const secret = "test-secret-with-enough-entropy-for-hmac-signing";

function request(body: unknown) {
  return new Request("http://localhost/api/outreach/unsubscribe", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("/api/outreach/unsubscribe", () => {
  it("rejects invalid tokens without leaking lookup data", async () => {
    vi.stubEnv("OUTREACH_UNSUBSCRIBE_SECRET", secret);

    const response = await POST(request({ token: "invalid" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ status: "invalid_token" });
  });

  it("returns durable-store unavailable when Supabase server storage is not configured", async () => {
    vi.stubEnv("OUTREACH_UNSUBSCRIBE_SECRET", secret);
    const token = createUnsubscribeToken(
      {
        campaignId: "cmp_1",
        campaignRecipientId: "cmr_1",
        emailHash: "hash_email",
        issuedAt: 1000,
        leadId: "lead_1",
        tenantId: "tenant_a",
        ttlDays: null
      },
      secret
    );

    const response = await POST(request({ token }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ status: "durable_store_unavailable" });
  });

  it("upserts durable suppression records for valid tokens", async () => {
    vi.stubEnv("OUTREACH_UNSUBSCRIBE_SECRET", secret);
    vi.stubEnv("SUPABASE_URL", "https://db.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 201 }));
    const token = createUnsubscribeToken(
      {
        campaignId: "cmp_1",
        campaignRecipientId: "cmr_1",
        emailHash: "hash_email",
        issuedAt: 1000,
        leadId: "lead_1",
        tenantId: "tenant_a",
        ttlDays: null
      },
      secret
    );

    const response = await POST(request({ token }));

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://db.example/rest/v1/outreach_public_suppressions?on_conflict=tenant_public_id,normalized_email_hash,reason",
      expect.objectContaining({
        body: expect.stringContaining('"source":"public_unsubscribe"')
      })
    );
  });
});
