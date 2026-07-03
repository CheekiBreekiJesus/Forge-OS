import { assertServerOnlyModule } from "@/features/email-delivery/server-only";

assertServerOnlyModule();

const REDACTED = "[REDACTED]";

export function redactSecret(value: string | undefined | null): string {
  if (!value || value.trim() === "") return "";
  return REDACTED;
}

export function redactCredentialsInText(
  text: string,
  secrets: Array<string | undefined | null>
): string {
  let result = text;
  for (const secret of secrets) {
    if (!secret || secret.trim() === "") continue;
    result = result.split(secret).join(REDACTED);
  }
  return result;
}

export function sanitizeErrorMessage(
  error: unknown,
  secrets: Array<string | undefined | null>
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown mail connection error.";
  return redactCredentialsInText(message, secrets);
}

export function containsSecret(text: string, secret: string | undefined | null): boolean {
  if (!secret || secret.trim() === "") return false;
  return text.includes(secret);
}
