const SECRET_PATTERNS = [
  /xkeysib-[a-z0-9-]+/i,
  /\bsk-[a-z0-9]{8,}\b/i,
  /\bapi[_-]?key\b/i,
  /bearer\s+[a-z0-9._-]+/i
];

export function containsSecretLikeValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return SECRET_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function assertOutreachTestProfileHasNoSecrets(
  input: Record<string, string | null | undefined>
): void {
  for (const [field, value] of Object.entries(input)) {
    if (typeof value === "string" && containsSecretLikeValue(value)) {
      throw new Error(`Outreach test profile field "${field}" must not contain secrets.`);
    }
  }
}
