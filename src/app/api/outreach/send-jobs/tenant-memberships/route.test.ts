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

describe("/api/outreach/send-jobs/tenant-memberships", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the trusted development membership list", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const response = await GET(actorRequest("http://localhost/api/outreach/send-jobs/tenant-memberships"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      result: {
        memberships: [
          {
            permissions: ["send_job:view", "send_job:prepare", "send_job:queue"],
            roles: ["outreach_operator"],
            tenantId: "tenant_a"
          }
        ],
        selectedTenantId: "tenant_a"
      }
    });
  });
});
