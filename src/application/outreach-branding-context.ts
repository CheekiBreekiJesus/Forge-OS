import type { OutreachCampaign } from "@/domain/campaign-types";
import type { SenderContext } from "@/application/campaign-sender-context";
import {
  resolveOutreachBrandingConfig,
  type OutreachBrandingConfig
} from "@/features/email-composition/outreach-branding-config";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

export async function loadOutreachBrandingConfig(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaign: Pick<OutreachCampaign, "language">,
  senderContext: SenderContext,
  publicBaseUrl?: string
): Promise<OutreachBrandingConfig> {
  const profile = await repos.outreachTestProfiles.getForTenant(tenantId);
  return resolveOutreachBrandingConfig({
    company: senderContext.company,
    locale: campaign.language,
    profile,
    publicBaseUrl,
    sender: senderContext.sender
  });
}
