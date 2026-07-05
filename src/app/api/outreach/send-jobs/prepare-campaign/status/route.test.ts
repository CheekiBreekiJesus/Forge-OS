import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("/api/outreach/send-jobs/prepare-campaign/status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a no-op preparation status in local persistence mode", async () => {
    vi.stubEnv("FORGEOS_PERSISTENCE_MODE", "local");

    const response = await GET(
      new Request("http://localhost/api/outreach/send-jobs/prepare-campaign/status?campaignId=campaign_local")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      result: {
        activity: [],
        campaignId: "campaign_local",
        preparedAt: null,
        preparedBy: null,
        preparedRecipients: 0,
        snapshotFingerprint: null,
        status: "not_prepared"
      }
    });
  });
});
