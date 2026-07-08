import { describe, expect, it } from "vitest";
import { formatOrganizationDisplayName, hasMunicipalityPrefix } from "@/features/leadops/organization-display";
import { resolveSalutation } from "@/features/leadops/salutation-resolver";
import { localizeCategoryLabel } from "@/features/leadops/category-localization";
import { renderCampaignTemplate } from "@/features/leadops/template-rendering";
import { DEFAULT_PT_CUP_OUTREACH_TEMPLATE } from "@/features/leadops/default-templates";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";

const company: CompanyProfileSnapshot = {
  addressLine1: "",
  addressLine2: "",
  city: "Lisboa",
  country: "Portugal",
  defaultCurrency: "EUR",
  defaultLanguage: "pt-PT",
  facebookUrl: "",
  generalEmail: "geral@synthetic.example",
  generalPhone: "",
  id: "c1",
  legalFooter: "",
  legalName: "Synthetic Cups Lda",
  linkedinUrl: "",
  logoLocalAssetId: null,
  logoPublicUrl: "",
  postalCode: "",
  region: "",
  tenantId: "tenant_test",
  tradingName: "Synthetic Cups",
  vatNumber: "PT1",
  websiteUrl: "https://synthetic.example"
};

const sender: SenderIdentitySnapshot = {
  active: true,
  companyProfileId: "c1",
  defaultLanguage: "pt-PT",
  displayName: "Ana Operador",
  fromEmail: "ana.operator@synthetic.example",
  id: "s1",
  isDefault: true,
  jobTitle: "Comercial",
  phone: "+351 244 111 222",
  replyToEmail: "ana.operator@synthetic.example",
  signatureHtml: "",
  signatureText: "",
  tenantId: "tenant_test",
  userProfileId: "u1"
};

describe("salutation resolver", () => {
  it("uses institutional greeting for municipality without contact", () => {
    const result = resolveSalutation({
      contactName: "",
      organizationName: "Tábua",
      email: "geral@example.invalid",
      locale: "pt-PT"
    });
    expect(result.greeting).toBe("Exmos. Senhores,");
    expect(result.usedInstitutionalFallback).toBe(true);
  });

  it("treats organization copied into contactName as unnamed", () => {
    const result = resolveSalutation({
      contactName: "Tábua",
      organizationName: "Tábua",
      email: "geral@example.invalid",
      locale: "pt-PT"
    });
    expect(result.greeting).toBe("Exmos. Senhores,");
    expect(result.treatedContactAsUnnamed).toBe(true);
  });

  it("uses generic email heuristic for info@", () => {
    const result = resolveSalutation({
      contactName: "Pedro",
      organizationName: "Hotel Demo",
      email: "info@example.invalid",
      locale: "pt-PT"
    });
    expect(result.greeting).toBe("Exmos. Senhores,");
  });

  it("supports explicit male and female salutations", () => {
    expect(
      resolveSalutation({
        contactName: "João Silva",
        organizationName: "ACME",
        contactSalutation: "male",
        locale: "pt-PT"
      }).greeting
    ).toBe("Exmo. Senhor João Silva,");
    expect(
      resolveSalutation({
        contactName: "Maria Costa",
        organizationName: "ACME",
        contactSalutation: "female",
        locale: "pt-PT"
      }).greeting
    ).toBe("Exma. Senhora Maria Costa,");
  });

  it("honours manual greeting override", () => {
    const result = resolveSalutation({
      contactName: "",
      organizationName: "Tábua",
      salutationOverride: "Caros amigos,",
      locale: "pt-PT"
    });
    expect(result.greeting).toBe("Caros amigos,");
  });
});

describe("organization display", () => {
  it("formats municipality names", () => {
    expect(formatOrganizationDisplayName("Tábua", "Municipality", "pt-PT")).toBe(
      "Município de Tábua"
    );
    expect(hasMunicipalityPrefix("Município de Sintra")).toBe(true);
    expect(formatOrganizationDisplayName("Município de Sintra", "Municipality", "pt-PT")).toBe(
      "Município de Sintra"
    );
    expect(formatOrganizationDisplayName("Câmara Municipal de Coimbra", "Municipality", "pt-PT")).toBe(
      "Câmara Municipal de Coimbra"
    );
  });
});

describe("category localization", () => {
  it("localizes municipality category to PT", () => {
    expect(localizeCategoryLabel("Municipality", "pt-PT")).toBe("Município");
  });
});

describe("municipality draft rendering", () => {
  it("matches acceptance example for synthetic municipality lead", () => {
    const result = renderCampaignTemplate({
      subjectTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.subjectTemplate,
      plainTextTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.plainTextTemplate,
      htmlTemplate: DEFAULT_PT_CUP_OUTREACH_TEMPLATE.htmlTemplate,
      language: "pt-PT",
      recipient: {
        snapshotCompanyName: "Tábua",
        snapshotContactName: "",
        snapshotCategory: "Municipality",
        snapshotRegion: "",
        snapshotWebsite: "https://tabua.example",
        snapshotEmail: "geral@example.invalid",
        greetingOverride: "",
        organizationDisplayNameOverride: "",
        contactSalutation: null
      },
      sender,
      company
    });

    expect(result.subject).toBe("Copos personalizados para o Município de Tábua");
    expect(result.plainText).toContain("Exmos. Senhores,");
    expect(result.plainText).toContain("Município de Tábua");
    expect(result.plainText).not.toContain("Municipality");
    expect(result.plainText).toContain("copos reutilizáveis");
    expect(result.plainText).toContain("orçamento");
    expect(result.plainText).not.toMatch(/Pode encontrar mais informação em/i);
    expect(result.plainText).toContain("ana.operator@synthetic.example");
    expect(result.plainText).toContain("+351 244 111 222");
    expect(result.plainText).not.toContain("joao.gomes@demo.local");
  });
});
