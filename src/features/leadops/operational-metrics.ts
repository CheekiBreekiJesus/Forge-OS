import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type { EmailSuppression } from "@/domain/suppression-types";
import type { Lead } from "@/domain/types";
import type { LeadContact } from "@/domain/import-types";
import { computeCampaignProgress } from "@/application/campaign-approval-service";
import { evaluateSendability } from "@/features/leadops/sendability";
import { normalizeEmail } from "@/features/leadops/import-normalization";

export type OutreachOperationalMetrics = {
  importedOrganizations: number;
  validContacts: number;
  invalidOrMissingEmailContacts: number;
  draftCampaigns: number;
  draftsAwaitingReview: number;
  approvedRecipients: number;
  openedExternally: number;
  manuallySent: number;
  suppressed: number;
  recentWarnings: number;
};

export function computeOutreachOperationalMetrics(input: {
  leads: Lead[];
  contacts: LeadContact[];
  campaigns: OutreachCampaign[];
  recipients: CampaignRecipient[];
  suppressions: EmailSuppression[];
  recentWarningCount?: number;
}): OutreachOperationalMetrics {
  const activeLeads = input.leads.filter((lead) => lead.active);
  const activeContacts = input.contacts.filter((contact) => contact.active);
  const importedOrganizations = activeLeads.filter((lead) => Boolean(lead.sourceImportId)).length;

  let validContacts = 0;
  let invalidOrMissingEmailContacts = 0;
  for (const lead of activeLeads) {
    const contact = activeContacts.find((row) => row.leadId === lead.id && row.isPrimary) ?? null;
    const result = evaluateSendability({ tenantId: lead.tenantId, lead, contact });
    if (result.reasons.includes("missing_email") || result.reasons.includes("invalid_email")) {
      invalidOrMissingEmailContacts += 1;
    } else if (result.sendable || result.reasons.includes("suppressed")) {
      validContacts += 1;
    }
  }

  const progressTotals = input.campaigns.reduce(
    (acc, campaign) => {
      const campaignRecipients = input.recipients.filter((row) => row.campaignId === campaign.id);
      const progress = computeCampaignProgress(campaignRecipients);
      return {
        draftsAwaitingReview: acc.draftsAwaitingReview + progress.needsReview,
        approvedRecipients: acc.approvedRecipients + progress.approved,
        openedExternally: acc.openedExternally + progress.openedExternally,
        manuallySent: acc.manuallySent + progress.manuallySent
      };
    },
    {
      draftsAwaitingReview: 0,
      approvedRecipients: 0,
      openedExternally: 0,
      manuallySent: 0
    }
  );

  const draftCampaigns = input.campaigns.filter((campaign) =>
    ["draft", "ready_for_review"].includes(campaign.status)
  ).length;

  const activeSuppressions = input.suppressions.filter((row) => row.active);
  const suppressedEmails = new Set(activeSuppressions.map((row) => row.normalizedEmail));

  return {
    importedOrganizations,
    validContacts,
    invalidOrMissingEmailContacts,
    draftCampaigns,
    draftsAwaitingReview: progressTotals.draftsAwaitingReview,
    approvedRecipients: progressTotals.approvedRecipients,
    openedExternally: progressTotals.openedExternally,
    manuallySent: progressTotals.manuallySent,
    suppressed: suppressedEmails.size,
    recentWarnings: input.recentWarningCount ?? 0
  };
}

export function buildSuppressedEmailSet(suppressions: EmailSuppression[]): Set<string> {
  return new Set(
    suppressions.filter((row) => row.active).map((row) => normalizeEmail(row.normalizedEmail))
  );
}
