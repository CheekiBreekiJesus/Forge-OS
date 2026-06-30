import type { EmailComposition } from "./types";

export type MailtoParams = {
  to: string;
  subject: string;
  body: string;
  url: string;
  truncated: boolean;
};

const MAX_MAILTO_LENGTH = 1800;
const MAX_GMAIL_LENGTH = 7500;
const MAX_OUTLOOK_LENGTH = 7500;

function encodeMailtoPart(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

export function buildMailtoUrl(input: {
  to: string;
  subject: string;
  body: string;
}): MailtoParams {
  let body = input.body;
  let truncated = false;
  const base = `mailto:${input.to}?subject=${encodeMailtoPart(input.subject)}&body=`;
  const maxBody = MAX_MAILTO_LENGTH - base.length;
  if (body.length > maxBody && maxBody > 100) {
    body = `${body.slice(0, maxBody - 40)}\n\n[... mensagem truncada por limite do cliente de email ...]`;
    truncated = true;
  }
  return {
    body,
    subject: input.subject,
    to: input.to,
    truncated,
    url: `${base}${encodeMailtoPart(body)}`
  };
}

export function buildGmailComposeUrl(input: {
  to: string;
  subject: string;
  body: string;
}): { url: string; truncated: boolean } {
  let body = input.body;
  let truncated = false;
  if (body.length > MAX_GMAIL_LENGTH) {
    body = body.slice(0, MAX_GMAIL_LENGTH - 40);
    truncated = true;
  }
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: input.to,
    su: input.subject,
    body
  });
  return { truncated, url: `https://mail.google.com/mail/?${params.toString()}` };
}

export function buildOutlookComposeUrl(input: {
  to: string;
  subject: string;
  body: string;
}): { url: string; truncated: boolean } {
  let body = input.body;
  let truncated = false;
  if (body.length > MAX_OUTLOOK_LENGTH) {
    body = body.slice(0, MAX_OUTLOOK_LENGTH - 40);
    truncated = true;
  }
  const params = new URLSearchParams({
    to: input.to,
    subject: input.subject,
    body
  });
  return { truncated, url: `https://outlook.office.com/mail/deeplink/compose?${params.toString()}` };
}

export function formatPlainTextForCopy(composition: EmailComposition, includeSubject = true): string {
  if (includeSubject) {
    return `Assunto: ${composition.subject}\n\n${composition.plainText}`;
  }
  return composition.plainText;
}

export function formatFullMessageForCopy(composition: EmailComposition): string {
  const parts = [`Assunto: ${composition.subject}`];
  if (composition.preheader) {
    parts.push(`Preheader: ${composition.preheader}`);
  }
  parts.push("", composition.plainText);
  return parts.join("\n");
}

export async function copyPlainText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function copyFormattedEmail(composition: EmailComposition): Promise<{
  ok: boolean;
  htmlSupported: boolean;
}> {
  const plain = composition.plainText;
  const html = composition.html;
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return { htmlSupported: false, ok: false };
  }
  try {
    if (typeof ClipboardItem !== "undefined") {
      const item = new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" })
      });
      await navigator.clipboard.write([item]);
      return { htmlSupported: true, ok: true };
    }
    await navigator.clipboard.writeText(plain);
    return { htmlSupported: false, ok: true };
  } catch {
    try {
      await navigator.clipboard.writeText(plain);
      return { htmlSupported: false, ok: true };
    } catch {
      return { htmlSupported: false, ok: false };
    }
  }
}

export function getLocaleLabel(locale: string): string {
  if (locale === "pt-PT") return "PT";
  if (locale === "en") return "EN";
  return locale;
}
