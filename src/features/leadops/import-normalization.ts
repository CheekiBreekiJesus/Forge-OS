/** Deterministic normalization utilities for lead import. */

const EMAIL_SYNTAX_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function trimValue(value: string | null | undefined): string {
  if (value == null) return "";
  return value.replace(/\p{C}/gu, "").trim();
}

export function collapseWhitespace(value: string): string {
  return trimValue(value).replace(/\s+/g, " ");
}

export function normalizeOrganizationComparisonKey(name: string): string {
  return collapseWhitespace(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeEmail(value: string): string {
  return trimValue(value).toLowerCase();
}

export function isValidEmailSyntax(value: string): boolean {
  const normalized = normalizeEmail(value);
  if (!normalized) return false;
  return EMAIL_SYNTAX_RE.test(normalized);
}

export function normalizePhone(value: string): { display: string; normalized: string } {
  const trimmed = trimValue(value);
  if (!trimmed) return { display: "", normalized: "" };

  const digits = trimmed.replace(/[^\d+]/g, "");
  let display = trimmed;
  let normalized = digits;

  if (/^(\+351|351)?9\d{8}$/.test(digits.replace(/^\+/, ""))) {
    const local = digits.replace(/^(\+351|351)/, "");
    display = `+351 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    normalized = `+351${local}`;
  } else if (/^9\d{8}$/.test(digits)) {
    display = `+351 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    normalized = `+351${digits}`;
  } else if (/^2\d{8}$/.test(digits)) {
    display = `+351 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    normalized = `+351${digits}`;
  }

  return { display, normalized: normalized.replace(/\s/g, "") };
}

export function normalizeWebsite(value: string): { display: string | null; domain: string | null } {
  const trimmed = trimValue(value);
  if (!trimmed) return { display: null, domain: null };

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return { display: url, domain };
  } catch {
    return { display: trimmed, domain: null };
  }
}

export function extractWebsiteDomain(value: string | null | undefined): string | null {
  return normalizeWebsite(value ?? "").domain;
}

export function sanitizeFormulaInjection(value: string): string {
  const trimmed = trimValue(value);
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export function isEmptyValue(value: string | null | undefined): boolean {
  return trimValue(value).length === 0;
}

export function organizationNamesSimilar(a: string, b: string): boolean {
  const keyA = normalizeOrganizationComparisonKey(a);
  const keyB = normalizeOrganizationComparisonKey(b);
  if (!keyA || !keyB) return false;
  if (keyA === keyB) return true;
  if (keyA.includes(keyB) || keyB.includes(keyA)) return true;
  const wordsA = new Set(keyA.split(" ").filter(Boolean));
  const wordsB = new Set(keyB.split(" ").filter(Boolean));
  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap += 1;
  }
  const minSize = Math.min(wordsA.size, wordsB.size);
  return minSize > 0 && overlap / minSize >= 0.75;
}
