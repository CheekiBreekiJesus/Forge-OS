import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/integrations/jh-gomes-mail/diagnostic/route";

describe("JH Gomes mail diagnostic route", () => {
  it("returns a safe static diagnostic snapshot", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload.enabled).toBe(false);
    expect(payload.connectionTestEnabled).toBe(false);
    expect(payload.liveSendEnabled).toBe(false);
    expect(payload.readSyncEnabled).toBe(false);
    expect(payload.smtp.passwordPresent).toBe(false);
    expect(payload.smtp.missing.length).toBeGreaterThan(0);
  });
});
