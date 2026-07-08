import { plainTextToHtml, sanitizeEmailHtml } from "@/features/email-composition/sanitize";
import { buildCategoryContentLine } from "@/features/leadops/category-content";
import { localizeCategoryLabel } from "@/features/leadops/category-localization";
import {
  containsDemoSenderValues,
  isDemoSenderEmail,
  isDemoSenderName,
  isDemoSenderPhone
} from "@/features/leadops/demo-sender-values";
import {
  formatOrganizationDisplayName,
  formatSubjectOrganizationTarget
} from "@/features/leadops/organization-display";
import {
  buildBroaderRangeLine,
  buildPersonalizedIntro,
  buildPortfolioImageAlt,
  buildPortfolioImageHtml,
  buildPortfolioImageLine,
  buildPortfolioSupportingLine,
  buildRecommendedProducts
} from "@/features/leadops/outreach-template-derived-content";
import { resolvePortfolioImageUrls } from "@/features/leadops/outreach-email-assets";
import { resolveSalutation } from "@/features/leadops/salutation-resolver";
import {
  defaultUnsubscribeInstruction,
  TEMPLATE_VARIABLE_ALIASES,
  type TemplateVariableKey
} from "@/features/leadops/template-variables";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";

export type TemplateRenderInput = {
  subjectTemplate: string;
  plainTextTemplate: string;
  htmlTemplate?: string;
  language: string;
  recipient: Pick<
    CampaignRecipient,
    | "snapshotCompanyName"
    | "snapshotContactName"
    | "snapshotCategory"
    | "snapshotRegion"
    | "snapshotWebsite"
    | "snapshotEmail"
    | "greetingOverride"
    | "organizationDisplayNameOverride"
    | "contactSalutation"
  >;
  sender: SenderIdentitySnapshot;
  company: CompanyProfileSnapshot;
  unsubscribeInstruction?: string;
  /** Public HTTPS URL only. Blob and local paths are rejected for email safety. */
  portfolioImageUrl?: string;
  /** Optional override for FORGEOS_PUBLIC_BASE_URL / NEXT_PUBLIC_APP_URL. */
  publicBaseUrl?: string;
  tenantId?: string;
  /** Delivery mode omits relative-only banner URLs; preview mode may use local asset paths. */
  renderMode?: "preview" | "delivery";
};

export type TemplateRenderResult = {
  subject: string;
  plainText: string;
  html: string;
  usedVariables: TemplateVariableKey[];
  fallbackVariables: TemplateVariableKey[];
  unresolvedVariables: string[];
  warnings: string[];
  hasUnresolvedVariables: boolean;
  preview: {
    greeting: string;
    contactName: string;
    organizationName: string;
    organizationDisplayName: string;
    localizedCategory: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    companyName: string;
    companyWebsite: string;
    usedDemoFallback: boolean;
    organizationUsedAsContact: boolean;
    untreatedEnglishCategory: boolean;
  };
};

const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

const ALLOWED_KEYS = new Set([
  "companyName",
  "contactName",
  "category",
  "categoryLabel",
  "region",
  "website",
  "senderName",
  "companySenderName",
  "senderPhone",
  "senderEmail",
  "unsubscribeInstruction",
  "personalizedIntro",
  "recommendedProducts",
  "portfolioImageUrl",
  "portfolioImageAlt",
  "portfolioImageLine",
  "portfolioImageHtml",
  "portfolioSupportingLine",
  "broaderRangeLine",
  "categoryLine",
  "regionLine",
  "regionLineHtml",
  "websiteLine",
  "greeting",
  "organizationDisplayName",
  "subjectOrganizationTarget",
  "companyWebsiteLine",
  ...Object.keys(TEMPLATE_VARIABLE_ALIASES)
]);

export function renderCampaignTemplate(input: TemplateRenderInput): TemplateRenderResult {
  const warnings: string[] = [];
  const usedVariables = new Set<TemplateVariableKey>();
  const fallbackVariables = new Set<TemplateVariableKey>();
  const { values, previewMeta } = buildVariableMap(input, usedVariables, fallbackVariables, warnings);

  const templateUnresolved = findUnknownTemplateVariables(
    `${input.subjectTemplate}\n${input.plainTextTemplate}\n${input.htmlTemplate ?? ""}`,
    ALLOWED_KEYS
  );

  const subject = cleanupRenderedText(substituteTemplate(input.subjectTemplate, values));
  const plainText = cleanupRenderedText(substituteTemplate(input.plainTextTemplate, values));
  const htmlSource = input.htmlTemplate?.trim()
    ? substituteTemplate(input.htmlTemplate, values)
    : plainTextToHtml(plainText);
  const html = sanitizeEmailHtml(cleanupRenderedHtml(htmlSource));

  const unresolvedVariables = [
    ...new Set([...templateUnresolved, ...findUnresolvedVariables(subject, plainText, html)])
  ];

  if (unresolvedVariables.length > 0) {
    warnings.push(`Unresolved variables: ${unresolvedVariables.join(", ")}`);
  }

  if (previewMeta.usedDemoFallback) {
    warnings.push("Demo sender values detected in draft.");
  }
  if (previewMeta.organizationUsedAsContact) {
    warnings.push("Organization name was treated as contact name.");
  }
  if (previewMeta.untreatedEnglishCategory) {
    warnings.push("Untranslated category code in draft.");
  }

  return {
    subject,
    plainText,
    html,
    usedVariables: [...usedVariables],
    fallbackVariables: [...fallbackVariables],
    unresolvedVariables,
    warnings,
    hasUnresolvedVariables: unresolvedVariables.length > 0,
    preview: previewMeta
  };
}

function buildVariableMap(
  input: TemplateRenderInput,
  usedVariables: Set<TemplateVariableKey>,
  fallbackVariables: Set<TemplateVariableKey>,
  warnings: string[]
): {
  values: Record<string, string>;
  previewMeta: TemplateRenderResult["preview"];
} {
  const companyName = normalizeValue(input.recipient.snapshotCompanyName);
  const rawContact = normalizeValue(input.recipient.snapshotContactName);
  const category = normalizeValue(input.recipient.snapshotCategory);
  const region = normalizeValue(input.recipient.snapshotRegion);
  const senderName = normalizeValue(input.sender.displayName);
  const senderEmail = normalizeValue(input.sender.fromEmail || input.sender.replyToEmail);
  const senderPhone = normalizeValue(input.sender.phone);
  const companySenderName = normalizeValue(input.company.tradingName || input.company.legalName);
  const companyWebsite = normalizeValue(input.company.websiteUrl);
  const unsubscribeInstruction =
    normalizeValue(input.unsubscribeInstruction) || defaultUnsubscribeInstruction(input.language);

  const organizationDisplayName =
    normalizeValue(input.recipient.organizationDisplayNameOverride) ||
    formatOrganizationDisplayName(companyName, category, input.language);

  const salutation = resolveSalutation({
    contactName: rawContact,
    organizationName: companyName,
    email: input.recipient.snapshotEmail,
    salutationOverride: input.recipient.greetingOverride,
    contactSalutation: input.recipient.contactSalutation ?? undefined,
    locale: input.language
  });

  const localizedCategory = localizeCategoryLabel(category, input.language);
  const categoryLine = buildCategoryContentLine(
    category,
    companyName,
    input.recipient.organizationDisplayNameOverride,
    input.language
  );

  const regionLine = region
    ? input.language.startsWith("pt")
      ? `Trabalhamos regularmente com organizações na região de ${region}.`
      : `We regularly work with organizations in ${region}.`
    : "";

  const regionLineHtml = regionLine ? `<p>${regionLine}</p>` : "";

  const personalizedIntro = buildPersonalizedIntro({
    organizationDisplayName,
    localizedCategory,
    region,
    companySenderName,
    locale: input.language
  });

  const recommendedProducts = buildRecommendedProducts(category, input.language);
  const broaderRangeLine = buildBroaderRangeLine(localizedCategory, input.language);
  const portfolioAsset = resolvePortfolioImageUrls({
    portfolioImageUrl: input.portfolioImageUrl,
    publicBaseUrl: input.publicBaseUrl,
    tenantId: input.tenantId ?? input.company.tenantId
  });
  const portfolioImageUrl = portfolioAsset?.absoluteUrl ?? "";
  const portfolioImageAlt = buildPortfolioImageAlt(input.language);
  const portfolioImageLine = buildPortfolioImageLine(
    portfolioImageUrl,
    portfolioImageAlt,
    input.language
  );
  const portfolioSupportingLine = buildPortfolioSupportingLine(input.language);
  const portfolioImageHtml = buildPortfolioImageHtml(portfolioImageUrl, portfolioImageAlt, {
    width: portfolioAsset?.width,
    previewUrl: input.renderMode === "preview" ? portfolioAsset?.previewUrl : undefined
  });

  if (portfolioAsset && !portfolioImageUrl && portfolioAsset.relativePath) {
    warnings.push(
      "Portfolio banner omitted from delivered HTML until FORGEOS_PUBLIC_BASE_URL is configured."
    );
  }

  const companyWebsiteLine =
    companyWebsite && input.language.startsWith("pt")
      ? `Mais informação em ${companyWebsite}.`
      : companyWebsite
        ? `More information at ${companyWebsite}.`
        : "";

  const subjectOrganizationTarget = formatSubjectOrganizationTarget(
    organizationDisplayName,
    category,
    input.language
  );

  const usedDemoFallback = containsDemoSenderValues([senderName, senderEmail, senderPhone]);
  const organizationUsedAsContact =
    salutation.treatedContactAsUnnamed && Boolean(rawContact) && rawContact !== salutation.resolvedContactName;

  if (companyName) usedVariables.add("companyName");
  else warnings.push("Missing organization name.");

  if (salutation.resolvedContactName) usedVariables.add("contactName");
  else fallbackVariables.add("contactName");

  if (category) usedVariables.add("category");
  if (localizedCategory) usedVariables.add("categoryLabel" as TemplateVariableKey);
  if (region) usedVariables.add("region");
  usedVariables.add("personalizedIntro");
  usedVariables.add("recommendedProducts");
  usedVariables.add("portfolioImageAlt");
  if (portfolioSupportingLine) usedVariables.add("portfolioSupportingLine" as TemplateVariableKey);
  if (senderName) usedVariables.add("senderName");
  else warnings.push("Missing sender name in Settings.");
  if (companySenderName) usedVariables.add("companySenderName");
  else warnings.push("Missing company name in Settings.");
  if (senderPhone) usedVariables.add("senderPhone");
  if (senderEmail) usedVariables.add("senderEmail");
  else warnings.push("Missing sender email in Settings.");
  usedVariables.add("unsubscribeInstruction");

  if (isDemoSenderEmail(senderEmail)) warnings.push("Sender email still uses demo seed value.");
  if (isDemoSenderPhone(senderPhone)) warnings.push("Sender phone still uses demo seed value.");
  if (isDemoSenderName(senderName)) warnings.push("Sender name still uses demo seed value.");

  const untreatedEnglishCategory =
    Boolean(category) &&
    input.language.startsWith("pt") &&
    localizedCategory === category &&
    /[A-Za-z]/.test(category);

  return {
    values: withTemplateAliases({
      companyName,
      contactName: salutation.resolvedContactName,
      category: localizedCategory,
      categoryLabel: localizedCategory,
      region,
      website: "",
      senderName,
      companySenderName,
      senderPhone,
      senderEmail,
      unsubscribeInstruction,
      personalizedIntro,
      recommendedProducts,
      portfolioImageUrl,
      portfolioImageAlt,
      portfolioImageLine,
      portfolioImageHtml,
      portfolioSupportingLine,
      broaderRangeLine,
      categoryLine,
      regionLine,
      regionLineHtml,
      websiteLine: "",
      greeting: salutation.greeting,
      organizationDisplayName,
      subjectOrganizationTarget,
      companyWebsiteLine
    }),
    previewMeta: {
      greeting: salutation.greeting,
      contactName: salutation.resolvedContactName,
      organizationName: companyName,
      organizationDisplayName,
      localizedCategory,
      senderName,
      senderEmail,
      senderPhone,
      companyName: companySenderName,
      companyWebsite,
      usedDemoFallback,
      organizationUsedAsContact,
      untreatedEnglishCategory
    }
  };
}

export function substituteTemplate(template: string, values: Record<string, string>): string {
  return template.replace(PLACEHOLDER_PATTERN, (_match, rawKey: string) => {
    const key = rawKey.trim();
    const resolvedKey = TEMPLATE_VARIABLE_ALIASES[key] ?? key;
    return values[resolvedKey] ?? values[key] ?? "";
  });
}

function withTemplateAliases(values: Record<string, string>): Record<string, string> {
  const aliased: Record<string, string> = { ...values };

  for (const [alias, canonical] of Object.entries(TEMPLATE_VARIABLE_ALIASES)) {
    aliased[alias] = values[canonical] ?? "";
  }

  return aliased;
}

export function findUnresolvedVariables(...parts: string[]): string[] {
  const unresolved = new Set<string>();
  for (const part of parts) {
    const matches = part.matchAll(PLACEHOLDER_PATTERN);
    for (const match of matches) {
      unresolved.add(match[1]?.trim() ?? match[0]);
    }
  }
  return [...unresolved];
}

export function findUnknownTemplateVariables(template: string, allowedKeys: Set<string>): string[] {
  const unresolved = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    const key = match[1]?.trim() ?? "";
    if (key && !allowedKeys.has(key)) unresolved.add(key);
  }
  return [...unresolved];
}

export function cleanupRenderedText(text: string): string {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function cleanupRenderedHtml(html: string): string {
  return html.replace(/<p>\s*<\/p>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeValue(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

export function countUnresolvedInTemplate(
  subjectTemplate: string,
  plainTextTemplate: string,
  htmlTemplate = ""
): string[] {
  return findUnknownTemplateVariables(
    `${subjectTemplate}\n${plainTextTemplate}\n${htmlTemplate}`,
    ALLOWED_KEYS
  );
}
