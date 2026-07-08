import { describe, expect, it } from "vitest";
import { buildMinimizedAIInput, minimizedInputToPrompt } from "@/features/email-composition/ai-input";
import {
  buildGmailComposeUrl,
  buildMailtoUrl,
  buildOutlookComposeUrl,
  formatPlainTextForCopy,
  getLocaleLabel
} from "@/features/email-composition/copy";
import { validateLocalAsset } from "@/features/email-composition/local-asset";
import { composeEmail } from "@/features/email-composition/renderer";
import { sanitizeEmailHtml } from "@/features/email-composition/sanitize";
import { renderSignature } from "@/features/email-composition/signature";
import { isEmbeddableImageUrl, validateProductUrls } from "@/features/email-composition/url-utils";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";

const company: CompanyProfileSnapshot = {
  addressLine1: "Rua Demo 1",
  addressLine2: "",
  city: "Oliveira de Azeméis",
  country: "Portugal",
  defaultCurrency: "EUR",
  defaultLanguage: "pt-PT",
  facebookUrl: "",
  generalEmail: "geral@jhgomes.pt",
  generalPhone: "+351 256 000 000",
  id: "c1",
  legalFooter: "Mensagem comercial.",
  legalName: "JH Gomes, Lda.",
  linkedinUrl: "",
  logoLocalAssetId: "asset1",
  logoPublicUrl: "",
  postalCode: "3720-000",
  region: "Aveiro",
  tenantId: "tenant_jh_gomes",
  tradingName: "JH Gomes",
  vatNumber: "PT123",
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

describe("email composition", () => {
  it("renders signature without blank lines for missing optional fields", () => {
    const minimalSender = { ...sender, phone: "", jobTitle: "" };
    const sig = renderSignature(minimalSender, company, "pt-PT");
    expect(sig.plainText).toContain("João Gomes");
    expect(sig.plainText).not.toMatch(/\n\n\n/);
    expect(sig.plainText).not.toContain("Telefone:");
  });

  it("composes email with trusted links and signature", () => {
    const composition = composeEmail({
      aiCopy: {
        callToAction: "Podemos falar?",
        contextUsed: ["lead industry"],
        greeting: "Olá Rita,",
        introduction: "Introdução.",
        offerBody: "Oferta de copos.",
        subject: "Copos personalizados"
      },
      companyProfile: company,
      fallbackUsed: true,
      locale: "pt-PT",
      model: "deterministic",
      products: [
        {
          customizerUrl: "https://www.jhgomes.pt/personalizar",
          defaultCtaLabel: "Ver produto",
          emailDescription: "Copos PP",
          emailTitle: "Copos PP 250ml",
          id: "p1",
          imageUrl: "https://cdn.example.com/cup.png",
          name: "Copos PP",
          productPageUrl: "https://www.jhgomes.pt/copos",
          sku: "SKU1",
          thumbnailUrl: ""
        }
      ],
      provider: "deterministic",
      senderIdentity: sender
    });

    expect(composition.plainText).toContain("João Gomes");
    expect(composition.plainText).toContain("https://www.jhgomes.pt");
    expect(composition.plainText).toContain("Mensagem comercial.");
    expect(composition.links.some((l) => l.url.includes("jhgomes.pt"))).toBe(true);
    expect(composition.localOnlyImageWarning).toBe(true);
  });

  it("sanitizes unsafe HTML", () => {
    const html = sanitizeEmailHtml('<p>Safe</p><script>alert(1)</script><a href="javascript:evil">x</a>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });

  it("validates product URLs", () => {
    expect(validateProductUrls({ productPageUrl: "not-a-url" }).valid).toBe(false);
    expect(validateProductUrls({ productPageUrl: "https://example.com/p" }).valid).toBe(true);
  });

  it("rejects local-only embeddable URLs", () => {
    expect(isEmbeddableImageUrl("blob:http://localhost/x")).toBe(false);
    expect(isEmbeddableImageUrl("https://cdn.example.com/logo.png")).toBe(true);
  });

  it("validates local assets", () => {
    expect(validateLocalAsset({ name: "logo.png", size: 1000, type: "image/png" }).ok).toBe(true);
    expect(validateLocalAsset({ name: "bad.exe", size: 1000, type: "application/octet-stream" }).ok).toBe(false);
  });

  it("builds mailto and web compose URLs", () => {
    const mailto = buildMailtoUrl({ body: "Hello", subject: "Test", to: "a@b.com" });
    expect(mailto.url.startsWith("mailto:a@b.com")).toBe(true);
    expect(buildGmailComposeUrl({ body: "Hi", subject: "S", to: "a@b.com" }).url).toContain("mail.google.com");
    expect(buildOutlookComposeUrl({ body: "Hi", subject: "S", to: "a@b.com" }).url).toContain("outlook.office.com");
  });

  it("formats plain text copy with subject label", () => {
    const composition = composeEmail({
      aiCopy: {
        callToAction: "CTA",
        contextUsed: [],
        greeting: "Olá",
        introduction: "Intro",
        offerBody: "Body",
        subject: "Assunto teste"
      },
      companyProfile: company,
      fallbackUsed: false,
      locale: "pt-PT",
      model: "test",
      products: [],
      provider: "test",
      senderIdentity: sender
    });
    expect(formatPlainTextForCopy(composition, true)).toContain("Assunto: Assunto teste");
  });

  it("minimizes AI input", () => {
    const input = buildMinimizedAIInput({
      campaignObjective: "Campanha Q2",
      hasWebsiteContext: false,
      language: "pt-PT",
      lead: {
        companyName: "ACME",
        contactName: "Ana",
        email: "a@acme.com",
        id: "l1",
        industry: "Food",
        language: "pt-PT",
        location: "Porto",
        quality: "high",
        source: "csv",
        sourceDatabase: "Demo",
        status: "ready",
        tenantId: "t1",
        website: null,
        campaignId: null
      },
      selectedProductNames: ["copos"],
      tone: "professional",
      websiteSummary: "limited"
    });
    const prompt = minimizedInputToPrompt(input);
    expect(prompt).toContain("Do NOT include URLs");
    expect(prompt).not.toContain("PT123");
  });

  it("uses PT and EN locale labels", () => {
    expect(getLocaleLabel("pt-PT")).toBe("PT");
    expect(getLocaleLabel("en")).toBe("EN");
  });
});
