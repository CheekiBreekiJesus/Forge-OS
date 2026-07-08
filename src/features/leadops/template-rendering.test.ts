import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { DEFAULT_PT_CUP_OUTREACH_TEMPLATE } from "@/features/leadops/default-templates";
import { JH_GOMES_CUSTOM_CUPS_BANNER } from "@/features/leadops/outreach-email-assets";
import {
  DEFAULT_PORTFOLIO_IMAGE_ALT_PT,
  DEFAULT_PORTFOLIO_SUPPORTING_LINE_PT
} from "@/features/leadops/outreach-template-derived-content";
import {
  cleanupRenderedText,
  countUnresolvedInTemplate,
  renderCampaignTemplate
} from "@/features/leadops/template-rendering";
import { TEMPLATE_VARIABLES } from "@/features/leadops/template-variables";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";

const company: CompanyProfileSnapshot = {
  addressLine1: "Rua 1",
  addressLine2: "",
  city: "Lisboa",
  country: "Portugal",
  defaultCurrency: "EUR",
  defaultLanguage: "pt-PT",
  facebookUrl: "",
  generalEmail: "geral@example.pt",
  generalPhone: "",
  id: "c1",
  legalFooter: "Footer",
  legalName: "Forge Cups Lda",
  linkedinUrl: "",
  logoLocalAssetId: null,
  logoPublicUrl: "",
  postalCode: "1000",
  region: "",
  tenantId: "tenant_jh_gomes",
  tradingName: "Forge Cups",
  vatNumber: "PT1",
  websiteUrl: "https://example.pt"
};

const sender: SenderIdentitySnapshot = {
  active: true,
  companyProfileId: "c1",
  defaultLanguage: "pt-PT",
  displayName: "Maria Silva",
  fromEmail: "maria@example.pt",
  id: "s1",
  isDefault: true,
  jobTitle: "Comercial",
  phone: "+351 910 000 000",
  replyToEmail: "maria@example.pt",
  signatureHtml: "",
  signatureText: "",
  tenantId: "tenant_jh_gomes",
  userProfileId: "u1"
};

const recipient = {
  snapshotCompanyName: "Hotel Atlântico",
  snapshotContactName: "Pedro Costa",
  snapshotCategory: "Hospitality",
  snapshotRegion: "Lisboa",
  snapshotWebsite: "https://hotel.example",
  snapshotEmail: "pedro@hotel.example",
  greetingOverride: "",
  organizationDisplayNameOverride: "",
  contactSalutation: null
};

describe("template rendering", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("substitutes every supported variable", () => {
    const template = TEMPLATE_VARIABLES.map((key) => `{{${key}}}`).join(" | ");
    const result = renderCampaignTemplate({
      subjectTemplate: "Hello {{companyName}}",
      plainTextTemplate: template,
      language: "pt-PT",
      recipient,
      sender,
      company
    });

    for (const key of TEMPLATE_VARIABLES) {
      expect(result.plainText).not.toContain(`{{${key}}}`);
    }
    expect(result.plainText).toContain("Hotel Atlântico");
    expect(result.plainText).toContain("Pedro Costa");
    expect(result.plainText).toContain("Maria Silva");
    expect(result.plainText).toContain("Forge Cups");
    expect(result.hasUnresolvedVariables).toBe(false);
  });

  it("uses a neutral greeting when contact name is missing", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: "Olá {{organizationDisplayName}}",
      plainTextTemplate: "{{greeting}}",
      language: "pt-PT",
      recipient: {
        ...recipient,
        snapshotContactName: "",
        snapshotEmail: "geral@example.invalid",
        greetingOverride: "",
        organizationDisplayNameOverride: "",
        contactSalutation: null
      },
      sender,
      company
    });

    expect(result.plainText).toContain("Exmos. Senhores,");
    expect(result.fallbackVariables).toContain("contactName");
    expect(result.plainText).not.toContain("{{contactName}}");
  });

  it("omits regional and website phrases when values are missing", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      language: "pt-PT",
      recipient: {
        ...recipient,
        snapshotRegion: "",
        snapshotWebsite: ""
      },
      sender,
      company
    });

    expect(result.plainText).not.toMatch(/região de\s*\./i);
    expect(result.plainText).not.toMatch(/Pode encontrar mais informação em\s*\./);
    expect(result.plainText).not.toContain("{{regionLine}}");
    expect(result.plainText).not.toContain("{{websiteLine}}");
  });

  it("detects unresolved variables and never invents values", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: "Offer for {{companyName}}",
      plainTextTemplate: "Hello {{contactName}}\nUnknown {{customField}}",
      language: "en",
      recipient,
      sender,
      company
    });

    expect(result.unresolvedVariables).toContain("customField");
    expect(result.hasUnresolvedVariables).toBe(true);
    expect(result.plainText).not.toContain("customField value");
  });

  it("cleans awkward whitespace and punctuation", () => {
    const cleaned = cleanupRenderedText("Hello ,  world.\n\n\n\nNext line.");
    expect(cleaned).toBe("Hello, world.\n\nNext line.");
  });

  it("sanitizes derived HTML", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: "Test",
      plainTextTemplate: "Safe line\n<script>alert(1)</script>",
      language: "en",
      recipient,
      sender,
      company
    });

    expect(result.html).not.toContain("<script");
    expect(result.html).toContain("Safe line");
  });

  it("counts unresolved placeholders in templates before generation", () => {
    const unresolved = countUnresolvedInTemplate(
      "Hello {{companyName}}",
      "Body with {{unknownToken}}"
    );
    expect(unresolved).toContain("unknownToken");
  });

  it("renders the default PT template without unresolved variables", () => {
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company,
      tenantId: company.tenantId
    });

    expect(result.hasUnresolvedVariables).toBe(false);
    expect(result.subject).toContain("Hotel Atlântico");
    expect(result.plainText).toContain("copos reutilizáveis");
    expect(result.plainText).toContain("orçamento");
    expect(result.plainText).toContain("mockup");
    expect(result.plainText).toContain("250 ml");
    expect(result.html).toContain(DEFAULT_PORTFOLIO_IMAGE_ALT_PT);
    expect(result.html).toContain(DEFAULT_PORTFOLIO_SUPPORTING_LINE_PT);
    expect(result.html).not.toContain("Exemplo de copo personalizado JH Gomes");
  });

  it("supports snake_case template aliases", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: "Olá {{company_name}}",
      plainTextTemplate: "{{personalized_intro}}\n{{recommended_products}}\n{{unsubscribe_text}}",
      language: "pt-PT",
      recipient,
      sender,
      company
    });

    expect(result.hasUnresolvedVariables).toBe(false);
    expect(result.subject).toContain("Hotel Atlântico");
    expect(result.plainText).toContain("copos reutilizáveis");
    expect(result.plainText).toContain("Remover");
  });

  it("renders public HTTPS portfolio images in HTML and plain text", () => {
    const portfolioUrl = "https://cdn.example.pt/mockups/cup-preview.svg";
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company,
      portfolioImageUrl: portfolioUrl
    });

    expect(result.html).toContain(`src="${portfolioUrl}"`);
    expect(result.plainText).toContain("250 ml");
    expect(result.plainText).not.toContain(portfolioUrl);
  });

  it("places the banner before the CTA and uses an absolute URL for delivery", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company,
      tenantId: company.tenantId,
      publicBaseUrl: "https://forgeos.example"
    });

    const bannerIndex = result.html.indexOf(JH_GOMES_CUSTOM_CUPS_BANNER.relativePath);
    const ctaIndex = result.html.indexOf("orçamento");
    expect(bannerIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(bannerIndex);
    expect(result.html).toContain(`https://forgeos.example${JH_GOMES_CUSTOM_CUPS_BANNER.relativePath}`);
    expect(result.html).toContain('width="600"');
  });

  it("rejects non-HTTPS portfolio URLs and keeps accessible plain text", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company,
      tenantId: company.tenantId,
      publicBaseUrl: "https://forgeos.example",
      portfolioImageUrl: "blob:http://localhost/mockup"
    });

    expect(result.html).toContain(`https://forgeos.example${JH_GOMES_CUSTOM_CUPS_BANNER.relativePath}`);
    expect(result.html).not.toContain("blob:");
    expect(result.plainText).toContain("250 ml");
  });

  it("omits delivered banner HTML when no valid public base URL exists", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company,
      tenantId: company.tenantId,
      publicBaseUrl: "",
      renderMode: "delivery"
    });

    expect(result.html).not.toContain('src="/assets/');
    expect(result.html).not.toContain("localhost");
    expect(result.plainText).toContain("250 ml");
    expect(result.warnings.some((warning) => warning.includes("FORGEOS_PUBLIC_BASE_URL"))).toBe(true);
  });

  it("uses a relative preview banner in local HTML when only preview URL is available", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company,
      tenantId: company.tenantId,
      publicBaseUrl: "",
      renderMode: "preview"
    });

    expect(result.html).toContain(`src="${JH_GOMES_CUSTOM_CUPS_BANNER.relativePath}"`);
  });

  it("includes plain text and HTML for default PT outreach template", () => {
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company,
      tenantId: company.tenantId
    });

    expect(result.plainText.trim().length).toBeGreaterThan(100);
    expect(result.html).toContain("<p>");
    expect(result.plainText).toContain("copos reutilizáveis");
    expect(result.html).toContain("copos reutilizáveis");
    expect(result.plainText).not.toContain("<img");
    expect(result.html).toContain("Remover");
  });
});
