import { assertServerOnlyModule } from "@/features/email-delivery/server-only";

assertServerOnlyModule();

const HOSTNAME_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  return value.trim().toLowerCase() === "true";
}

export function readPort(value: string | undefined, fallback: number): number | null {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) return null;
  return parsed;
}

export function readTimeoutMs(value: string | undefined, fallback = 15000): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1000) return fallback;
  return Math.min(Math.trunc(parsed), 60000);
}

export function isValidHostname(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 253) return false;
  if (trimmed === "localhost") return true;
  return HOSTNAME_RE.test(trimmed);
}

export function isValidEmailAddress(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isSecurePortExpected(port: number, secure: boolean): boolean {
  if (secure && (port === 465 || port === 993)) return true;
  if (!secure && (port === 587 || port === 25 || port === 143)) return true;
  return false;
}
