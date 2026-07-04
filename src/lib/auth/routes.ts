import { isSupportedLocale } from "@/i18n/config";

const PUBLIC_API_PREFIXES = [
  "/api/health",
  "/api/outreach/unsubscribe",
  "/api/outreach/brevo/webhook"
];

const PUBLIC_ROOT_PREFIXES = [
  "/auth/callback",
  "/auth/signout",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml"
];

const PUBLIC_FILE_PATTERN = /\.(?:css|js|map|png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|woff2?)$/i;

export function isStaticAssetRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/images/") ||
    PUBLIC_FILE_PATTERN.test(pathname)
  );
}

export function isPublicRoute(pathname: string): boolean {
  if (isStaticAssetRoute(pathname)) return true;
  if (PUBLIC_ROOT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  if (!locale || !isSupportedLocale(locale)) return pathname === "/";

  const first = segments[1];
  if (first === "login" || first === "access" || first === "unsubscribe") {
    return true;
  }

  return false;
}

export function requiresActiveMembership(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;
  if (pathname.startsWith("/api/")) return true;
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 0 && isSupportedLocale(segments[0] ?? "");
}
