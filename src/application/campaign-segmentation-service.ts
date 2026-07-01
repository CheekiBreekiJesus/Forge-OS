import type {
  OutreachCampaign,
  RecipientRefreshDiff,
  SegmentDefinition
} from "@/domain/campaign-types";
import type { LeadContact } from "@/domain/import-types";
import type { Lead } from "@/domain/types";
import {
  buildLeadManagementRows,
  type LeadManagementContext
} from "@/features/leadops/lead-management";
import {
  resolveSegmentCandidates,
  summarizeSegmentPreview,
  type SegmentCandidate
} from "@/features/leadops/segmentation";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";
import {
  deriveCampaignStatus,
  invalidateCampaignApprovals
} from "@/application/campaign-approval-service";

export type CreateCampaignFromSegmentInput = {
  name: string;
  description?: string;
  language?: string;
  segmentDefinition: SegmentDefinition;
  searchQuery?: string;
};

export async function buildLeadManagementContext(
  repos: LocalRepositoryBundle,
  tenantId: string
): Promise<LeadManagementContext> {
  const [leads, contacts, recipients, messages] = await Promise.all([
    repos.leads.list(tenantId),
    repos.leadContacts.list(tenantId),
    repos.campaignRecipients.listForTenant(tenantId),
    repos.outreachMessages.listAll?.(tenantId) ?? Promise.resolve([])
  ]);

  const outreachSentAtByLeadId = new Map<string, string>();
  for (const message of messages) {
    if (!message.sentAt) continue;
    const current = outreachSentAtByLeadId.get(message.leadId);
    if (!current || message.sentAt > current) {
      outreachSentAtByLeadId.set(message.leadId, message.sentAt);
    }
  }

  return { leads, contacts, recipients, outreachSentAtByLeadId };
}

export function previewCampaignSegment(
  definition: SegmentDefinition,
  context: LeadManagementContext,
  searchQuery = ""
) {
  const candidates = resolveSegmentCandidates(definition, context, searchQuery);
  return {
    candidates,
    counts: summarizeSegmentPreview(candidates)
  };
}

export async function createCampaignWithSnapshot(
  repos: LocalRepositoryBundle,
  tenantId: string,
  input: CreateCampaignFromSegmentInput
): Promise<{ campaign: OutreachCampaign; sendableCount: number }> {
  const context = await buildLeadManagementContext(repos, tenantId);
  const preview = previewCampaignSegment(input.segmentDefinition, context, input.searchQuery ?? "");
  const sendable = preview.candidates.filter((item) => item.row.sendability.sendable);

  const campaign = await repos.campaigns.create(tenantId, {
    name: input.name,
    description: input.description,
    language: input.language,
    segmentDefinition: input.segmentDefinition
  });

  await snapshotCampaignRecipients(repos, tenantId, campaign.id, preview.candidates);

  const updated = await repos.campaigns.update(tenantId, campaign.id, {
    recipientSnapshotCreatedAt: new Date().toISOString(),
    recipientSnapshotCount: sendable.length,
    totalCount: sendable.length
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaign.id,
    action: "campaign_created",
    title: `Campaign created: ${campaign.name}`,
    metadata: { recipientCount: sendable.length }
  });
  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaign.id,
    action: "campaign_segment_snapshotted",
    title: `Segment snapshotted: ${campaign.name}`,
    metadata: { recipientCount: sendable.length }
  });

  return { campaign: updated, sendableCount: sendable.length };
}

async function snapshotCampaignRecipients(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  candidates: SegmentCandidate[]
) {
  const payload = candidates.map((candidate) => ({
    campaignId,
    leadId: candidate.row.leadId,
    contactId: candidate.row.contactId,
    snapshotEmail: candidate.row.email,
    snapshotCompanyName: candidate.row.companyName,
    snapshotContactName: candidate.row.contactName,
    snapshotCategory: candidate.row.category,
    snapshotRegion: candidate.row.region,
    snapshotWebsite: candidate.row.website,
    inclusionReason: candidate.row.sendability.sendable
      ? "sendable"
      : candidate.row.exclusionBucket,
    status: candidate.row.sendability.sendable ? ("included" as const) : ("excluded" as const)
  }));

  await repos.campaignRecipients.replaceForCampaign(tenantId, campaignId, payload);
}

export async function refreshCampaignRecipients(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string
): Promise<{ campaign: OutreachCampaign; diff: RecipientRefreshDiff; sendableCount: number }> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");
  if (campaign.status !== "draft") {
    throw new PersistenceError("invalid_transition", "Recipients can only be refreshed for draft campaigns.");
  }
  if (!campaign.segmentDefinition) {
    throw new PersistenceError("invalid_transition", "Campaign has no segment definition.");
  }

  const context = await buildLeadManagementContext(repos, tenantId);
  const preview = previewCampaignSegment(
    campaign.segmentDefinition,
    context,
    campaign.segmentDefinition.searchQuery ?? ""
  );
  const { diff } = await repos.campaignRecipients.replaceForCampaign(
    tenantId,
    campaignId,
    preview.candidates.map((candidate) => ({
      campaignId,
      leadId: candidate.row.leadId,
      contactId: candidate.row.contactId,
      snapshotEmail: candidate.row.email,
      snapshotCompanyName: candidate.row.companyName,
      snapshotContactName: candidate.row.contactName,
      snapshotCategory: candidate.row.category,
      snapshotRegion: candidate.row.region,
      snapshotWebsite: candidate.row.website,
      inclusionReason: candidate.row.sendability.sendable
        ? "sendable"
        : candidate.row.exclusionBucket,
      status: candidate.row.sendability.sendable ? "included" : "excluded"
    }))
  );

  await invalidateCampaignApprovals(repos, tenantId, campaignId, "campaign_recipients_refreshed");
  const recipientsAfter = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);

  const sendableCount = preview.counts.sendableRecipients;
  const updated = await repos.campaigns.update(tenantId, campaignId, {
    recipientSnapshotCreatedAt: new Date().toISOString(),
    recipientSnapshotCount: sendableCount,
    totalCount: sendableCount,
    status: deriveCampaignStatus(campaign, recipientsAfter)
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaignId,
    action: "campaign_recipients_refreshed",
    title: `Recipients refreshed: ${campaign.name}`,
    metadata: {
      added: diff.added,
      removed: diff.removed,
      newlySuppressed: diff.newlySuppressed,
      newlyInvalid: diff.newlyInvalid
    }
  });

  return { campaign: updated, diff, sendableCount };
}

export function countSendableRecipientsForCampaign(
  campaignId: string,
  context: LeadManagementContext
): number {
  return context.recipients.filter(
    (recipient) => recipient.campaignId === campaignId && recipient.status === "included"
  ).length;
}

export function enrichRows(context: LeadManagementContext) {
  return buildLeadManagementRows(context);
}

export type { Lead, LeadContact, SegmentCandidate };
