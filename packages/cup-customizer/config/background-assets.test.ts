import { describe, expect, it } from "vitest";
import {
  buildCupBackgroundCandidateUrls,
  resolveCupBackgroundAssets,
  sanitizeAssetSegment
} from "./background-assets";

describe("background-assets", () => {
  it("builds predictable public paths for reusable PP 250 ml", () => {
    const urls = buildCupBackgroundCandidateUrls("reusable_pp", 250);
    expect(urls[0]).toBe("/assets/cup-customizer/backgrounds/reusable-pp/250ml/default.svg");
    expect(urls).toContain("/assets/cup-customizer/backgrounds/reusable-pp/250ml/default.png");
  });

  it("builds paper cup paths from verified size", () => {
    const resolved = resolveCupBackgroundAssets({ cupType: "paper", cupSize: "250 ml" });
    expect(resolved.cupType).toBe("paper");
    expect(resolved.sizeMl).toBe(250);
    expect(resolved.candidateUrls[0]).toContain("/paper/250ml/default.svg");
  });

  it("sanitizes unsafe path segments", () => {
    expect(sanitizeAssetSegment("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeAssetSegment("  White Cup  ")).toBe("white-cup");
  });

  it("provides a fallback URL when assets are missing", () => {
    const resolved = resolveCupBackgroundAssets({ cupType: "reusable_pp", cupSize: "330 ml" });
    expect(resolved.fallbackUrl).toBe("/assets/cup-customizer/backgrounds/fallback/default.svg");
  });
});
