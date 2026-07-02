const currencyPattern = /[€$£\s\u00a0]/g;
const thousandsDotPattern = /^(\d{1,3}(?:\.\d{3})+)(,\d+)?$/;
const thousandsSpacePattern = /^(\d{1,3}(?:\s\d{3})+)(,\d+)?$/;
const packagingPattern = /\((\d[\d\s.]*)\s*UN\)/i;
const eanPattern = /^\d{8,14}$/;

const dateFormats = [
  /^(\d{2})\/(\d{2})\/(\d{4})$/,
  /^(\d{2})-(\d{2})-(\d{4})$/,
  /^(\d{2})\.(\d{2})\.(\d{4})$/,
  /^(\d{4})-(\d{2})-(\d{2})$/
] as const;

export type PortugueseParseStatus = "valid" | "empty" | "invalid";

export function parsePortugueseDecimal(value: string | null | undefined): {
  normalized: string;
  status: PortugueseParseStatus;
} {
  if (!value?.trim()) {
    return { normalized: "", status: "empty" };
  }

  let cleaned = value.trim().replace(currencyPattern, "");
  if (!cleaned) {
    return { normalized: "", status: "empty" };
  }

  if (thousandsDotPattern.test(cleaned) || thousandsSpacePattern.test(cleaned)) {
    const [, integerPart, fractional = ""] = cleaned.match(/^([\d.\s]+)(,\d+)?$/) ?? [];
    const normalizedInteger = (integerPart ?? "").replace(/[.\s]/g, "");
    cleaned = fractional ? `${normalizedInteger}.${fractional.slice(1)}` : normalizedInteger;
  } else if (cleaned.includes(",") && !cleaned.includes(".")) {
    cleaned = cleaned.replace(",", ".");
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric)) {
    return { normalized: value.trim(), status: "invalid" };
  }

  return { normalized: String(numeric), status: "valid" };
}

export function parsePortugueseDate(value: string | null | undefined): {
  normalized: string;
  status: PortugueseParseStatus;
} {
  if (!value?.trim()) {
    return { normalized: "", status: "empty" };
  }

  const raw = value.trim();
  for (const pattern of dateFormats) {
    const match = raw.match(pattern);
    if (!match) {
      continue;
    }

    if (pattern === dateFormats[3]) {
      return { normalized: raw, status: "valid" };
    }

    const [, day, month, year] = match;
    return { normalized: `${year}-${month}-${day}`, status: "valid" };
  }

  return { normalized: raw, status: "invalid" };
}

export function extractPackagingQuantityHint(designation: string): {
  normalized: string;
  status: PortugueseParseStatus;
} {
  const match = designation.match(packagingPattern);
  if (!match) {
    return { normalized: "", status: "empty" };
  }

  const digits = match[1].replace(/[^\d]/g, "");
  if (!digits) {
    return { normalized: "", status: "invalid" };
  }

  return { normalized: digits, status: "valid" };
}

export function isProbableEan(value: string): boolean {
  return eanPattern.test(value.replace(/\D/g, ""));
}

export function normalizeUnit(value: string): string {
  const aliases: Record<string, string> = {
    unidade: "Unidade",
    un: "Unidade",
    "un.": "Unidade",
    milheiro: "Milheiro",
    mil: "Milheiro",
    cx: "Caixa",
    caixa: "Caixa"
  };

  const trimmed = value.trim();
  return aliases[trimmed.toLowerCase()] ?? trimmed;
}

export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\ufeff/g, "")
    .replace(/\s+/g, " ");
}
