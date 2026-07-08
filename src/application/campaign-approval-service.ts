import { containsDemoSenderValues } from "@/features/leadops/demo-sender-values";
import { loadSenderContext, type SenderContext } from "@/application/campaign-sender-context";
import { buildActiveSuppressedEmailSet } from "@/application/suppression-service";
import type {
  CampaignDraftStatus,
  CampaignExternalClient,
  CampaignProgressCounts,
  CampaignRecipient,
  CampaignStatus,
  OutreachCampaign
} from "@/domain/campaign-types";
import type { Lead } from "@/domain/types";
import { buildCampaignDraftComposition } from "@/features/leadops/campaign-draft-composition";
import { isValidEmailSyntax, normalizeEmail } from "@/features/leadops/import-normalization";
import { evaluateSendability } from "@/features/leadops/sendability";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

export const RECENT_CONTACT_COOLDOWN_DAYS = 7;

export type ApprovalBlockReason =
  | "missing_email"
  | "invalid_email"
  | "suppressed"
  | "no_draft"
  | "needs_review"
  | "missing_subject"
  | "missing_body"
  | "unresolved_variables"
  | "sender_incomplete"
  | "demo_sender_values"
  | "missing_opt_out"
  | "campaign_locked"
  | "already_sent"
  | "not_approved"
  | "approval_stale";

export type ApprovalEvaluation = {
  canApprove: boolean;
  reasons: ApprovalBlockReason[];
};

export type BulkApprovalResult = {
  approved: number;
  skipped: Array<{ recipientId: string; reasons: ApprovalBlockReason[] }>;
};

export type DuplicateSendEvaluation = {
  blocked: boolean;
  warn: boolean;
  reasons: string[];
};

const OPERATIONAL_CAMPAIGN_STATUSES: CampaignStatus[] = [
  "draft",
  "ready_for_review",
  "approved",
  "in_progress",
  "active"
];

function nowIso(): string {
  return new Date().toISOString();
}

function unresolvedPattern(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text);
}

function hasOptOutInstruction(body: string): boolean {
  return /remover|remove|unsubscribe|cancelamento|opt.?out|não receber contactos|prefer not to receive/i.test(
    body
  );
}

export function buildApprovalContentHash(recipient: CampaignRecipient): string {
  return [
    recipient.snapshotEmail.trim().toLowerCase(),
    recipient.personalizedSubject.trim(),
    recipient.personalizedPlainText.trim(),
    recipient.personalizedHtml.trim(),
    String(recipient.templateVersion ?? 0)
  ].join("::");
}

export function buildSendIdempotencyKey(campaignId: string, recipient: CampaignRecipient): string {
  return `${campaignId}:${recipient.id}:${buildApprovalContentHash(recipient)}`;
}

export function isCampaignOperational(campaign: OutreachCampaign): boolean {
  return OPERATIONAL_CAMPAIGN_STATUSES.includes(campaign.status);
}

export function computeCampaignProgress(recipients: CampaignRecipient[]): CampaignProgressCounts {
  const included = recipients.filter((row) => row.status === "included");
  return {
    total: included.length,
    pending: included.filter((row) => row.draftStatus === "PENDING").length,
    drafted: included.filter((row) => row.draftStatus === "DRAFTED").length,
    needsReview: included.filter((row) => row.draftStatus === "NEEDS_REVIEW").length,
    approved: included.filter((row) => row.draftStatus === "APPROVED").length,
    openedExternally: included.filter((row) => row.draftStatus === "OPENED_EXTERNALLY").length,
    manuallySent: included.filter((row) => row.draftStatus === "SENT_MANUALLY").length,
    excluded: recipients.filter((row) => row.status === "excluded" || row.draftStatus === "EXCLUDED").length,
    suppressed: included.filter((row) => row.draftStatus === "SUPPRESSED").length,
    skipped: included.filter((row) => row.draftStatus === "SKIPPED").length
  };
}

export function deriveCampaignStatus(
  campaign: OutreachCampaign,
  recipients: CampaignRecipient[]
): CampaignStatus {
  if (campaign.status === "paused" || campaign.status === "cancelled") {
    return campaign.status;
  }

  const progress = computeCampaignProgress(recipients);
  const actionable = progress.total;

  if (actionable === 0) return "draft";
  if (progress.manuallySent >= actionable) return "completed";
  if (progress.manuallySent > 0 || progress.openedExternally > 0) return "in_progress";
  if (progress.approved >= actionable) return "approved";
  if (progress.needsReview > 0) return "ready_for_review";
  if (progress.drafted > 0 || progress.pending > 0) return "draft";
  return campaign.status === "active" ? "in_progress" : campaign.status;
}

export async function evaluateRecipientApproval(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaign: OutreachCampaign,
  recipient: CampaignRecipient,
  senderContext?: SenderContext,
  lead?: Lead | null
): Promise<ApprovalEvaluation> {
  const reasons: ApprovalBlockReason[] = [];
  const sender = senderContext ?? (await loadSenderContext(repos, tenantId, campaign));
  const leadRow = lead ?? (await repos.leads.getById(tenantId, recipient.leadId));

  if (!isCampaignOperational(campaign)) reasons.push("campaign_locked");
  if (recipient.status !== "included") reasons.push("campaign_locked");
  if (recipient.draftStatus === "SENT_MANUALLY") reasons.push("already_sent");

  const email = recipient.snapshotEmail.trim();
  if (!email) reasons.push("missing_email");
  else if (!isValidEmailSyntax(email)) reasons.push("invalid_email");

  if (!recipient.personalizedSubject.trim()) reasons.push("missing_subject");
  if (!recipient.personalizedPlainText.trim()) reasons.push("missing_body");

  if (recipient.draftStatus === "PENDING") reasons.push("no_draft");
  if (recipient.draftStatus === "NEEDS_REVIEW") reasons.push("needs_review");
  if (recipient.draftStatus === "SUPPRESSED") reasons.push("suppressed");
  if (
    unresolvedPattern(recipient.personalizedSubject) ||
    unresolvedPattern(recipient.personalizedPlainText)
  ) {
    reasons.push("unresolved_variables");
  }

  if (!sender.ready) reasons.push("sender_incomplete");
  if (
    containsDemoSenderValues([
      sender.sender.displayName,
      sender.sender.fromEmail,
      sender.sender.replyToEmail,
      sender.sender.phone
    ])
  ) {
    reasons.push("demo_sender_values");
  }
  if (!hasOptOutInstruction(recipient.personalizedPlainText)) reasons.push("missing_opt_out");

  const suppressedEmails = await buildActiveSuppressedEmailSet(repos, tenantId);
  if (email && suppressedEmails.has(normalizeEmail(email))) {
    reasons.push("suppressed");
  }

  if (leadRow) {
    const sendability = evaluateSendability({ tenantId, lead: leadRow, suppressedEmails });
    if (sendability.reasons.includes("suppressed")) reasons.push("suppressed");
  }

  return { canApprove: reasons.length === 0, reasons };
}

export async function approveRecipientDraft(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  recipientId: string,
  approvedBy = "local-user"
): Promise<CampaignRecipient> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");
  const recipient = (await repos.campaignRecipients.listForCampaign(tenantId, campaignId)).find(
    (row) => row.id === recipientId
  );
  if (!recipient) throw new PersistenceError("not_found", "Recipient not found.");

  const evaluation = await evaluateRecipientApproval(repos, tenantId, campaign, recipient);
  if (!evaluation.canApprove) {
    throw new PersistenceError(
      "invalid_transition",
      `Cannot approve draft: ${evaluation.reasons.join(", ")}`
    );
  }

  const timestamp = nowIso();
  const contentHash = buildApprovalContentHash(recipient);
  const updated = await repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    draftStatus: "APPROVED",
    approvedAt: timestamp,
    approvedBy,
    approvalContentHash: contentHash,
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    sendIdempotencyKey: buildSendIdempotencyKey(campaignId, recipient)
  });

  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  await repos.campaigns.update(tenantId, campaignId, {
    status: deriveCampaignStatus(campaign, recipients)
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaignId,
    action: "campaign_draft_approved",
    title: `Draft approved: ${recipient.snapshotCompanyName}`,
    metadata: { recipientId, approvedBy }
  });

  return updated;
}

export async function bulkApproveRecipientDrafts(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  approvedBy = "local-user"
): Promise<BulkApprovalResult> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");
  const senderContext = await loadSenderContext(repos, tenantId, campaign);
  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  const included = recipients.filter((row) => row.status === "included");

  let approved = 0;
  const skipped: BulkApprovalResult["skipped"] = [];

  for (const recipient of included) {
    if (recipient.draftStatus === "SENT_MANUALLY" || recipient.draftStatus === "APPROVED") {
      continue;
    }
    const evaluation = await evaluateRecipientApproval(
      repos,
      tenantId,
      campaign,
      recipient,
      senderContext
    );
    if (!evaluation.canApprove) {
      skipped.push({ recipientId: recipient.id, reasons: evaluation.reasons });
      continue;
    }
    await approveRecipientDraft(repos, tenantId, campaignId, recipient.id, approvedBy);
    approved += 1;
  }

  return { approved, skipped };
}

export async function excludeRecipientFromCampaign(
  repos: LocalRepositoryBundle,
  tenantId: string,
  _campaignId: string,
  recipientId: string,
  reason = "excluded_by_operator"
): Promise<CampaignRecipient> {
  return repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    status: "excluded",
    draftStatus: "EXCLUDED",
    approvalInvalidatedAt: nowIso(),
    approvalInvalidationReason: reason
  });
}

export async function skipRecipientDraft(
  repos: LocalRepositoryBundle,
  tenantId: string,
  recipientId: string
): Promise<CampaignRecipient> {
  return repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    draftStatus: "SKIPPED"
  });
}

export async function invalidateRecipientApproval(
  repos: LocalRepositoryBundle,
  tenantId: string,
  recipientId: string,
  reason: string
): Promise<CampaignRecipient | null> {
  const recipient = await repos.campaignRecipients.getById(tenantId, recipientId);
  if (!recipient) return null;
  if (
    recipient.draftStatus !== "APPROVED" &&
    recipient.draftStatus !== "OPENED_EXTERNALLY"
  ) {
    return recipient;
  }

  const nextStatus: CampaignDraftStatus =
    recipient.draftStatus === "OPENED_EXTERNALLY"
      ? "DRAFTED"
      : recipient.personalizedSubject.trim() && recipient.personalizedPlainText.trim()
        ? unresolvedPattern(`${recipient.personalizedSubject}\n${recipient.personalizedPlainText}`)
          ? "NEEDS_REVIEW"
          : "DRAFTED"
        : "PENDING";

  const updated = await repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    draftStatus: nextStatus,
    approvedAt: null,
    approvedBy: null,
    approvalContentHash: null,
    approvalInvalidatedAt: nowIso(),
    approvalInvalidationReason: reason,
    openedExternallyAt: null,
    externalClient: null,
    sendIdempotencyKey: null
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: recipient.campaignId,
    action: "campaign_draft_approval_invalidated",
    title: `Approval invalidated: ${recipient.snapshotCompanyName}`,
    metadata: { recipientId, reason }
  });

  return updated;
}

export async function invalidateCampaignApprovals(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  reason: string
): Promise<number> {
  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  let count = 0;
  for (const recipient of recipients) {
    if (recipient.draftStatus === "APPROVED" || recipient.draftStatus === "OPENED_EXTERNALLY") {
      await invalidateRecipientApproval(repos, tenantId, recipient.id, reason);
      count += 1;
    }
  }
  return count;
}

export async function evaluateDuplicateSend(
  repos: LocalRepositoryBundle,
  tenantId: string,
  _campaign: OutreachCampaign,
  recipient: CampaignRecipient,
  options?: { ignoreCooldown?: boolean }
): Promise<DuplicateSendEvaluation> {
  const reasons: string[] = [];
  let blocked = false;
  let warn = false;

  if (recipient.draftStatus === "SENT_MANUALLY") {
    blocked = true;
    reasons.push("already_sent_for_campaign");
  }

  const currentHash = buildApprovalContentHash(recipient);
  if (
    recipient.sendIdempotencyKey &&
    recipient.approvalContentHash &&
    recipient.approvalContentHash !== currentHash
  ) {
    blocked = true;
    reasons.push("approval_stale");
  }

  const lead = await repos.leads.getById(tenantId, recipient.leadId);
  if (lead) {
    const sendability = evaluateSendability({ tenantId, lead });
    if (sendability.reasons.includes("suppressed")) {
      blocked = true;
      reasons.push("suppressed");
    }
  }

  if (!options?.ignoreCooldown && lead) {
    const messages = await repos.outreachMessages.listForLead(tenantId, recipient.leadId);
    const latestSent = messages
      .map((row) => row.sentAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    const reference = latestSent ?? recipient.sentAt;
    if (reference) {
      const daysSince =
        (Date.now() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < RECENT_CONTACT_COOLDOWN_DAYS) {
        warn = true;
        reasons.push("recent_contact");
      }
    }
  }

  return { blocked, warn, reasons };
}

export async function markRecipientOpenedExternally(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  recipientId: string,
  client: CampaignExternalClient
): Promise<CampaignRecipient> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");
  const recipient = (await repos.campaignRecipients.getById(tenantId, recipientId)) ?? null;
  if (!recipient) throw new PersistenceError("not_found", "Recipient not found.");
  if (recipient.draftStatus !== "APPROVED" && recipient.draftStatus !== "OPENED_EXTERNALLY") {
    throw new PersistenceError("invalid_transition", "Only approved drafts can open external compose.");
  }

  const duplicate = await evaluateDuplicateSend(repos, tenantId, campaign, recipient);
  if (duplicate.blocked) {
    throw new PersistenceError(
      "invalid_transition",
      `Cannot open compose: ${duplicate.reasons.join(", ")}`
    );
  }

  const timestamp = nowIso();
  const updated = await repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    draftStatus: "OPENED_EXTERNALLY",
    openedExternallyAt: timestamp,
    externalClient: client
  });

  await repos.campaigns.update(tenantId, campaignId, {
    status: deriveCampaignStatus(campaign, await repos.campaignRecipients.listForCampaign(tenantId, campaignId))
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaignId,
    action: "campaign_draft_opened_external",
    title: `External compose opened: ${recipient.snapshotCompanyName}`,
    metadata: { recipientId, client }
  });

  return updated;
}

export async function markRecipientManuallySent(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  recipientId: string,
  input: {
    sentBy?: string;
    externalClient?: CampaignExternalClient;
    operatorNote?: string;
    ignoreCooldown?: boolean;
    cooldownOverrideReason?: string;
  } = {}
): Promise<CampaignRecipient> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");
  const recipient = await repos.campaignRecipients.getById(tenantId, recipientId);
  if (!recipient) throw new PersistenceError("not_found", "Recipient not found.");

  if (
    recipient.draftStatus !== "APPROVED" &&
    recipient.draftStatus !== "OPENED_EXTERNALLY"
  ) {
    throw new PersistenceError("invalid_transition", "Draft must be approved before marking sent.");
  }

  if (buildApprovalContentHash(recipient) !== recipient.approvalContentHash) {
    throw new PersistenceError("invalid_transition", "Approved content changed since approval.");
  }

  const duplicate = await evaluateDuplicateSend(repos, tenantId, campaign, recipient, {
    ignoreCooldown: input.ignoreCooldown
  });
  if (duplicate.blocked) {
    await repos.activities.append(tenantId, {
      entityType: "campaign",
      entityId: campaignId,
      action: "campaign_draft_duplicate_blocked",
      title: `Duplicate send blocked: ${recipient.snapshotCompanyName}`,
      metadata: { recipientId, reasons: duplicate.reasons.join(",") }
    });
    throw new PersistenceError("invalid_transition", `Duplicate send blocked: ${duplicate.reasons.join(", ")}`);
  }

  if (duplicate.warn && !input.ignoreCooldown) {
    throw new PersistenceError("invalid_transition", "Recent contact cooldown requires explicit override.");
  }

  if (input.ignoreCooldown && input.cooldownOverrideReason?.trim()) {
    await repos.activities.append(tenantId, {
      entityType: "campaign",
      entityId: campaignId,
      action: "campaign_draft_cooldown_override",
      title: `Cooldown override: ${recipient.snapshotCompanyName}`,
      metadata: { recipientId, reason: input.cooldownOverrideReason.trim() }
    });
  }

  const timestamp = nowIso();
  const sentBy = input.sentBy ?? "local-user";
  const idempotencyKey = buildSendIdempotencyKey(campaignId, recipient);

  const updated = await repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    draftStatus: "SENT_MANUALLY",
    sentAt: timestamp,
    sentBy,
    recipientDeliveryMode: "manual_external",
    externalClient: input.externalClient ?? recipient.externalClient,
    operatorNote: input.operatorNote?.trim() ?? recipient.operatorNote,
    sendIdempotencyKey: idempotencyKey
  });

  await repos.outreachMessages.saveDraft(tenantId, recipient.leadId, {
    id: `cmr_${recipient.id}`,
    tenantId,
    leadId: recipient.leadId,
    campaignId,
    message: null,
    providerState: "sent",
    queuedAt: recipient.openedExternallyAt,
    sentAt: timestamp,
    metricsUpdated: true,
    updatedAt: timestamp
  });

  const lead = await repos.leads.getById(tenantId, recipient.leadId);
  if (lead && lead.outreachStatus !== "bounced" && lead.consentStatus !== "unsubscribed") {
    await repos.leads.update(tenantId, recipient.leadId, {
      outreachStatus: "contacted"
    });
  }

  const recipients = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
  const sentCount = recipients.filter((row) => row.draftStatus === "SENT_MANUALLY").length;
  await repos.campaigns.update(tenantId, campaignId, {
    sentCount,
    status: deriveCampaignStatus(campaign, recipients)
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaignId,
    action: "campaign_draft_sent_manual",
    title: `Marked sent externally: ${recipient.snapshotCompanyName}`,
    metadata: {
      recipientId,
      sentBy,
      deliveryMode: "manual_external",
      externalClient: input.externalClient ?? recipient.externalClient ?? "default"
    }
  });

  return updated;
}

export async function simulateRecipientSend(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  recipientId: string
): Promise<CampaignRecipient> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");
  const recipient = await repos.campaignRecipients.getById(tenantId, recipientId);
  if (!recipient) throw new PersistenceError("not_found", "Recipient not found.");
  if (recipient.draftStatus !== "APPROVED" && recipient.draftStatus !== "OPENED_EXTERNALLY") {
    throw new PersistenceError("invalid_transition", "Draft must be approved before simulation.");
  }

  const timestamp = nowIso();
  const updated = await repos.campaignRecipients.updateDraft(tenantId, recipientId, {
    simulatedAt: timestamp,
    recipientDeliveryMode: "simulation"
  });

  await repos.activities.append(tenantId, {
    entityType: "campaign",
    entityId: campaignId,
    action: "campaign_draft_sent_simulated",
    title: `Simulated send: ${recipient.snapshotCompanyName}`,
    metadata: { recipientId }
  });

  return updated;
}

export async function getApprovedCompositionForRecipient(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaign: OutreachCampaign,
  recipient: CampaignRecipient
) {
  const senderContext = await loadSenderContext(repos, tenantId, campaign);
  return buildCampaignDraftComposition(recipient, senderContext);
}
