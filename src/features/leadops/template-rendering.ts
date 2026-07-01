import type { CampaignRecipient } from "@/domain/campaign-types";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import { plainTextToHtml, sanitizeEmailHtml } from "@/features/email-composition/sanitize";
import {
  defaultUnsubscribeInstruction,
  type TemplateVariableKey
} from "@/features/leadops/template-variables";

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
  >;
  sender: SenderIdentitySnapshot;
  company: CompanyProfileSnapshot;
  unsubscribeInstruction?: string;
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
};

const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

export function renderCampaignTemplate(input: TemplateRenderInput): TemplateRenderResult {
  const warnings: string[] = [];
  const usedVariables = new Set<TemplateVariableKey>();
  const fallbackVariables = new Set<TemplateVariableKey>();
  const { values, allowedKeys } = buildVariableMap(input, usedVariables, fallbackVariables, warnings);

  const templateUnresolved = findUnknownTemplateVariables(
    `${input.subjectTemplate}\n${input.plainTextTemplate}`,
    allowedKeys
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

  return {
    subject,
    plainText,
    html,
    usedVariables: [...usedVariables],
    fallbackVariables: [...fallbackVariables],
    unresolvedVariables,
    warnings,
    hasUnresolvedVariables: unresolvedVariables.length > 0
  };
}

function buildVariableMap(
  input: TemplateRenderInput,
  usedVariables: Set<TemplateVariableKey>,
  fallbackVariables: Set<TemplateVariableKey>,
  warnings: string[]
): { values: Record<string, string>; allowedKeys: Set<string> } {
  const companyName = normalizeValue(input.recipient.snapshotCompanyName);
  const rawContact = normalizeValue(input.recipient.snapshotContactName);
  const category = normalizeValue(input.recipient.snapshotCategory);
  const region = normalizeValue(input.recipient.snapshotRegion);
  const website = normalizeValue(input.recipient.snapshotWebsite);
  const senderName = normalizeValue(input.sender.displayName);
  const companySenderName = normalizeValue(
    input.company.tradingName || input.company.legalName
  );
  const senderPhone = normalizeValue(input.sender.phone);
  const senderEmail = normalizeValue(input.sender.fromEmail);
  const unsubscribeInstruction =
    normalizeValue(input.unsubscribeInstruction) ||
    defaultUnsubscribeInstruction(input.language);

  let contactName = rawContact;
  if (!contactName) {
    contactName = input.language.startsWith("pt") ? "Senhor(a)" : "Sir/Madam";
    fallbackVariables.add("contactName");
  } else {
    usedVariables.add("contactName");
  }

  if (companyName) usedVariables.add("companyName");
  else warnings.push("Missing organization name.");

  if (category) usedVariables.add("category");
  if (region) usedVariables.add("region");
  if (website) usedVariables.add("website");
  if (senderName) usedVariables.add("senderName");
  else warnings.push("Missing sender name in Settings.");
  if (companySenderName) usedVariables.add("companySenderName");
  else warnings.push("Missing company name in Settings.");
  if (senderPhone) usedVariables.add("senderPhone");
  if (senderEmail) usedVariables.add("senderEmail");
  else warnings.push("Missing sender email in Settings.");
  usedVariables.add("unsubscribeInstruction");

  const categoryLine = category
    ? input.language.startsWith("pt")
      ? `A sua área de atividade (${category}) encaixa-se bem com soluções que já fornecemos.`
      : `Your field (${category}) aligns well with solutions we already supply.`
    : "";

  const regionLine = region
    ? input.language.startsWith("pt")
      ? `Trabalhamos regularmente com organizações na região de ${region}.`
      : `We regularly work with organizations in ${region}.`
    : "";

  const websiteLine = website
    ? input.language.startsWith("pt")
      ? `Pode encontrar mais informação em ${website}.`
      : `You can find more information at ${website}.`
    : "";

  return {
    values: {
      companyName,
      contactName,
      category,
      region,
      website,
      senderName,
      companySenderName,
      senderPhone,
      senderEmail,
      unsubscribeInstruction,
      categoryLine,
      regionLine,
      websiteLine
    },
    allowedKeys: new Set([
      "companyName",
      "contactName",
      "category",
      "region",
      "website",
      "senderName",
      "companySenderName",
      "senderPhone",
      "senderEmail",
      "unsubscribeInstruction",
      "categoryLine",
      "regionLine",
      "websiteLine"
    ])
  };
}

export function substituteTemplate(template: string, values: Record<string, string>): string {
  return template.replace(PLACEHOLDER_PATTERN, (_match, rawKey: string) => {
    const key = rawKey.trim();
    return values[key] ?? "";
  });
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
  plainTextTemplate: string
): string[] {
  const allowedKeys = new Set([
    "companyName",
    "contactName",
    "category",
    "region",
    "website",
    "senderName",
    "companySenderName",
    "senderPhone",
    "senderEmail",
    "unsubscribeInstruction",
    "categoryLine",
    "regionLine",
    "websiteLine"
  ]);
  return findUnknownTemplateVariables(`${subjectTemplate}\n${plainTextTemplate}`, allowedKeys);
}
