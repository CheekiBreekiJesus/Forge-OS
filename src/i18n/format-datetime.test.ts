import { describe, expect, it } from "vitest";
import { formatDateTime } from "./format-datetime";

describe("formatDateTime", () => {
  it("formats UTC timestamps deterministically for pt-PT", () => {
    expect(formatDateTime("2026-06-30T14:21:15.000Z", "pt-PT")).toBe("30/06/2026, 14:21:15");
  });

  it("formats UTC timestamps deterministically for en", () => {
    expect(formatDateTime("2026-06-30T14:21:15.000Z", "en")).toBe("06/30/2026, 14:21:15");
  });
});
