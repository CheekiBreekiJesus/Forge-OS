import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health/local", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("returns non-sensitive local health metadata", async () => {
    vi.stubEnv("FORGEOS_RUNTIME_MODE", "local-production");
    vi.stubEnv("FORGEOS_GIT_COMMIT", "abc1234");
    vi.stubEnv("FORGEOS_LOCAL_DB_NAME", "forgeos:jhgomes:local");
    vi.stubEnv("NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME", "forgeos:jhgomes:local");
    vi.stubEnv("AI_DEFAULT_PROVIDER", "deterministic");
    vi.stubEnv("EMAIL_DELIVERY_PROVIDER", "simulation");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.runtimeMode).toBe("local-production");
    expect(body.commit).toBe("abc1234");
    expect(body.databaseConfigured).toBe(true);
    expect(body.modules.outlook).toBe(false);
    expect(body.modules.brevo).toBe(false);
    expect(body).not.toHaveProperty("FORGEOS_LOCAL_DB_NAME");
    expect(JSON.stringify(body)).not.toMatch(/forgeos:jhgomes:local/);
  });

  it("does not treat placeholder Supabase values as configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://your-project-ref.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "replace-with-supabase-anon-key");

    const response = await GET();
    const body = await response.json();

    expect(body.modules.supabase).toBe(false);
  });
});
