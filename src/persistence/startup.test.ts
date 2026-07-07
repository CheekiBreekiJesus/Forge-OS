import { describe, expect, it } from "vitest";
import { isRecoverableDatabaseError, toPersistenceStartupError } from "@/persistence/startup";

describe("persistence startup errors", () => {
  it("marks version and upgrade failures as recoverable", () => {
    expect(isRecoverableDatabaseError({ name: "VersionError", message: "Version mismatch" })).toBe(true);
    expect(isRecoverableDatabaseError({ name: "UpgradeError", message: "blocked" })).toBe(true);
  });

  it("wraps recoverable open failures with reset guidance", () => {
    const error = toPersistenceStartupError({ name: "VersionError", message: "lower version" });
    expect(error.recoverable).toBe(true);
    expect(error.message).toMatch(/reset/i);
  });
});
