import { buildJhGomesOutreachTestProfileDefaults } from "@/features/outreach-test-profile/defaults";
import { assertOutreachTestProfileHasNoSecrets } from "@/features/outreach-test-profile/validation";
import type {
  LastEmailTestResult,
  OutreachTestProfile,
  UpsertOutreachTestProfileInput
} from "@/domain/outreach-test-profile-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

export type OutreachCampaignSenderDefaults = {
  campaignLanguage: OutreachTestProfile["campaignLanguage"];
  companyName: string;
  companyWebsite: string;
  senderDisplayName: string;
  senderEmail: string;
  replyToEmail: string;
  defaultTestRecipient: string;
  defaultSignature: string;
  defaultOptOutLine: string;
  defaultProductFocus: string;
};

export async function resolveOutreachCampaignSenderDefaults(
  repos: LocalRepositoryBundle,
  tenantId: string
): Promise<OutreachCampaignSenderDefaults | null> {
  const profile = await repos.outreachTestProfiles.getForTenant(tenantId);
  if (!profile) return null;
  return toSenderDefaults(profile);
}

export function toSenderDefaults(profile: OutreachTestProfile): OutreachCampaignSenderDefaults {
  return {
    campaignLanguage: profile.campaignLanguage,
    companyName: profile.companyName,
    companyWebsite: profile.companyWebsite,
    defaultOptOutLine: profile.defaultOptOutLine,
    defaultProductFocus: profile.defaultProductFocus,
    defaultSignature: profile.defaultSignature,
    defaultTestRecipient: profile.defaultTestRecipient,
    replyToEmail: profile.replyToEmail,
    senderDisplayName: profile.senderDisplayName,
    senderEmail: profile.senderEmail
  };
}

function brandingFieldsFromProfile(profile: OutreachTestProfile) {
  return {
    companyLogoReference: profile.companyLogoReference,
    companyName: profile.companyName,
    companyWebsite: profile.companyWebsite,
    defaultOptOutLine: profile.defaultOptOutLine,
    footerCtaLabel: profile.footerCtaLabel,
    footerCtaUrl: profile.footerCtaUrl,
    showcaseImageReference: profile.showcaseImageReference
  };
}

export function validateOutreachTestProfileInput(input: UpsertOutreachTestProfileInput): void {
  assertOutreachTestProfileHasNoSecrets({
    companyLogoReference: input.companyLogoReference,
    companyName: input.companyName,
    companyWebsite: input.companyWebsite,
    defaultOptOutLine: input.defaultOptOutLine,
    defaultProductFocus: input.defaultProductFocus,
    defaultSignature: input.defaultSignature,
    defaultTestRecipient: input.defaultTestRecipient,
    footerCtaLabel: input.footerCtaLabel,
    footerCtaUrl: input.footerCtaUrl,
    replyToEmail: input.replyToEmail,
    senderDisplayName: input.senderDisplayName,
    senderEmail: input.senderEmail,
    showcaseImageReference: input.showcaseImageReference
  });
}

export async function saveOutreachTestProfile(
  repos: LocalRepositoryBundle,
  tenantId: string,
  input: UpsertOutreachTestProfileInput
): Promise<OutreachTestProfile> {
  validateOutreachTestProfileInput(input);
  const saved = await repos.outreachTestProfiles.upsert(tenantId, input);
  await syncOutreachTestProfileToOperationalContext(repos, tenantId, saved);
  return saved;
}

export async function loadJhGomesOutreachTestProfileDefaults(
  repos: LocalRepositoryBundle,
  tenantId: string
): Promise<OutreachTestProfile> {
  return saveOutreachTestProfile(repos, tenantId, buildJhGomesOutreachTestProfileDefaults());
}

export async function resetOutreachTestProfile(
  repos: LocalRepositoryBundle,
  tenantId: string
): Promise<void> {
  await repos.outreachTestProfiles.reset(tenantId);
}

export async function recordLastEmailTestResult(
  repos: LocalRepositoryBundle,
  tenantId: string,
  result: LastEmailTestResult
): Promise<OutreachTestProfile | null> {
  const profile = await repos.outreachTestProfiles.getForTenant(tenantId);
  if (!profile) return null;
  return repos.outreachTestProfiles.upsert(tenantId, {
    ...brandingFieldsFromProfile(profile),
    campaignLanguage: profile.campaignLanguage,
    defaultProductFocus: profile.defaultProductFocus,
    defaultSignature: profile.defaultSignature,
    defaultTestRecipient: profile.defaultTestRecipient,
    lastEmailTestResult: result,
    replyToEmail: profile.replyToEmail,
    senderDisplayName: profile.senderDisplayName,
    senderEmail: profile.senderEmail
  });
}

export async function syncOutreachTestProfileToOperationalContext(
  repos: LocalRepositoryBundle,
  tenantId: string,
  profile: OutreachTestProfile
): Promise<void> {
  const company = await repos.companyProfiles.getForTenant(tenantId);
  if (company) {
    await repos.companyProfiles.update(tenantId, company.id, {
      tradingName: profile.companyName || company.tradingName,
      websiteUrl: profile.companyWebsite || company.websiteUrl,
      logoPublicUrl: profile.companyLogoReference?.startsWith("https://")
        ? profile.companyLogoReference
        : company.logoPublicUrl
    });
  }

  const sender =
    (await repos.senderIdentities.getDefault(tenantId)) ??
    (await repos.senderIdentities.listAll(tenantId))[0];
  if (!sender) return;

  await repos.senderIdentities.update(tenantId, sender.id, {
    displayName: profile.senderDisplayName || sender.displayName,
    fromEmail: profile.senderEmail || sender.fromEmail,
    replyToEmail: profile.replyToEmail || sender.replyToEmail,
    signatureText: profile.defaultSignature || sender.signatureText
  });
}
