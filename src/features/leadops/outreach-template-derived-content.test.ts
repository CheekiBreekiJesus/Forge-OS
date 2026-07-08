import { describe, expect, it } from "vitest";
import {
  buildBroaderRangeLine,
  buildPersonalizedIntro,
  buildPortfolioImageHtml,
  buildPortfolioImageLine,
  buildPortfolioPlainTextLine,
  buildRecommendedProducts,
  DEFAULT_PORTFOLIO_IMAGE_ALT_PT
} from "@/features/leadops/outreach-template-derived-content";

describe("outreach template derived content", () => {
  it("builds a municipality-aware personalized intro in PT", () => {
    const intro = buildPersonalizedIntro({
      organizationDisplayName: "Município de Tábua",
      localizedCategory: "Município",
      region: "Coimbra",
      companySenderName: "JH Gomes",
      locale: "pt-PT"
    });

    expect(intro).toContain("Município de Tábua");
    expect(intro).toContain("Coimbra");
    expect(intro).not.toContain("Municipality");
  });

  it("recommends hospitality extras in PT", () => {
    const line = buildRecommendedProducts("Hospitality", "pt-PT");
    expect(line).toContain("copos reutilizáveis");
    expect(line).toContain("embalagens take-away");
  });

  it("mentions broader product range for an industry", () => {
    const line = buildBroaderRangeLine("Restauração e hotelaria", "pt-PT");
    expect(line).toContain("louça descartável sustentável");
    expect(line).toContain("embalagens take-away");
  });

  it("lists cup sizes in plain text without placeholders", () => {
    const line = buildPortfolioImageLine("", DEFAULT_PORTFOLIO_IMAGE_ALT_PT, "pt-PT");
    expect(line).toBe("Formatos disponíveis: 250 ml, 330 ml, 430 ml e 500 ml.");
    expect(line).not.toContain("[");
    expect(line).not.toContain("http");
  });

  it("omits portfolio HTML when no renderable URL is available", () => {
    const html = buildPortfolioImageHtml("", DEFAULT_PORTFOLIO_IMAGE_ALT_PT);
    expect(html).toBe("");
    expect(html).not.toContain("<em>");
  });

  it("renders email-safe portfolio HTML with width 600 and responsive styles", () => {
    const html = buildPortfolioImageHtml(
      "https://forgeos.example/assets/email-outreach/jh-gomes/custom-cups-banner.png",
      DEFAULT_PORTFOLIO_IMAGE_ALT_PT,
      { width: 600 }
    );
    expect(html).toContain('role="presentation"');
    expect(html).toContain('width="600"');
    expect(html).toContain("max-width:600px");
    expect(html).toContain(DEFAULT_PORTFOLIO_IMAGE_ALT_PT);
  });

  it("allows relative preview URLs in local application previews", () => {
    const html = buildPortfolioImageHtml(
      "",
      DEFAULT_PORTFOLIO_IMAGE_ALT_PT,
      { previewUrl: "/assets/email-outreach/jh-gomes/custom-cups-banner.png", width: 600 }
    );
    expect(html).toContain('src="/assets/email-outreach/jh-gomes/custom-cups-banner.png"');
  });

  it("escapes unsafe characters in portfolio image URLs", () => {
    const html = buildPortfolioImageHtml(
      'https://cdn.example.pt/x" onerror="alert(1)',
      DEFAULT_PORTFOLIO_IMAGE_ALT_PT
    );
    expect(html).toContain("https://cdn.example.pt/");
    expect(html).not.toContain('onerror="alert(1)"');
  });

  it("keeps plain-text cup sizes independent of image availability", () => {
    expect(buildPortfolioPlainTextLine("pt-PT")).toContain("250 ml");
    expect(buildPortfolioPlainTextLine("en")).toContain("250 ml");
  });
});
