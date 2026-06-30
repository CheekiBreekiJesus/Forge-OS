const SAFE_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

export function isValidPublicUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return SAFE_PROTOCOLS.has(url.protocol) && url.protocol !== "mailto:";
  } catch {
    return false;
  }
}

export function isValidHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isEmbeddableImageUrl(value: string): boolean {
  if (!isValidHttpsUrl(value)) return false;
  const lower = value.toLowerCase();
  if (lower.includes("localhost") || lower.startsWith("file:")) return false;
  return true;
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function validateProductUrls(input: {
  productPageUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  customizerUrl?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fields: Array<[string, string | undefined]> = [
    ["productPageUrl", input.productPageUrl],
    ["imageUrl", input.imageUrl],
    ["thumbnailUrl", input.thumbnailUrl],
    ["customizerUrl", input.customizerUrl]
  ];
  for (const [name, value] of fields) {
    if (value && value.trim() && !isValidPublicUrl(value)) {
      errors.push(`${name} must be a valid http(s) URL.`);
    }
  }
  return { valid: errors.length === 0, errors };
}
