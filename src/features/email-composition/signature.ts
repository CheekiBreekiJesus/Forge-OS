import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { EmailSignature } from "./types";

const LABELS = {
  "pt-PT": {
    phone: "Telefone",
    email: "Email",
    replyTo: "Responder para",
    vat: "NIF",
    website: "Website"
  },
  en: {
    phone: "Phone",
    email: "Email",
    replyTo: "Reply to",
    vat: "VAT",
    website: "Website"
  }
} as const;

function formatAddress(company: CompanyProfileSnapshot): string {
  const parts = [
    company.addressLine1,
    company.addressLine2,
    [company.postalCode, company.city].filter(Boolean).join(" "),
    company.region,
    company.country
  ].filter((p) => p && p.trim());
  return parts.join(", ");
}

export function renderSignature(
  sender: SenderIdentitySnapshot,
  company: CompanyProfileSnapshot,
  locale: "pt-PT" | "en"
): EmailSignature {
  if (sender.signatureText.trim() || sender.signatureHtml.trim()) {
    return {
      plainText: sender.signatureText.trim(),
      html: sender.signatureHtml.trim() || `<p>${sender.signatureText.trim()}</p>`
    };
  }

  const labels = LABELS[locale];
  const plainLines: string[] = [];
  const htmlLines: string[] = [];

  plainLines.push(sender.displayName);
  htmlLines.push(`<strong>${sender.displayName}</strong>`);

  if (sender.jobTitle.trim()) {
    plainLines.push(sender.jobTitle);
    htmlLines.push(sender.jobTitle);
  }

  if (sender.phone.trim()) {
    plainLines.push(`${labels.phone}: ${sender.phone}`);
    htmlLines.push(`${labels.phone}: ${sender.phone}`);
  }

  if (sender.fromEmail.trim()) {
    plainLines.push(`${labels.email}: ${sender.fromEmail}`);
    htmlLines.push(`${labels.email}: <a href="mailto:${sender.fromEmail}">${sender.fromEmail}</a>`);
  }

  if (sender.replyToEmail.trim() && sender.replyToEmail !== sender.fromEmail) {
    plainLines.push(`${labels.replyTo}: ${sender.replyToEmail}`);
    htmlLines.push(`${labels.replyTo}: ${sender.replyToEmail}`);
  }

  const tradingName = company.tradingName || company.legalName;
  if (tradingName.trim()) {
    plainLines.push(tradingName);
    htmlLines.push(`<br><strong>${tradingName}</strong>`);
  }

  const address = formatAddress(company);
  if (address) {
    plainLines.push(address);
    htmlLines.push(address);
  }

  if (company.vatNumber.trim()) {
    plainLines.push(`${labels.vat}: ${company.vatNumber}`);
    htmlLines.push(`${labels.vat}: ${company.vatNumber}`);
  }

  if (company.websiteUrl.trim()) {
    plainLines.push(`${labels.website}: ${company.websiteUrl}`);
    htmlLines.push(
      `${labels.website}: <a href="${company.websiteUrl}" rel="noopener noreferrer" target="_blank">${company.websiteUrl}</a>`
    );
  }

  return {
    plainText: plainLines.join("\n"),
    html: htmlLines.join("<br>")
  };
}

export function renderLegalFooter(company: CompanyProfileSnapshot): string {
  return company.legalFooter.trim();
}
