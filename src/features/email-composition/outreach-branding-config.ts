import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { OutreachTestProfile } from "@/domain/outreach-test-profile-types";
import { isEmbeddableImageUrl, isValidHttpsUrl } from "@/features/email-composition/url-utils";

export const DEFAULT_OUTREACH_SHOWCASE_PATH = "/demo/outreach/jh-gomes-showcase.svg";
export const DEFAULT_OUTREACH_LOGO_PATH = "/demo/outreach/jh-gomes-logo.svg";

export type OutreachBrandingConfig = {
  locale: "pt-PT" | "en";
  showcaseImageUrl: string | null;
  showcaseImageCaption: string;
  logoUrl: string | null;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  companyName: string;
  companyWebsite: string;
  footerCtaLabel: string;
  footerCtaUrl: string;
  optOutLine: string;
};

export type ResolveOutreachBrandingInput = {
  locale: string;
  publicBaseUrl?: string;
  company: CompanyProfileSnapshot;
  sender: SenderIdentitySnapshot;
  profile?: Pick<
    OutreachTestProfile,
    | "showcaseImageReference"
    | "companyLogoReference"
    | "companyWebsite"
    | "companyName"
    | "defaultOptOutLine"
    | "footerCtaLabel"
    | "footerCtaUrl"
    | "senderDisplayName"
    | "senderEmail"
  > | null;
  envOverrides?: {
    showcaseReference?: string;
    logoReference?: string;
  };
};

const CAPTIONS = {
  "pt-PT": "Exemplos de copos personalizados produzidos pela JH Gomes",
  en: "Examples of personalized cups produced by JH Gomes"
} as const;

const CTA_LABELS = {
  "pt-PT": "Ver copos personalizados",
  en: "View personalized cups"
} as const;

export function resolvePublicAssetBaseUrl(publicBaseUrl?: string): string {
  const trimmed = publicBaseUrl?.trim().replace(/\/$/, "") ?? "";
  if (trimmed) return trimmed;
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const origin = (globalThis as Window & typeof globalThis).location?.origin?.trim();
    if (origin) return origin.replace(/\/$/, "");
  }
  return "";
}

export function resolveOutreachBrandingConfig(input: ResolveOutreachBrandingInput): OutreachBrandingConfig {
  const locale = input.locale.startsWith("pt") ? "pt-PT" : "en";
  const baseUrl = resolvePublicAssetBaseUrl(input.publicBaseUrl);
  const profile = input.profile;
  const companyWebsite =
    profile?.companyWebsite?.trim() ||
    input.company.websiteUrl.trim() ||
    "";
  const companyName =
    profile?.companyName?.trim() ||
    input.company.tradingName.trim() ||
    input.company.legalName.trim() ||
    "JH Gomes";

  const showcaseReference =
    profile?.showcaseImageReference?.trim() ||
    input.envOverrides?.showcaseReference?.trim() ||
    DEFAULT_OUTREACH_SHOWCASE_PATH;
  const logoReference =
    profile?.companyLogoReference?.trim() ||
    input.company.logoPublicUrl.trim() ||
    input.envOverrides?.logoReference?.trim() ||
    DEFAULT_OUTREACH_LOGO_PATH;

  return {
    companyName,
    companyWebsite,
    footerCtaLabel:
      profile?.footerCtaLabel?.trim() ||
      (locale === "pt-PT" ? CTA_LABELS["pt-PT"] : CTA_LABELS.en),
    footerCtaUrl: profile?.footerCtaUrl?.trim() || companyWebsite,
    locale,
    logoUrl: resolveEmbeddableAssetUrl(logoReference, baseUrl),
    optOutLine: profile?.defaultOptOutLine?.trim() || "",
    senderEmail:
      profile?.senderEmail?.trim() ||
      input.sender.fromEmail.trim() ||
      input.sender.replyToEmail.trim(),
    senderName: profile?.senderDisplayName?.trim() || input.sender.displayName.trim(),
    senderPhone: input.sender.phone.trim() || input.company.generalPhone.trim(),
    showcaseImageCaption: locale === "pt-PT" ? CAPTIONS["pt-PT"] : CAPTIONS.en,
    showcaseImageUrl: resolveEmbeddableAssetUrl(showcaseReference, baseUrl)
  };
}

export function resolveEmbeddableAssetUrl(reference: string, publicBaseUrl: string): string | null {
  const trimmed = reference.trim();
  if (!trimmed) return null;
  if (isEmbeddableImageUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) {
    if (!publicBaseUrl || !isEmbeddableImageUrl(`${publicBaseUrl}${trimmed}`)) {
      return null;
    }
    return `${publicBaseUrl}${trimmed}`;
  }
  if (isValidHttpsUrl(trimmed)) {
    return isEmbeddableImageUrl(trimmed) ? trimmed : null;
  }
  return null;
}

export function readOutreachBrandingEnvOverrides(): {
  showcaseReference?: string;
  logoReference?: string;
} {
  return {
    logoReference: process.env.FORGEOS_OUTREACH_LOGO_PATH?.trim(),
    showcaseReference: process.env.FORGEOS_OUTREACH_SHOWCASE_IMAGE_PATH?.trim()
  };
}
