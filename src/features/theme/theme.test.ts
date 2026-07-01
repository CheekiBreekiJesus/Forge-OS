import { describe, expect, it } from "vitest";
import { isForgeThemeMode, nextThemeMode, resolveThemeMode } from "@/features/theme/theme";

describe("ForgeOS theme helpers", () => {
  it("validates supported theme modes", () => {
    expect(isForgeThemeMode("dark")).toBe(true);
    expect(isForgeThemeMode("light")).toBe(true);
    expect(isForgeThemeMode("system")).toBe(true);
    expect(isForgeThemeMode("solarized")).toBe(false);
  });

  it("cycles through persisted theme modes", () => {
    expect(nextThemeMode("dark")).toBe("light");
    expect(nextThemeMode("light")).toBe("system");
    expect(nextThemeMode("system")).toBe("dark");
  });

  it("resolves explicit modes without browser state", () => {
    expect(resolveThemeMode("dark")).toBe("dark");
    expect(resolveThemeMode("light")).toBe("light");
  });
});
