import { describe, expect, it } from "vitest";
import {
  buildBroaderRangeLine,
  buildPersonalizedIntro,
  buildPortfolioImageHtml,
  buildRecommendedProducts
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

  it("renders portfolio placeholder HTML when URL is missing", () => {
    const html = buildPortfolioImageHtml("", "Exemplo de copo personalizado JH Gomes");
    expect(html).toContain("<em>");
    expect(html).not.toContain('src=""');
  });

  it("escapes unsafe characters in portfolio image URLs", () => {
    const html = buildPortfolioImageHtml(
      'https://cdn.example.pt/x" onerror="alert(1)',
      "Exemplo de copo personalizado JH Gomes"
    );
    expect(html).toContain("https://cdn.example.pt/");
    expect(html).not.toContain('onerror="alert(1)"');
  });
});
