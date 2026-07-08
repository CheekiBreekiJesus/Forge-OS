import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

function actorRequest(url: string): Request {
  return new Request(url, {
    headers: {
      "x-forgeos-actor-id": "actor_test",
      "x-forgeos-tenant-id": "tenant_a",
      "x-forgeos-roles": "outreach_operator"
    }
  });
}

describe("/api/outreach/send-jobs/prepare-campaign/status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires hosted persistence configuration", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const response = await GET(
      actorRequest("http://localhost/api/outreach/send-jobs/prepare-campaign/status?campaignId=campaign_local")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: {
        code: "unavailable",
        message: "Hosted outreach persistence is not configured."
      }
    });
  });
});
