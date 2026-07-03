import { afterEach, describe, expect, it, vi } from "vitest";
import { POST, CONFIRMATION_PHRASE } from "@/app/api/integrations/jh-gomes-mail/connection-test/route";
import * as jhGomesConfig from "@/features/jh-gomes-mail/config";
import * as routeGuard from "@/features/jh-gomes-mail/route-guard";

const actor = {
  correlationId: "corr-1",
  permissions: [],
  roles: ["company_owner" as const],
  source: "development_headers" as const,
  tenantId: "tenant_jh_gomes",
  userId: "user_1"
};

function trustedRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/integrations/jh-gomes-mail/connection-test", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forgeos-actor-id": actor.userId,
      "x-forgeos-roles": actor.roles.join(","),
      "x-forgeos-tenant-id": actor.tenantId
    },
    method: "POST"
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JH Gomes mail connection-test route", () => {
  it("requires integration management authorization", async () => {
    vi.spyOn(routeGuard, "guardJhGomesMailMutationRequest").mockRejectedValue(
      new routeGuard.JhGomesMailRouteGuardError("forbidden", "Actor is not authorized.")
    );

    const response = await POST(trustedRequest({ confirmation: CONFIRMATION_PHRASE }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("forbidden");
  });

  it("rejects spoofed identity headers in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const response = await POST(trustedRequest({ confirmation: CONFIRMATION_PHRASE }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("production_auth_not_configured");
  });

  it("blocks when connection test feature flag is disabled", async () => {
    vi.spyOn(routeGuard, "guardJhGomesMailMutationRequest").mockResolvedValue(actor);
    vi.spyOn(jhGomesConfig, "runJhGomesMailConnectionTest").mockRejectedValue(
      new jhGomesConfig.JhGomesMailConnectionTestError(
        "connection_test_disabled",
        "JH Gomes mail connection tests are disabled."
      )
    );

    const response = await POST(trustedRequest({ confirmation: CONFIRMATION_PHRASE }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("connection_test_disabled");
  });

  it("returns structured diagnostics when authorized and enabled", async () => {
    vi.spyOn(routeGuard, "guardJhGomesMailMutationRequest").mockResolvedValue(actor);
    vi.spyOn(jhGomesConfig, "runJhGomesMailConnectionTest").mockResolvedValue({
      configurationValid: true,
      connectionTestEnabled: true,
      enabled: true,
      imap: {
        configurationValid: true,
        folders: [{ delimiter: "/", flags: [], path: "INBOX" }],
        host: "mail.jhgomes.com",
        passwordPresent: true,
        port: 993,
        secure: true,
        stages: [{ message: "ok", stage: "mailbox_access", valid: true }],
        username: "comercial@jhgomes.com"
      },
      liveSendEnabled: false,
      readSyncEnabled: false,
      smtp: {
        configurationValid: true,
        host: "mail.jhgomes.com",
        passwordPresent: true,
        port: 465,
        secure: true,
        stages: [{ message: "ok", stage: "mailbox_access", valid: true }],
        username: "comercial@jhgomes.com"
      },
      testedAt: "2026-07-03T12:00:00.000Z"
    });

    const response = await POST(trustedRequest({ confirmation: CONFIRMATION_PHRASE }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.result.liveSendEnabled).toBe(false);
    expect(payload.result.smtp.passwordPresent).toBe(true);
    expect(JSON.stringify(payload)).not.toContain("secret-value");
  });
});
