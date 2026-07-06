import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { EmailDeliverySelfTestBrandingInput } from "@/domain/email-delivery-types";
import type { EmailDeliveryConfig } from "@/features/email-delivery/config";
import {
  readOutreachBrandingEnvOverrides,
  resolveOutreachBrandingConfig,
  type OutreachBrandingConfig
} from "@/features/email-composition/outreach-branding-config";

function buildMinimalCompanySnapshot(
  branding: EmailDeliverySelfTestBrandingInput | undefined,
  deliveryConfig: EmailDeliveryConfig
): CompanyProfileSnapshot {
  return {
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "Portugal",
    defaultCurrency: "EUR",
    defaultLanguage: "pt-PT",
    facebookUrl: "",
    generalEmail: branding?.senderEmail ?? deliveryConfig.brevoSenderEmail,
    generalPhone: branding?.senderPhone ?? "",
    id: "self-test-company",
    legalFooter: "",
    legalName: branding?.companyName ?? "JH Gomes",
    linkedinUrl: "",
    logoLocalAssetId: null,
    logoPublicUrl: branding?.companyLogoReference ?? "",
    postalCode: "",
    region: "",
    tenantId: "local-tenant",
    tradingName: branding?.companyName ?? "JH Gomes",
    vatNumber: "",
    websiteUrl: branding?.companyWebsite ?? "https://www.jhgomes.pt"
  };
}

function buildMinimalSenderSnapshot(
  branding: EmailDeliverySelfTestBrandingInput | undefined,
  deliveryConfig: EmailDeliveryConfig
): SenderIdentitySnapshot {
  return {
    active: true,
    companyProfileId: "self-test-company",
    defaultLanguage: "pt-PT",
    displayName: branding?.senderName ?? deliveryConfig.brevoSenderName,
    fromEmail: branding?.senderEmail ?? deliveryConfig.brevoSenderEmail,
    id: "self-test-sender",
    isDefault: true,
    jobTitle: "",
    phone: branding?.senderPhone ?? "",
    replyToEmail:
      branding?.senderEmail ??
      (deliveryConfig.brevoReplyTo || deliveryConfig.brevoSenderEmail),
    signatureHtml: "",
    signatureText: "",
    tenantId: "local-tenant",
    userProfileId: "self-test-user"
  };
}

export function buildSelfTestOutreachBrandingConfig(
  branding: EmailDeliverySelfTestBrandingInput | undefined,
  deliveryConfig: EmailDeliveryConfig
): OutreachBrandingConfig {
  const company = buildMinimalCompanySnapshot(branding, deliveryConfig);
  const sender = buildMinimalSenderSnapshot(branding, deliveryConfig);
  return resolveOutreachBrandingConfig({
    company,
    envOverrides: readOutreachBrandingEnvOverrides(),
    locale: branding?.locale ?? "pt-PT",
    profile: branding
      ? {
          companyLogoReference: branding.companyLogoReference ?? "",
          companyName: branding.companyName ?? "",
          companyWebsite: branding.companyWebsite ?? "",
          defaultOptOutLine: branding.defaultOptOutLine ?? "",
          footerCtaLabel: branding.footerCtaLabel ?? "",
          footerCtaUrl: branding.footerCtaUrl ?? "",
          senderDisplayName: branding.senderName ?? "",
          senderEmail: branding.senderEmail ?? "",
          showcaseImageReference: branding.showcaseImageReference ?? ""
        }
      : null,
    publicBaseUrl: deliveryConfig.publicBaseUrl,
    sender
  });
}
