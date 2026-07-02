import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/leadops/email-provider/diagnostic", () => {
  it("returns safe Brevo configuration diagnostics without secret values", async () => {
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "brevo");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.com");
    vi.stubEnv("BREVO_SENDER_NAME", "ForgeOS");
    vi.stubEnv("OUTREACH_REAL_SEND_ENABLED", "true");
    vi.stubEnv("OUTREACH_TEST_SEND_ENABLED", "true");
    vi.stubEnv("OUTREACH_TEST_RECIPIENT_ALLOWLIST", "qa@example.com");

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.provider).toBe("brevo");
    expect(payload.apiKeyPresent).toBe(true);
    expect(payload.configured).toBe(true);
    expect(JSON.stringify(payload)).not.toContain("test-api-key");
  });
});
