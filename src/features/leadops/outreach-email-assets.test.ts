import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  JH_GOMES_CUSTOM_CUPS_BANNER,
  joinPublicAssetUrl,
  isAbsoluteEmailImageUrl,
  isUsablePublicBaseUrl,
  resolvePortfolioImageUrls
} from "@/features/leadops/outreach-email-assets";

const bannerPath = path.join(
  process.cwd(),
  "public",
  "assets",
  "email-outreach",
  "jh-gomes",
  "custom-cups-banner.png"
);

describe("outreach email assets", () => {
  it("stores the JH Gomes banner in the public outreach assets folder", () => {
    expect(existsSync(bannerPath)).toBe(true);
  });

  it("keeps the banner as a PNG with an approximately 3:1 aspect ratio", () => {
    const bytes = readFileSync(bannerPath);
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    expect(width).toBeGreaterThan(500);
    expect(height).toBeGreaterThan(150);
    expect(width / height).toBeCloseTo(3, 0);
  });

  it("joins public asset URLs without double slashes", () => {
    expect(joinPublicAssetUrl("https://forgeos.example/", JH_GOMES_CUSTOM_CUPS_BANNER.relativePath)).toBe(
      `https://forgeos.example${JH_GOMES_CUSTOM_CUPS_BANNER.relativePath}`
    );
  });

  it("accepts HTTPS and local HTTP base URLs", () => {
    expect(isUsablePublicBaseUrl("https://forgeos.example")).toBe(true);
    expect(isUsablePublicBaseUrl("http://localhost:3000")).toBe(true);
    expect(isUsablePublicBaseUrl("ftp://forgeos.example")).toBe(false);
    expect(isUsablePublicBaseUrl("")).toBe(false);
  });

  it("builds an absolute banner URL for delivered email HTML", () => {
    const resolved = resolvePortfolioImageUrls({
      tenantId: "tenant_jh_gomes",
      publicBaseUrl: "https://forgeos.example"
    });
    expect(resolved?.absoluteUrl).toBe(
      `https://forgeos.example${JH_GOMES_CUSTOM_CUPS_BANNER.relativePath}`
    );
    expect(isAbsoluteEmailImageUrl(resolved?.absoluteUrl ?? "")).toBe(true);
  });

  it("falls back to a relative preview path when no public base URL exists", () => {
    const resolved = resolvePortfolioImageUrls({
      tenantId: "tenant_jh_gomes",
      publicBaseUrl: ""
    });
    expect(resolved?.absoluteUrl).toBe("");
    expect(resolved?.previewUrl).toBe(JH_GOMES_CUSTOM_CUPS_BANNER.relativePath);
  });

  it("does not produce broken URLs for invalid public base values", () => {
    const resolved = resolvePortfolioImageUrls({
      tenantId: "tenant_jh_gomes",
      publicBaseUrl: "not-a-url"
    });
    expect(resolved?.absoluteUrl).toBe("");
    expect(resolved?.previewUrl).toBe(JH_GOMES_CUSTOM_CUPS_BANNER.relativePath);
  });
});
