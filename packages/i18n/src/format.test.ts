import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDeltaPercent,
  isSupportedLocale,
  resolveLocale,
} from "./index";

describe("locale", () => {
  it("resolves supported locale", () => {
    expect(resolveLocale("en", "pt-PT")).toBe("en");
    expect(resolveLocale(null, "pt-PT")).toBe("pt-PT");
    expect(resolveLocale("invalid", "pt-PT")).toBe("pt-PT");
  });

  it("detects supported locales", () => {
    expect(isSupportedLocale("pt-PT")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
  });
});

describe("formatCurrency", () => {
  it("formats EUR for pt-PT", () => {
    const result = formatCurrency(124850, "pt-PT", "EUR");
    expect(result).toMatch(/124/);
    expect(result).toMatch(/€|EUR/);
  });
});

describe("formatDeltaPercent", () => {
  it("includes sign for positive delta", () => {
    expect(formatDeltaPercent(6.4, "en")).toContain("6.4");
  });
});
