import type { SenderContext } from "@/application/campaign-sender-context";
import type { CampaignRecipient } from "@/domain/campaign-types";
import { plainTextToHtml, sanitizeEmailHtml } from "@/features/email-composition/sanitize";
import type { EmailComposition } from "@/features/email-composition/types";

const BLOCKED_URL_PATTERN = /(blob:|localhost|127\.0\.0\.1|file:\/\/|\\)/i;

export function buildCampaignDraftComposition(
  recipient: CampaignRecipient,
  senderContext: SenderContext
): EmailComposition {
  const subject = recipient.personalizedSubject.trim();
  const plainText = recipient.personalizedPlainText.trim();
  const html = recipient.personalizedHtml.trim()
    ? sanitizeEmailHtml(recipient.personalizedHtml)
    : sanitizeEmailHtml(plainTextToHtml(plainText));

  assertSafeOutboundContent(subject, plainText, html);

  const signatureText = senderContext.sender.signatureText.trim();
  const signatureHtml = senderContext.sender.signatureHtml.trim();
  const bodyWithSignature = signatureText
    ? `${plainText}\n\n${signatureText}`.trim()
    : plainText;
  const htmlWithSignature = signatureHtml
    ? `${html}<p></p>${signatureHtml}`
    : html;

  return {
    subject,
    preheader: "",
    greeting: "",
    introduction: "",
    offerBody: bodyWithSignature,
    callToAction: "",
    links: [],
    mediaBlocks: [],
    signature: {
      plainText: signatureText,
      html: signatureHtml
    },
    legalFooter: senderContext.company.legalFooter ?? "",
    plainText: bodyWithSignature,
    html: sanitizeEmailHtml(htmlWithSignature),
    provider: "campaign_template",
    model: "deterministic",
    fallbackUsed: false,
    generatedAt: recipient.generatedAt ?? new Date().toISOString(),
    senderIdentityId: senderContext.sender.id || null,
    senderIdentitySnapshot: senderContext.sender,
    companyProfileSnapshot: senderContext.company,
    selectedProductSnapshots: [],
    localOnlyImageWarning: false
  };
}

export function assertSafeOutboundContent(subject: string, plainText: string, html: string): void {
  for (const part of [subject, plainText, html]) {
    if (BLOCKED_URL_PATTERN.test(part)) {
      throw new Error("Outbound content contains blocked local or blob URLs.");
    }
  }
}
