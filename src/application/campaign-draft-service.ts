import type {
  CampaignDraftGenerationMethod,
  CampaignDraftStatus,
  CampaignRecipient,
  OutreachCampaign,
  UpdateCampaignRecipientDraftInput
} from "@/domain/campaign-types";
import { loadSenderContext, type SenderContext } from "@/application/campaign-sender-context";
import type { ContactSalutation } from "@/features/leadops/salutation-resolver";
import { plainTextToHtml, sanitizeEmailHtml } from "@/features/email-composition/sanitize";
import { buildDefaultCampaignTemplate } from "@/features/leadops/default-templates";
import {
  countUnresolvedInTemplate,
  renderCampaignTemplate,
  type TemplateRenderResult
} from "@/features/leadops/template-rendering";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";
import {
  deriveCampaignStatus,
  invalidateCampaignApprovals,
  invalidateRecipientApproval
} from "@/application/campaign-approval-service";

export { loadSenderContext, type SenderContext };

export type CampaignDraftPreview = {
  counts: {
    includedRecipients: number;
    drafted: number;
    pending: number;
    needsReview: number;
    unresolvedTemplateVariables: number;
    editedDrafts: number;
  };
  sender: SenderContext;
};

export type GenerateDraftsResult = {
  generated: number;
  skippedEdited: number;
  needsReview: number;
  drafted: number;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function ensureCampaignTemplate(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaign: OutreachCampaign
): Promise<OutreachCampaign> {
  if (campaign.subjectTemplate.trim() && campaign.plainTextTemplate.trim()) {
    return campaign;
  }
  const defaults = buildDefaultCampaignTemplate(campaign.language);
  return repos.campaigns.update(tenantId, campaign.id, {
    subjectTemplate: defaults.subjectTemplate,
    plainTextTemplate: defaults.plainTextTemplate,
    htmlTemplate: defaults.htmlTemplate,
    templateVersion: defaults.templateVersion,
    templateUpdatedAt: nowIso()
  });
}

export async function saveCampaignTemplate(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  input: {
    subjectTemplate: string;
    plainTextTemplate: string;
    htmlTemplate?: string;
    language?: string;
  }
): Promise<OutreachCampaign> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");
  if (campaign.status !== "draft") {
    throw new PersistenceError("invalid_transition", "Templates can only be edited for draft campaigns.");
  }

  const updated = await repos.campaigns.update(tenantId, campaignId, {
    subjectTemplate: input.subjectTemplate.trim(),
    plainTextTemplate: input.plainTextTemplate.trim(),
    htmlTemplate: input.htmlTemplate?.trim() ?? "",
    language: input.language ?? campaign.language,
    templateVersion: campaign.templateVersion + 1,
    templateUpdatedAt: nowIso()
  });

  await invalidateCampaignApprovals(repos, tenantId, campaignId, "campaign_template_updated");
  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  await repos.campaigns.update(tenantId, campaignId, {
    status: deriveCampaignStatus(updated, recipients)
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaignId,
    action: "campaign_template_updated",
    title: `Template updated: ${campaign.name}`,
    metadata: { templateVersion: updated.templateVersion }
  });

  return updated;
}

export function renderRecipientDraft(
  campaign: OutreachCampaign,
  recipient: CampaignRecipient,
  senderContext: SenderContext
): TemplateRenderResult {
  return renderCampaignTemplate({
    subjectTemplate: campaign.subjectTemplate,
    plainTextTemplate: campaign.plainTextTemplate,
    htmlTemplate: campaign.htmlTemplate,
    language: campaign.language,
    recipient,
    sender: senderContext.sender,
    company: senderContext.company
  });
}

export async function previewCampaignDrafts(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string
): Promise<CampaignDraftPreview> {
  const existing = await repos.campaigns.getById(tenantId, campaignId);
  if (!existing) throw new PersistenceError("not_found", "Campaign not found.");
  const campaign = await ensureCampaignTemplate(repos, tenantId, existing);
  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  const included = recipients.filter((row) => row.status === "included");
  const sender = await loadSenderContext(repos, tenantId, campaign);

  return {
    counts: {
      includedRecipients: included.length,
      drafted: included.filter((row) => row.draftStatus === "DRAFTED").length,
      pending: included.filter((row) => row.draftStatus === "PENDING").length,
      needsReview: included.filter((row) => row.draftStatus === "NEEDS_REVIEW").length,
      unresolvedTemplateVariables: countUnresolvedInTemplate(
        campaign.subjectTemplate,
        campaign.plainTextTemplate
      ).length,
      editedDrafts: included.filter((row) => row.userEdited).length
    },
    sender
  };
}

function resolveDraftStatus(rendered: TemplateRenderResult): CampaignDraftStatus {
  if (rendered.hasUnresolvedVariables) return "NEEDS_REVIEW";
  return "DRAFTED";
}

export async function generateCampaignDrafts(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  options?: { skipEdited?: boolean; recipientIds?: string[] }
): Promise<GenerateDraftsResult> {
  const existing = await repos.campaigns.getById(tenantId, campaignId);
  if (!existing) throw new PersistenceError("not_found", "Campaign not found.");
  const campaign = await ensureCampaignTemplate(repos, tenantId, existing);
  if (campaign.status !== "draft") {
    throw new PersistenceError("invalid_transition", "Drafts can only be generated for draft campaigns.");
  }

  const senderContext = await loadSenderContext(repos, tenantId, campaign);
  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  const targetIds = options?.recipientIds ? new Set(options.recipientIds) : null;
  const skipEdited = options?.skipEdited !== false;

  let generated = 0;
  let skippedEdited = 0;
  let needsReview = 0;
  let drafted = 0;
  const timestamp = nowIso();

  for (const recipient of recipients) {
    if (recipient.status !== "included") continue;
    if (targetIds && !targetIds.has(recipient.id)) continue;
    if (skipEdited && recipient.userEdited) {
      skippedEdited += 1;
      continue;
    }

    const rendered = renderRecipientDraft(campaign, recipient, senderContext);
    const draftStatus = resolveDraftStatus(rendered);
    if (draftStatus === "NEEDS_REVIEW") needsReview += 1;
    else drafted += 1;

    await repos.campaignRecipients.updateDraft(tenantId, recipient.id, {
      personalizedSubject: rendered.subject,
      personalizedPlainText: rendered.plainText,
      personalizedHtml: rendered.html,
      draftStatus,
      generatedAt: timestamp,
      generationMethod: "deterministic_template" as CampaignDraftGenerationMethod,
      templateVersion: campaign.templateVersion,
      userEdited: false,
      draftUpdatedAt: timestamp
    });
    generated += 1;
  }

  if (generated > 0) {
    await repos.activities.append(tenantId, {
      entityType: "campaign",
      entityId: campaignId,
      action: "campaign_drafts_generated",
      title: `Drafts generated: ${campaign.name}`,
      metadata: { generated, needsReview, drafted }
    });
  }

  return { generated, skippedEdited, needsReview, drafted };
}

export async function regenerateRecipientDraft(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  recipientId: string,
  force = false
): Promise<CampaignRecipient> {
  const existing = await repos.campaigns.getById(tenantId, campaignId);
  if (!existing) throw new PersistenceError("not_found", "Campaign not found.");
  const campaign = await ensureCampaignTemplate(repos, tenantId, existing);
  const recipient = (await repos.campaignRecipients.listForCampaign(tenantId, campaignId)).find(
    (row) => row.id === recipientId
  );
  if (!recipient) throw new PersistenceError("not_found", "Recipient not found.");
  if (recipient.userEdited && !force) {
    throw new PersistenceError(
      "invalid_transition",
      "This draft was edited manually. Confirm regeneration to overwrite."
    );
  }

  const senderContext = await loadSenderContext(repos, tenantId, campaign);
  const rendered = renderRecipientDraft(campaign, recipient, senderContext);
  const timestamp = nowIso();

  if (recipient.draftStatus === "APPROVED" || recipient.draftStatus === "OPENED_EXTERNALLY") {
    await invalidateRecipientApproval(repos, tenantId, recipientId, "draft_regenerated");
  }

  return repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    personalizedSubject: rendered.subject,
    personalizedPlainText: rendered.plainText,
    personalizedHtml: rendered.html,
    draftStatus: resolveDraftStatus(rendered),
    generatedAt: timestamp,
    generationMethod: "deterministic_template",
    templateVersion: campaign.templateVersion,
    userEdited: false,
    draftUpdatedAt: timestamp
  });
}

export async function updateRecipientDraftContent(
  repos: LocalRepositoryBundle,
  tenantId: string,
  recipientId: string,
  input: { personalizedSubject: string; personalizedPlainText: string }
): Promise<CampaignRecipient> {
  const subject = input.personalizedSubject.trim();
  const plainText = input.personalizedPlainText.replace(/\r\n/g, "\n").trim();
  const hasUnresolved = findManualUnresolved(subject, plainText);
  const existing = await repos.campaignRecipients.getById(tenantId, recipientId);
  if (existing && (existing.draftStatus === "APPROVED" || existing.draftStatus === "OPENED_EXTERNALLY")) {
    await invalidateRecipientApproval(repos, tenantId, recipientId, "manual_draft_edit");
  }

  return repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    personalizedSubject: subject,
    personalizedPlainText: plainText,
    personalizedHtml: sanitizeEmailHtml(plainTextToHtml(plainText)),
    draftStatus: hasUnresolved.length > 0 ? "NEEDS_REVIEW" : "DRAFTED",
    generationMethod: "manual",
    userEdited: true,
    draftUpdatedAt: nowIso()
  });
}

function findManualUnresolved(subject: string, body: string): string[] {
  const pattern = /\{\{[^}]+\}\}/g;
  const unresolved = new Set<string>();
  for (const match of `${subject}\n${body}`.matchAll(pattern)) {
    unresolved.add(match[0].replace(/[{}]/g, "").trim());
  }
  return [...unresolved];
}

export async function previewTemplateSample(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  recipientId?: string
): Promise<TemplateRenderResult> {
  const existing = await repos.campaigns.getById(tenantId, campaignId);
  if (!existing) throw new PersistenceError("not_found", "Campaign not found.");
  const campaign = await ensureCampaignTemplate(repos, tenantId, existing);
  const senderContext = await loadSenderContext(repos, tenantId, campaign);
  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  const recipient =
    recipients.find((row) => row.id === recipientId && row.status === "included") ??
    recipients.find((row) => row.status === "included");
  if (!recipient) {
    throw new PersistenceError("not_found", "No included recipient available for preview.");
  }
  return renderRecipientDraft(campaign, recipient, senderContext);
}

export async function refreshCampaignSenderData(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string
): Promise<{ campaign: OutreachCampaign; regenerated: number }> {
  const existing = await repos.campaigns.getById(tenantId, campaignId);
  if (!existing) throw new PersistenceError("not_found", "Campaign not found.");
  if (existing.status !== "draft" && existing.status !== "ready_for_review") {
    throw new PersistenceError(
      "invalid_transition",
      "Sender data can only be refreshed for draft campaigns."
    );
  }

  const defaultSender = await repos.senderIdentities.getDefault(tenantId);
  const updatedCampaign = await repos.campaigns.update(tenantId, campaignId, {
    senderProfileId: defaultSender?.id ?? null,
    fromName: defaultSender?.displayName ?? "",
    replyTo: defaultSender?.replyToEmail || defaultSender?.fromEmail || ""
  });

  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  let regenerated = 0;
  for (const recipient of recipients) {
    if (recipient.status !== "included") continue;
    if (recipient.draftStatus === "APPROVED" || recipient.draftStatus === "OPENED_EXTERNALLY") {
      continue;
    }
    if (recipient.draftStatus === "SENT_MANUALLY") continue;
    if (recipient.userEdited) continue;
    await regenerateRecipientDraft(repos, tenantId, campaignId, recipient.id, true);
    regenerated += 1;
  }

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaignId,
    action: "campaign_sender_refreshed",
    title: `Sender data refreshed: ${existing.name}`,
    metadata: { regenerated }
  });

  return { campaign: updatedCampaign, regenerated };
}

export async function updateRecipientPersonalizationOverrides(
  repos: LocalRepositoryBundle,
  tenantId: string,
  recipientId: string,
  input: {
    greetingOverride?: string;
    organizationDisplayNameOverride?: string;
    contactSalutation?: ContactSalutation | null;
    personalizedSubject?: string;
  }
): Promise<CampaignRecipient> {
  const existing = await repos.campaignRecipients.getById(tenantId, recipientId);
  if (!existing) throw new PersistenceError("not_found", "Recipient not found.");

  const patch: UpdateCampaignRecipientDraftInput = {
    greetingOverride: input.greetingOverride ?? existing.greetingOverride,
    organizationDisplayNameOverride:
      input.organizationDisplayNameOverride ?? existing.organizationDisplayNameOverride,
    contactSalutation:
      input.contactSalutation === undefined ? existing.contactSalutation : input.contactSalutation
  };

  if (input.personalizedSubject !== undefined) {
    patch.personalizedSubject = input.personalizedSubject.trim();
  }

  if (existing.draftStatus === "APPROVED" || existing.draftStatus === "OPENED_EXTERNALLY") {
    await invalidateRecipientApproval(repos, tenantId, recipientId, "personalization_override");
  }

  const updated = await repos.campaignRecipients.updateDraft(tenantId, recipientId, patch);
  return regenerateRecipientDraft(repos, tenantId, existing.campaignId, recipientId, true);
}
