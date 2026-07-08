import type { OutreachCampaign } from "@/domain/campaign-types";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

export type SenderContext = {
  company: CompanyProfileSnapshot;
  sender: SenderIdentitySnapshot;
  missingFields: string[];
  ready: boolean;
};

export async function loadSenderContext(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaign: OutreachCampaign
): Promise<SenderContext> {
  const companyRow = await repos.companyProfiles.getForTenant(tenantId);
  if (!companyRow) {
    throw new PersistenceError("not_found", "Company profile not found.");
  }

  const senderRow = campaign.senderProfileId
    ? await repos.senderIdentities.getById(tenantId, campaign.senderProfileId)
    : await repos.senderIdentities.getDefault(tenantId);

  if (!senderRow) {
    return {
      company: companyRow,
      sender: {
        active: true,
        companyProfileId: companyRow.id,
        defaultLanguage: companyRow.defaultLanguage,
        displayName: "",
        fromEmail: "",
        id: "",
        isDefault: true,
        jobTitle: "",
        phone: "",
        replyToEmail: "",
        signatureHtml: "",
        signatureText: "",
        tenantId,
        userProfileId: ""
      },
      missingFields: ["senderIdentity"],
      ready: false
    };
  }

  const missingFields: string[] = [];
  if (!senderRow.displayName.trim()) missingFields.push("senderName");
  if (!senderRow.fromEmail.trim() && !senderRow.replyToEmail.trim()) {
    missingFields.push("senderEmail");
  }
  if (!(companyRow.tradingName || companyRow.legalName).trim()) {
    missingFields.push("companySenderName");
  }

  return {
    company: companyRow,
    sender: senderRow,
    missingFields,
    ready: missingFields.length === 0
  };
}
