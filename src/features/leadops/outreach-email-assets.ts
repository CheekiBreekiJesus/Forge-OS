/**
 * Static outreach email assets served from /public.
 * Tenant-specific defaults stay small until a shared media layer exists.
 */

export type PortfolioBannerAsset = {
  relativePath: string;
  width: number;
  height: number;
};

export const JH_GOMES_CUSTOM_CUPS_BANNER: PortfolioBannerAsset = {
  relativePath: "/assets/email-outreach/jh-gomes/custom-cups-banner.png",
  width: 600,
  height: 200
};

export const JH_GOMES_TENANT_ID = "tenant_jh_gomes";

export function resolveTenantPortfolioBanner(tenantId?: string): PortfolioBannerAsset | null {
  if (!tenantId || tenantId === JH_GOMES_TENANT_ID) {
    return JH_GOMES_CUSTOM_CUPS_BANNER;
  }
  return null;
}

export function isUsablePublicBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function joinPublicAssetUrl(baseUrl: string, relativePath: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function readPortfolioPublicBaseUrl(
  explicit?: string,
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}
): string {
  const candidate =
    explicit?.trim() ||
    env.FORGEOS_PUBLIC_BASE_URL?.trim() ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  return isUsablePublicBaseUrl(candidate) ? candidate.replace(/\/+$/, "") : "";
}

export function isAbsoluteEmailImageUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") return true;
    return (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export type ResolvedPortfolioImage = {
  absoluteUrl: string;
  previewUrl: string;
  relativePath: string;
  width: number;
  height: number;
};

export function resolvePortfolioImageUrls(input: {
  publicBaseUrl?: string;
  portfolioImageUrl?: string;
  tenantId?: string;
}): ResolvedPortfolioImage | null {
  const banner = resolveTenantPortfolioBanner(input.tenantId);
  const explicitUrl = input.portfolioImageUrl?.trim() ?? "";

  if (explicitUrl && isAbsoluteEmailImageUrl(explicitUrl)) {
    return {
      absoluteUrl: explicitUrl,
      previewUrl: explicitUrl,
      relativePath: "",
      width: banner?.width ?? 600,
      height: banner?.height ?? 200
    };
  }

  if (!banner) return null;

  const baseUrl = readPortfolioPublicBaseUrl(input.publicBaseUrl);
  if (baseUrl) {
    const absoluteUrl = joinPublicAssetUrl(baseUrl, banner.relativePath);
    return {
      absoluteUrl,
      previewUrl: absoluteUrl,
      relativePath: banner.relativePath,
      width: banner.width,
      height: banner.height
    };
  }

  return {
    absoluteUrl: "",
    previewUrl: banner.relativePath,
    relativePath: banner.relativePath,
    width: banner.width,
    height: banner.height
  };
}
