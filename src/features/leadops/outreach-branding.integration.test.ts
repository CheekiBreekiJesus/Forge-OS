import { describe, expect, it } from "vitest";
import { generateDeterministicOutreachEmail } from "@/features/leadops/providers";
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
  generalPhone: "",
  id: "c1",
  legalFooter: "Footer legal",
  legalName: "JH Gomes",
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
  displayName: "João",
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

describe("outreach integration", () => {
  it("generates deterministic email with trusted signature and links", () => {
    const result = generateDeterministicOutreachEmail({
      campaign: {
        id: "camp1",
        name: "Q2",
        sentCount: 0,
        status: "active",
        tenantId: "tenant_jh_gomes",
        totalCount: 10
      },
      companyProfile: company,
      context: {
        hasWebsiteContext: false,
        personalizationNotes: [],
        summary: "Limited"
      },
      lead: {
        campaignId: null,
        companyName: "ACME",
        contactName: "Ana",
        email: "ana@acme.com",
        id: "lead1",
        industry: "Food",
        language: "pt-PT",
        location: "Porto",
        quality: "high",
        source: "csv",
        sourceDatabase: "Demo",
        status: "ready",
        tenantId: "tenant_jh_gomes",
        website: null
      },
      locale: "pt-PT",
      productKeys: ["customized-plastic-cups"],
      products: [
        {
          customizerUrl: "https://www.jhgomes.pt/personalizar",
          defaultCtaLabel: "Ver",
          emailDescription: "Copos",
          emailTitle: "Copos PP",
          id: "p1",
          imageUrl: "https://cdn.example.com/cup.png",
          name: "Copos",
          productPageUrl: "https://www.jhgomes.pt/copos",
          sku: "SKU",
          thumbnailUrl: ""
        }
      ],
      senderIdentity: sender,
      tone: "professional"
    });

    expect(result.message.composition?.plainText).toContain("joao@jhgomes.pt");
    expect(result.message.composition?.plainText).toContain("https://www.jhgomes.pt");
    expect(result.message.approved).toBe(false);
  });
});
