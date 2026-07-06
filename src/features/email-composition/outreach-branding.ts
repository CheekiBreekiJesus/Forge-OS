import type { OutreachBrandingConfig } from "@/features/email-composition/outreach-branding-config";
import { sanitizeEmailHtml } from "@/features/email-composition/sanitize";

export type BrandedEmailContent = {
  plainText: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderShowcasePlain(config: OutreachBrandingConfig): string {
  if (config.showcaseImageUrl) {
    return `${config.showcaseImageCaption}\n${config.showcaseImageUrl}`;
  }
  return `[${config.showcaseImageCaption}]`;
}

export function renderShowcaseHtml(config: OutreachBrandingConfig): string {
  const caption = escapeHtml(config.showcaseImageCaption);
  if (config.showcaseImageUrl) {
    const src = escapeHtml(config.showcaseImageUrl);
    const alt = escapeHtml(config.showcaseImageCaption);
    return `<div style="text-align:center;margin:20px 0;"><img src="${src}" alt="${alt}" width="560" /><p style="font-size:13px;color:#475569;margin-top:8px;">${caption}</p></div>`;
  }
  return `<p style="font-size:13px;color:#475569;text-align:center;"><em>${caption}</em></p>`;
}

export function renderBrandedFooterPlain(config: OutreachBrandingConfig): string {
  const lines = [config.companyName, config.senderName];
  if (config.senderEmail) lines.push(config.senderEmail);
  if (config.senderPhone) lines.push(config.senderPhone);
  if (config.companyWebsite) lines.push(config.companyWebsite);
  if (config.footerCtaLabel && config.footerCtaUrl) {
    lines.push(`${config.footerCtaLabel}: ${config.footerCtaUrl}`);
  }
  if (config.logoUrl) {
    lines.unshift(`[Logótipo: ${config.logoUrl}]`);
  }
  return lines.filter(Boolean).join("\n");
}

export function renderBrandedFooterHtml(config: OutreachBrandingConfig): string {
  const rows: string[] = [];
  if (config.logoUrl) {
    const logoAlt = escapeHtml(config.companyName);
    const logoSrc = escapeHtml(config.logoUrl);
    rows.push(
      `<p style="margin:0 0 12px 0;"><img src="${logoSrc}" alt="${logoAlt}" width="180" /></p>`
    );
  }
  rows.push(`<p style="margin:0;font-weight:700;">${escapeHtml(config.senderName)}</p>`);
  if (config.senderEmail) {
    rows.push(
      `<p style="margin:4px 0 0 0;"><a href="mailto:${escapeHtml(config.senderEmail)}">${escapeHtml(config.senderEmail)}</a></p>`
    );
  }
  if (config.senderPhone) {
    rows.push(`<p style="margin:4px 0 0 0;">${escapeHtml(config.senderPhone)}</p>`);
  }
  if (config.companyWebsite) {
    const website = escapeHtml(config.companyWebsite);
    rows.push(
      `<p style="margin:4px 0 0 0;"><a href="${website}" rel="noopener noreferrer" target="_blank">${website}</a></p>`
    );
  }
  if (config.footerCtaLabel && config.footerCtaUrl) {
    const href = escapeHtml(config.footerCtaUrl);
    rows.push(
      `<p style="margin:16px 0 0 0;"><a href="${href}" rel="noopener noreferrer" target="_blank" style="display:inline-block;padding:10px 16px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(config.footerCtaLabel)}</a></p>`
    );
  }
  return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">${rows.join("")}</div>`;
}

function splitPlainParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinPlainParagraphs(paragraphs: string[]): string {
  return paragraphs.join("\n\n");
}

function stripInlineSignatureParagraphs(
  paragraphs: string[],
  config: OutreachBrandingConfig
): string[] {
  const signatureMarkers = [
    /^com os melhores cumprimentos,?$/i,
    /^kind regards,?$/i,
    /^best regards,?$/i,
    /^atenciosamente,?$/i
  ];
  const startIndex = paragraphs.findIndex((paragraph) =>
    signatureMarkers.some((pattern) => pattern.test(paragraph.trim()))
  );
  if (startIndex === -1) return paragraphs;

  const beforeSignature = paragraphs.slice(0, startIndex);
  const afterSignature = paragraphs.slice(startIndex + 1);
  const optOutIndex = afterSignature.findIndex((paragraph) =>
    paragraph.toLowerCase().includes("remover") ||
    paragraph.toLowerCase().includes("unsubscribe") ||
    paragraph.toLowerCase().includes("opt-out") ||
    (config.optOutLine && paragraph.includes(config.optOutLine))
  );
  const trailing =
    optOutIndex === -1
      ? []
      : afterSignature.slice(optOutIndex).filter((paragraph) => {
          const normalized = paragraph.trim().toLowerCase();
          return (
            normalized.includes("remover") ||
            normalized.includes("unsubscribe") ||
            normalized.includes("opt-out") ||
            (config.optOutLine && paragraph.includes(config.optOutLine))
          );
        });

  return [...beforeSignature, ...trailing];
}

function insertAfterIntroParagraph(paragraphs: string[], block: string): string[] {
  if (paragraphs.length === 0) return [block];
  const insertIndex = Math.min(2, paragraphs.length);
  return [...paragraphs.slice(0, insertIndex), block, ...paragraphs.slice(insertIndex)];
}

function insertBeforeOptOut(paragraphs: string[], block: string, optOutLine: string): string[] {
  if (!optOutLine) return [...paragraphs, block];
  const optOutIndex = paragraphs.findIndex((paragraph) => paragraph.includes(optOutLine));
  if (optOutIndex === -1) return [...paragraphs, block];
  return [
    ...paragraphs.slice(0, optOutIndex),
    block,
    ...paragraphs.slice(optOutIndex)
  ];
}

function splitHtmlParagraphs(html: string): string[] {
  return html
    .split(/(?=<p|<div)/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function insertHtmlAfterIntro(html: string, block: string): string {
  const parts = splitHtmlParagraphs(html);
  if (parts.length === 0) return block;
  const insertIndex = Math.min(2, parts.length);
  return [...parts.slice(0, insertIndex), block, ...parts.slice(insertIndex)].join("");
}

function insertHtmlBeforeOptOut(html: string, block: string, optOutLine: string): string {
  if (!optOutLine) return `${html}${block}`;
  const marker = escapeHtml(optOutLine).replace(/\n/g, "<br>");
  const index = html.indexOf(marker);
  if (index === -1) return `${html}${block}`;
  return `${html.slice(0, index)}${block}${html.slice(index)}`;
}

export function applyOutreachBrandingToEmail(
  content: BrandedEmailContent,
  config: OutreachBrandingConfig
): BrandedEmailContent {
  const showcasePlain = renderShowcasePlain(config);
  const showcaseHtml = renderShowcaseHtml(config);
  const footerPlain = renderBrandedFooterPlain(config);
  const footerHtml = renderBrandedFooterHtml(config);

  let plainParagraphs = stripInlineSignatureParagraphs(
    splitPlainParagraphs(content.plainText),
    config
  );
  plainParagraphs = insertAfterIntroParagraph(plainParagraphs, showcasePlain);
  plainParagraphs = insertBeforeOptOut(plainParagraphs, footerPlain, config.optOutLine);

  const htmlWithShowcase = insertHtmlAfterIntro(content.html, showcaseHtml);
  const htmlWithFooter = insertHtmlBeforeOptOut(htmlWithShowcase, footerHtml, config.optOutLine);

  return {
    html: sanitizeEmailHtml(htmlWithFooter),
    plainText: joinPlainParagraphs(plainParagraphs)
  };
}

export function buildBrandedSelfTestEmailContent(
  messageBody: string,
  config: OutreachBrandingConfig
): BrandedEmailContent {
  const intro = messageBody.trim();
  const htmlIntro = `<p>${escapeHtml(intro).replace(/\n/g, "<br>")}</p>`;
  return applyOutreachBrandingToEmail(
    {
      html: htmlIntro,
      plainText: intro
    },
    config
  );
}
