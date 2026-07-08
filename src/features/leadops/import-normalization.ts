/** Deterministic normalization utilities for lead import. */

const EMAIL_SYNTAX_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CANDIDATE_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export const PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "n.a",
  "n.a.",
  "-",
  "--",
  "null",
  "none",
  "sem informacao",
  "sem informação",
  "sem info",
  "vazio",
  "empty",
  "unknown",
  "desconhecido",
  "n/d",
  "nd",
  "s/n",
  "sn"
]);

export function trimValue(value: string | null | undefined): string {
  if (value == null) return "";
  return value.replace(/\p{C}/gu, "").trim();
}

export function collapseWhitespace(value: string): string {
  return trimValue(value).replace(/\s+/g, " ");
}

export function collapseRepeatedPunctuation(value: string): string {
  return collapseWhitespace(value)
    .replace(/([.,;:!?])\1+/g, "$1")
    .replace(/\s*([.,;:!?])\s*/g, "$1 ")
    .trim();
}

export function isPlaceholderValue(value: string | null | undefined): boolean {
  const normalized = collapseWhitespace(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  return normalized.length === 0 || PLACEHOLDER_VALUES.has(normalized);
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

export function stripMailtoPrefix(value: string): string {
  return trimValue(value).replace(/^mailto:/i, "");
}

export function parseEmailCandidates(value: string): string[] {
  const stripped = stripMailtoPrefix(value);
  if (!stripped) return [];
  const matches = stripped.match(EMAIL_CANDIDATE_RE) ?? [];
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const match of matches) {
    const normalized = normalizeEmail(match);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    candidates.push(normalized);
  }
  if (candidates.length === 0 && stripped.includes("@")) {
    const fallback = normalizeEmail(stripped.split(/[,;\/|]/)[0] ?? stripped);
    if (fallback) candidates.push(fallback);
  }
  return candidates;
}

export function extractPrimaryEmail(value: string): {
  primary: string;
  additional: string[];
} {
  const candidates = parseEmailCandidates(value);
  const valid = candidates.filter(isValidEmailSyntax);
  if (valid.length > 0) {
    return { primary: valid[0], additional: candidates.filter((email) => email !== valid[0]) };
  }
  if (candidates.length > 0) {
    return { primary: candidates[0], additional: candidates.slice(1) };
  }

  const stripped = stripMailtoPrefix(value);
  if (stripped && !isPlaceholderValue(stripped)) {
    const token = normalizeEmail((stripped.split(/[,;\/|]/)[0] ?? stripped).trim());
    return { primary: token, additional: [] };
  }

  return { primary: "", additional: [] };
}

export function normalizeEmail(value: string): string {
  return stripMailtoPrefix(value).toLowerCase();
}

export function isValidEmailSyntax(value: string): boolean {
  const normalized = normalizeEmail(value);
  if (!normalized || isPlaceholderValue(normalized)) return false;
  return EMAIL_SYNTAX_RE.test(normalized);
}

export function normalizePhone(value: string): { display: string; normalized: string } {
  const trimmed = collapseRepeatedPunctuation(trimValue(value));
  if (!trimmed || isPlaceholderValue(trimmed)) return { display: "", normalized: "" };

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
  if (!trimmed || isPlaceholderValue(trimmed)) return { display: null, domain: null };

  if (/facebook\.com|fb\.com|fb\.me/i.test(trimmed)) {
    return normalizeFacebookUrl(trimmed);
  }

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

export function normalizeFacebookUrl(value: string): { display: string | null; domain: string | null } {
  const trimmed = trimValue(value);
  if (!trimmed || isPlaceholderValue(trimmed)) return { display: null, domain: null };
  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    return {
      display: parsed.toString(),
      domain: parsed.hostname.replace(/^www\./i, "").toLowerCase()
    };
  } catch {
    return { display: trimmed, domain: "facebook.com" };
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
  return isPlaceholderValue(value);
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

export function decodeTextBuffer(buffer: ArrayBuffer): { text: string; encoding: "utf-8" | "windows-1252" } {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (!utf8.includes("\uFFFD")) {
    return { text: utf8, encoding: "utf-8" };
  }
  const latin1 = new TextDecoder("windows-1252").decode(buffer);
  return { text: latin1, encoding: "windows-1252" };
}

export function appendAdditionalEmailsToNotes(notes: string, additionalEmails: string[]): string {
  if (additionalEmails.length === 0) return notes;
  const suffix = `Additional emails: ${additionalEmails.join(", ")}`;
  return notes ? `${notes} | ${suffix}` : suffix;
}
