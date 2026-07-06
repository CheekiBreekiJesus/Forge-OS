import { describe, expect, it } from "vitest";
import { DEFAULT_PT_CUP_OUTREACH_TEMPLATE } from "@/features/leadops/default-templates";
import {
  cleanupRenderedText,
  countUnresolvedInTemplate,
  renderCampaignTemplate
} from "@/features/leadops/template-rendering";
import { TEMPLATE_VARIABLES } from "@/features/leadops/template-variables";
import type { OutreachBrandingConfig } from "@/features/email-composition/outreach-branding-config";
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
  tenantId: "tenant_a",
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
  tenantId: "tenant_a",
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

const branding: OutreachBrandingConfig = {
  companyName: "Forge Cups",
  companyWebsite: "https://example.pt",
  footerCtaLabel: "Ver copos",
  footerCtaUrl: "https://example.pt/copos",
  locale: "pt-PT",
  logoUrl: "https://forgeos.example/demo/outreach/jh-gomes-logo.svg",
  optOutLine: "Se preferir não receber futuras mensagens, responda com 'remover'.",
  senderEmail: "maria@example.pt",
  senderName: "Maria Silva",
  senderPhone: "+351 910 000 000",
  showcaseImageCaption: "Exemplos de copos personalizados produzidos pela JH Gomes",
  showcaseImageUrl: "https://forgeos.example/demo/outreach/jh-gomes-showcase.svg"
};

describe("template rendering", () => {
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
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company
    });

    expect(result.hasUnresolvedVariables).toBe(false);
    expect(result.subject).toContain("Hotel Atlântico");
    expect(result.plainText).toContain("copos personalizados");
  });

  it("adds showcase and footer blocks when branding config is provided", () => {
    const result = renderCampaignTemplate({
      branding,
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      language: "pt-PT",
      recipient,
      sender,
      company
    });

    expect(result.html).toContain("jh-gomes-showcase.svg");
    expect(result.html).toContain("jh-gomes-logo.svg");
    expect(result.html).toContain("Maria Silva");
    expect(result.plainText).toContain("Exemplos de copos personalizados produzidos pela JH Gomes");
    expect(result.plainText).toContain("Maria Silva");
  });
});
