import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("/api/outreach/send-jobs/tenant-memberships", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns an empty hosted membership list in local persistence mode", async () => {
    vi.stubEnv("FORGEOS_PERSISTENCE_MODE", "local");

    const response = await GET(new Request("http://localhost/api/outreach/send-jobs/tenant-memberships"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      result: {
        memberships: [],
        selectedTenantId: null
      }
    });
  });
});
