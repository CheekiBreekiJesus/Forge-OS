const PLACEHOLDER_VALUES = new Set(["", "-", "—", "n/a", "na", "null", "none", "0", "0,00", "0.00"]);

export function trimReference(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeReferenceCase(value: string): string {
  return trimReference(value).toUpperCase();
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function isEmptyPlaceholder(value: string | undefined | null): boolean {
  if (value == null) return true;
  const trimmed = value.trim().toLowerCase();
  return PLACEHOLDER_VALUES.has(trimmed);
}

export function cleanupBarcode(value: string): string {
  const cleaned = value.trim().replace(/[\s-]/g, "");
  if (/^\d+\.?\d*e\+?\d+$/i.test(cleaned)) {
    return BigInt(Math.round(Number(cleaned))).toString();
  }
  return cleaned.replace(/[^\dA-Za-z]/g, "");
}

export function validateEan13(value: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = cleanupBarcode(value);
  if (!/^\d{13}$/.test(normalized)) {
    return { normalized, valid: false, reason: "EAN-13 must be 13 digits." };
  }
  const digits = normalized.split("").map(Number);
  const check = digits.slice(0, 12).reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3), 0);
  const expected = (10 - (check % 10)) % 10;
  if (expected !== digits[12]) {
    return { normalized, valid: false, reason: "Invalid EAN-13 checksum." };
  }
  return { normalized, valid: true };
}

export function validateEan8(value: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = cleanupBarcode(value);
  if (!/^\d{8}$/.test(normalized)) {
    return { normalized, valid: false, reason: "EAN-8 must be 8 digits." };
  }
  const digits = normalized.split("").map(Number);
  const check = digits.slice(0, 7).reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 3 : 1), 0);
  const expected = (10 - (check % 10)) % 10;
  if (expected !== digits[7]) {
    return { normalized, valid: false, reason: "Invalid EAN-8 checksum." };
  }
  return { normalized, valid: true };
}

/** Parse Portuguese-style numbers: 1.234,56 or 1234,56 or 1234.56 */
export function parsePortugueseNumber(raw: string): { numeric: number | null; originalText: string } {
  const originalText = raw.trim();
  if (isEmptyPlaceholder(originalText)) return { numeric: null, originalText };

  let cleaned = originalText
    .replace(/[€$£]/g, "")
    .replace(/\s/g, "")
    .replace(/%$/, "");

  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+,\d+$/.test(cleaned)) {
    cleaned = cleaned.replace(",", ".");
  }

  const numeric = Number(cleaned);
  if (Number.isNaN(numeric)) return { numeric: null, originalText };
  return { numeric, originalText };
}

export function parseCurrency(raw: string): { numeric: number | null; originalText: string; currency?: string } {
  const originalText = raw.trim();
  let currency: string | undefined;
  if (originalText.includes("€")) currency = "EUR";
  else if (originalText.includes("$")) currency = "USD";
  else if (originalText.includes("£")) currency = "GBP";
  const { numeric, originalText: text } = parsePortugueseNumber(originalText);
  return { currency, numeric, originalText: text };
}

export function parsePercentage(raw: string): { numeric: number | null; originalText: string } {
  const originalText = raw.trim();
  const withoutPercent = originalText.replace(/%$/, "").trim();
  const { numeric, originalText: text } = parsePortugueseNumber(withoutPercent);
  if (numeric == null) return { numeric: null, originalText };
  const asDecimal = originalText.includes("%") || numeric > 1 ? numeric / 100 : numeric;
  return { numeric: asDecimal, originalText: text };
}

export function normalizeVatRate(raw: string): { normalized: string; numeric: number | null } {
  const { numeric, originalText } = parsePercentage(raw);
  if (numeric == null) return { normalized: originalText, numeric: null };
  const percentDisplay = numeric <= 1 ? `${(numeric * 100).toFixed(0)}%` : `${numeric}%`;
  return { normalized: percentDisplay, numeric: numeric <= 1 ? numeric : numeric / 100 };
}

const UNIT_ALIASES: Record<string, string> = {
  unidade: "unit",
  un: "unit",
  unit: "unit",
  caixa: "box",
  box: "box",
  cx: "box",
  pack: "pack",
  embalagem: "pack",
  kg: "kilogram",
  kilogram: "kilogram",
  g: "gram",
  l: "litre",
  ml: "millilitre"
};

export function normalizeUnit(raw: string): string {
  const key = raw.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return UNIT_ALIASES[key] ?? normalizeWhitespace(raw);
}

export function parsePackagingQuantity(raw: string): { numeric: number | null; originalText: string } {
  return parsePortugueseNumber(raw);
}

/** Unicode-safe case-insensitive description comparison key (accents preserved in display). */
export function descriptionComparisonKey(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

export function descriptionsSimilar(a: string, b: string, threshold = 0.85): boolean {
  const keyA = descriptionComparisonKey(a);
  const keyB = descriptionComparisonKey(b);
  if (!keyA || !keyB) return false;
  if (keyA === keyB) return true;
  const longer = keyA.length >= keyB.length ? keyA : keyB;
  const shorter = keyA.length < keyB.length ? keyA : keyB;
  if (longer.includes(shorter) && shorter.length / longer.length >= threshold) return true;
  return levenshteinSimilarity(keyA, keyB) >= threshold;
}

function levenshteinSimilarity(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  const distance = matrix[b.length][a.length];
  return 1 - distance / Math.max(a.length, b.length, 1);
}

export function normalizeStatus(raw: string): "active" | "inactive" | "unknown" {
  const value = raw.trim().toLowerCase();
  if (["active", "ativo", "sim", "yes", "normal"].includes(value)) return "active";
  if (["inactive", "inativo", "nao", "não", "no", "disabled"].includes(value)) return "inactive";
  return "unknown";
}

export type NormalizedProductValues = {
  values: Record<string, string>;
  warnings: string[];
};

export function normalizeMappedValues(mapped: Record<string, string>): NormalizedProductValues {
  const warnings: string[] = [];
  const values: Record<string, string> = { ...mapped };

  if (mapped.internalReference) {
    values.internalReference = normalizeReferenceCase(mapped.internalReference);
  }
  if (mapped.description) {
    values.description = normalizeWhitespace(mapped.description);
  }
  if (mapped.shortDescription) {
    values.shortDescription = normalizeWhitespace(mapped.shortDescription);
  }
  if (mapped.barcode) {
    values.barcode = cleanupBarcode(mapped.barcode);
    if (mapped.barcode.trim() !== values.barcode) {
      warnings.push("Barcode was normalized; verify leading zeroes.");
    }
  }
  if (mapped.ean) {
    const ean = validateEan13(mapped.ean);
    if (ean.valid) values.ean = ean.normalized;
    else {
      const ean8 = validateEan8(mapped.ean);
      if (ean8.valid) values.ean = ean8.normalized;
      else warnings.push(ean.reason ?? "Invalid EAN.");
    }
  }
  for (const priceField of ["purchaseCost", "salePrice", "margin", "markup", "discount"] as const) {
    if (mapped[priceField]) {
      const parsed = parseCurrency(mapped[priceField]);
      if (parsed.numeric != null) {
        values[priceField] = String(parsed.numeric);
        values[`${priceField}Original`] = parsed.originalText;
      } else {
        warnings.push(`Could not parse ${priceField}.`);
      }
    }
  }
  if (mapped.vatRate) {
    const vat = normalizeVatRate(mapped.vatRate);
    values.vatRate = vat.normalized;
    if (vat.numeric != null) values.vatRateNumeric = String(vat.numeric);
  }
  if (mapped.baseUnit) values.baseUnit = normalizeUnit(mapped.baseUnit);
  if (mapped.saleUnit) values.saleUnit = normalizeUnit(mapped.saleUnit);
  if (mapped.status) values.status = normalizeStatus(mapped.status);

  return { values, warnings };
}
