import { defaultLocale, isSupportedLocale, type Locale } from "@/i18n/config";

const DEFAULT_FALLBACK = `/${defaultLocale}`;
const AUTH_ROUTE_PREFIXES = ["/auth/callback", "/auth/signout"];

export type LoginErrorCode =
  | "missing_code"
  | "oauth_exchange_failed"
  | "oauth_provider_failed"
  | "supabase_not_configured"
  | "tenant_access_denied";

const LOGIN_ERROR_CODES = new Set<string>([
  "missing_code",
  "oauth_exchange_failed",
  "oauth_provider_failed",
  "supabase_not_configured",
  "tenant_access_denied"
]);

export function sanitizeInternalRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_FALLBACK
): string {
  const safeFallback = isSafeInternalPath(fallback) ? fallback : DEFAULT_FALLBACK;
  if (!value) return safeFallback;

  const trimmed = value.trim();
  if (!isSafeInternalPath(trimmed)) return safeFallback;

  return trimmed;
}

export function sanitizeAuthRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_FALLBACK
): string {
  const redirect = sanitizeInternalRedirect(value, fallback);
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) =>
      redirect === prefix ||
      redirect.startsWith(`${prefix}?`) ||
      redirect.startsWith(`${prefix}/`)
  )
    ? sanitizeInternalRedirect(fallback)
    : redirect;
}

export function localeFromInternalPath(path: string, fallback: Locale = defaultLocale): Locale {
  const firstSegment = path.split(/[/?#]/).filter(Boolean)[0] ?? "";
  return isSupportedLocale(firstSegment) ? firstSegment : fallback;
}

export function loginPathForRedirect(path: string, error?: LoginErrorCode): string {
  const locale = localeFromInternalPath(path);
  const loginPath = `/${locale}/login`;
  if (!error) return loginPath;
  const params = new URLSearchParams({ error });
  return `${loginPath}?${params.toString()}`;
}

export function normalizeLoginError(value: string | null | undefined): LoginErrorCode | null {
  if (!value) return null;
  return LOGIN_ERROR_CODES.has(value) ? (value as LoginErrorCode) : null;
}

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return false;

  try {
    const decoded = decodeURIComponent(value);
    if (
      decoded.includes("\\") ||
      /^[a-z][a-z0-9+.-]*:/i.test(decoded) ||
      /^\/[a-z][a-z0-9+.-]*:/i.test(decoded)
    ) {
      return false;
    }
  } catch {
    return false;
  }

  const parsed = new URL(value, "https://forgeos.local");
  return parsed.origin === "https://forgeos.local";
}
