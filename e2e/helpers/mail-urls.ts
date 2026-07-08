import { expect } from "@playwright/test";

function resolveGmailComposeTarget(url: string): string {
  if (/^https:\/\/mail\.google\.com\/mail\//.test(url)) {
    return url;
  }
  const parsed = new URL(url);
  const continueParam = parsed.searchParams.get("continue");
  if (continueParam && continueParam.includes("mail.google.com/mail/")) {
    return decodeURIComponent(continueParam);
  }
  return url;
}

export function assertGmailComposeUrl(url: string, recipient: string, subject: string): void {
  const target = resolveGmailComposeTarget(url);
  expect(target).toMatch(/^https:\/\/mail\.google\.com\/mail\//);
  expect(decodeURIComponent(target)).toContain(recipient);
  expect(decodeURIComponent(target)).toContain(
    encodeURIComponent(subject).replace(/%20/g, "+").slice(0, 8)
  );
}

export function assertOutlookComposeUrl(url: string, recipient: string): void {
  expect(url).toMatch(/^https:\/\/outlook\.(live|office)\.com\//);
  expect(decodeURIComponent(url)).toContain(recipient);
}

export function assertMailtoUrl(url: string, recipient: string, subject: string): void {
  expect(url.startsWith("mailto:")).toBeTruthy();
  expect(decodeURIComponent(url)).toContain(recipient);
  expect(decodeURIComponent(url)).toContain(subject.slice(0, 8));
}
