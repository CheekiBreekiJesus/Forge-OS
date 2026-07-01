import { describe, expect, it } from "vitest";
import {
  collapseWhitespace,
  extractWebsiteDomain,
  isValidEmailSyntax,
  normalizeEmail,
  normalizeOrganizationComparisonKey,
  normalizePhone,
  normalizeWebsite,
  organizationNamesSimilar
} from "./import-normalization";

describe("import normalization", () => {
  it("trims and collapses whitespace", () => {
    expect(collapseWhitespace("  Acme   Events  ")).toBe("Acme Events");
  });

  it("builds unicode-safe organization comparison keys without changing display text", () => {
    expect(normalizeOrganizationComparisonKey("Café & Eventos, Lda.")).toBe("cafe eventos lda");
  });

  it("normalizes email to lowercase", () => {
    expect(normalizeEmail("  Ana.Silva@Example.COM ")).toBe("ana.silva@example.com");
  });

  it("validates practical email syntax only", () => {
    expect(isValidEmailSyntax("valid@example.test")).toBe(true);
    expect(isValidEmailSyntax("bad-email")).toBe(false);
  });

  it("formats unambiguous Portuguese mobile numbers", () => {
    expect(normalizePhone("912345678").normalized).toBe("+351912345678");
  });

  it("cleans website URLs and extracts domains", () => {
    expect(normalizeWebsite("www.example.test").domain).toBe("example.test");
    expect(extractWebsiteDomain("https://www.demo.example/events")).toBe("demo.example");
  });

  it("detects similar organization names", () => {
    expect(organizationNamesSimilar("Atlântico Eventos Lda", "Atlantico Eventos")).toBe(true);
  });
});
