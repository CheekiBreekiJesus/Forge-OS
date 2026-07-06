import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyOutreachBrandingToEmail,
  buildBrandedSelfTestEmailContent,
  renderBrandedFooterHtml,
  renderShowcaseHtml
} from "@/features/email-composition/outreach-branding";
import type { OutreachBrandingConfig } from "@/features/email-composition/outreach-branding-config";
import {
  DEFAULT_OUTREACH_SHOWCASE_PATH,
  resolveEmbeddableAssetUrl,
  resolveOutreachBrandingConfig
} from "@/features/email-composition/outreach-branding-config";
import { buildSelfTestDeliveryRequest } from "@/application/email-delivery-self-test-service";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";

const company: CompanyProfileSnapshot = {
  addressLine1: "Rua 1",
  addressLine2: "",
  city: "Lisboa",
  country: "Portugal",
  defaultCurrency: "EUR",
  defaultLanguage: "pt-PT",
  facebookUrl: "",
  generalEmail: "geral@jhgomes.pt",
  generalPhone: "+351 256 000 000",
  id: "c1",
  legalFooter: "",
  legalName: "JH Gomes, Lda.",
  linkedinUrl: "",
  logoLocalAssetId: null,
  logoPublicUrl: "",
  postalCode: "1000",
  region: "",
  tenantId: "tenant_jh_gomes",
  tradingName: "JH Gomes",
  vatNumber: "PT1",
  websiteUrl: "https://www.jhgomes.pt"
};

const sender: SenderIdentitySnapshot = {
  active: true,
  companyProfileId: "c1",
  defaultLanguage: "pt-PT",
  displayName: "João Gomes",
  fromEmail: "joao@jhgomes.pt",
  id: "s1",
  isDefault: true,
  jobTitle: "Comercial",
  phone: "+351 910 000 000",
  replyToEmail: "joao@jhgomes.pt",
  signatureHtml: "",
  signatureText: "",
  tenantId: "tenant_jh_gomes",
  userProfileId: "u1"
};

function buildConfig(overrides?: Partial<OutreachBrandingConfig>): OutreachBrandingConfig {
  return {
    companyName: "JH Gomes",
    companyWebsite: "https://www.jhgomes.pt",
    footerCtaLabel: "Ver copos personalizados",
    footerCtaUrl: "https://www.jhgomes.pt",
    locale: "pt-PT",
    logoUrl: "https://forgeos.example/demo/outreach/jh-gomes-logo.svg",
    optOutLine: "Se preferir não receber futuras mensagens, responda com 'remover'.",
    senderEmail: "joao@jhgomes.pt",
    senderName: "João Gomes",
    senderPhone: "+351 910 000 000",
    showcaseImageCaption: "Exemplos de copos personalizados produzidos pela JH Gomes",
    showcaseImageUrl: "https://forgeos.example/demo/outreach/jh-gomes-showcase.svg",
    ...overrides
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("outreach email branding", () => {
  it("includes showcase image block in HTML", () => {
    const html = renderShowcaseHtml(buildConfig());
    expect(html).toContain("<img");
    expect(html).toContain("Exemplos de copos personalizados produzidos pela JH Gomes");
    expect(html).toContain("jh-gomes-showcase.svg");
  });

  it("includes branded footer with logo in HTML", () => {
    const html = renderBrandedFooterHtml(buildConfig());
    expect(html).toContain("jh-gomes-logo.svg");
    expect(html).toContain("João Gomes");
    expect(html).toContain("joao@jhgomes.pt");
    expect(html).toContain("Ver copos personalizados");
  });

  it("keeps plain text fallback when image URL is unavailable", () => {
    const branded = applyOutreachBrandingToEmail(
      {
        html: "<p>Olá Ana,</p><p>Introdução com copos personalizados.</p>",
        plainText: "Olá Ana,\n\nIntrodução com copos personalizados."
      },
      buildConfig({ showcaseImageUrl: null, logoUrl: null })
    );

    expect(branded.plainText).toContain("[Exemplos de copos personalizados produzidos pela JH Gomes]");
    expect(branded.html).not.toContain("<img");
    expect(branded.html).toContain("Exemplos de copos personalizados produzidos pela JH Gomes");
    expect(branded.plainText).toContain("João Gomes");
  });

  it("preserves opt-out line in branded plain text", () => {
    const branded = applyOutreachBrandingToEmail(
      {
        html: "<p>Olá,</p><p>Intro.</p><p>Se preferir não receber futuras mensagens, responda com 'remover'.</p>",
        plainText:
          "Olá,\n\nIntro.\n\nSe preferir não receber futuras mensagens, responda com 'remover'."
      },
      buildConfig()
    );

    expect(branded.plainText).toContain("Se preferir não receber futuras mensagens, responda com 'remover'.");
  });

  it("resolves local asset paths with public base URL", () => {
    const resolved = resolveEmbeddableAssetUrl(
      DEFAULT_OUTREACH_SHOWCASE_PATH,
      "https://forgeos.example"
    );
    expect(resolved).toBe("https://forgeos.example/demo/outreach/jh-gomes-showcase.svg");
  });

  it("builds self-test HTML with branding safely", () => {
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");

    const branded = buildBrandedSelfTestEmailContent("ForgeOS delivery self-test body.", buildConfig());
    expect(branded.html).toContain("ForgeOS delivery self-test body.");
    expect(branded.html).toContain("jh-gomes-showcase.svg");
    expect(branded.html).toContain("João Gomes");
    expect(branded.plainText).toContain("ForgeOS delivery self-test body.");

    const request = buildSelfTestDeliveryRequest({
      confirmation: "SEND SELF TEST",
      messageBody: "ForgeOS delivery self-test body.",
      recipientEmail: "qa@example.com",
      subject: "ForgeOS delivery self-test",
      branding: {
        companyLogoReference: "/demo/outreach/jh-gomes-logo.svg",
        companyName: "JH Gomes",
        companyWebsite: "https://www.jhgomes.pt",
        showcaseImageReference: DEFAULT_OUTREACH_SHOWCASE_PATH
      }
    });

    expect(request.html).toContain("<img");
    expect(request.plainText).toContain("ForgeOS delivery self-test body.");
    expect(request.html).not.toContain("<script");
  });

  it("resolves branding config from outreach test profile references", () => {
    const config = resolveOutreachBrandingConfig({
      company,
      locale: "pt-PT",
      profile: {
        companyLogoReference: "/demo/outreach/jh-gomes-logo.svg",
        companyName: "JH Gomes",
        companyWebsite: "https://www.jhgomes.pt",
        defaultOptOutLine: "Opt-out line",
        footerCtaLabel: "Ver copos",
        footerCtaUrl: "https://www.jhgomes.pt/copos",
        senderDisplayName: "João",
        senderEmail: "joao@jhgomes.pt",
        showcaseImageReference: DEFAULT_OUTREACH_SHOWCASE_PATH
      },
      publicBaseUrl: "https://forgeos.example",
      sender
    });

    expect(config.showcaseImageUrl).toContain("jh-gomes-showcase.svg");
    expect(config.logoUrl).toContain("jh-gomes-logo.svg");
    expect(config.footerCtaLabel).toBe("Ver copos");
  });
});
