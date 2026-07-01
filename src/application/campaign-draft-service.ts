import type {
  CampaignDraftGenerationMethod,
  CampaignDraftStatus,
  CampaignRecipient,
  OutreachCampaign
} from "@/domain/campaign-types";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import { plainTextToHtml, sanitizeEmailHtml } from "@/features/email-composition/sanitize";
import { buildDefaultCampaignTemplate } from "@/features/leadops/default-templates";
import {
  countUnresolvedInTemplate,
  renderCampaignTemplate,
  type TemplateRenderResult
} from "@/features/leadops/template-rendering";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

export type SenderContext = {
  company: CompanyProfileSnapshot;
  sender: SenderIdentitySnapshot;
  missingFields: string[];
  ready: boolean;
};

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
  if (!senderRow.fromEmail.trim()) missingFields.push("senderEmail");
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
