import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import type { OutreachApprovedDeliveryResult } from "@/domain/outreach-approved-delivery";
import { buildOutreachDeliveryIdempotencyKey } from "@/domain/outreach-approved-delivery";
import type { OutreachSendAttemptStatus } from "@/domain/email-delivery-types";
import { deliverApprovedOutreachMessage } from "@/features/leadops/server-delivery";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";
import { buildOutreachRequestFingerprint } from "@/persistence/supabase/mappers";

export type MessageSendInput = {
  tenantId: string;
  campaignId: string;
  recipientId: string;
  actorId: string;
};

export type MessageSendResult = {
  delivery: OutreachApprovedDeliveryResult;
  idempotencyKey: string;
  alreadyProcessed: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function mapAttemptStatus(
  providerStatus: OutreachApprovedDeliveryResult["providerStatus"]
): OutreachSendAttemptStatus {
  if (providerStatus === "sent") return "TEST_SENT";
  return "TEST_BLOCKED";
}

function hasAtomicClaim(
  repos: LocalRepositoryBundle
): repos is LocalRepositoryBundle & {
  outreachSendAttempts: LocalRepositoryBundle["outreachSendAttempts"] & {
    claim: NonNullable<LocalRepositoryBundle["outreachSendAttempts"]["claim"]>;
    complete: NonNullable<LocalRepositoryBundle["outreachSendAttempts"]["complete"]>;
  };
} {
  return (
    typeof repos.outreachSendAttempts.claim === "function" &&
    typeof repos.outreachSendAttempts.complete === "function"
  );
}

export async function sendApprovedOutreachMessage(
  repos: LocalRepositoryBundle,
  input: MessageSendInput
): Promise<MessageSendResult> {
  const campaign = await repos.campaigns.getById(input.tenantId, input.campaignId);
  if (!campaign) {
    throw new PersistenceError("not_found", "Campaign not found.");
  }

  const recipient = await repos.campaignRecipients.getById(input.tenantId, input.recipientId);
  if (!recipient || recipient.campaignId !== campaign.id) {
    throw new PersistenceError("not_found", "Campaign recipient not found.");
  }

  if (recipient.draftStatus !== "APPROVED") {
    throw new PersistenceError("invalid_transition", "Message is not approved.");
  }

  if (!recipient.approvalContentHash) {
    throw new PersistenceError("invalid_transition", "Approval hash is missing.");
  }

  if (buildApprovalContentHash(recipient) !== recipient.approvalContentHash) {
    throw new PersistenceError("invalid_transition", "Approved content changed since approval.");
  }

  if (recipient.sentAt || recipient.sendIdempotencyKey) {
    return {
      alreadyProcessed: true,
      delivery: {
        mode: "simulation",
        providerMessageId: recipient.sendIdempotencyKey ?? undefined,
        providerStatus: "sent"
      },
      idempotencyKey: recipient.sendIdempotencyKey ?? buildOutreachDeliveryIdempotencyKey({
        tenantId: input.tenantId,
        messageId: recipient.id,
        messageVersion: recipient.approvalContentHash
      })
    };
  }

  const messageVersion = recipient.approvalContentHash;
  const idempotencyKey = buildOutreachDeliveryIdempotencyKey({
    tenantId: input.tenantId,
    messageId: recipient.id,
    messageVersion
  });

  const requestFingerprint = buildOutreachRequestFingerprint({
    tenantId: input.tenantId,
    messageVersion,
    recipientEmail: recipient.snapshotEmail,
    approvedSubject: recipient.personalizedSubject,
    approvedPlainText: recipient.personalizedPlainText,
    approvedHtml: recipient.personalizedHtml || undefined,
    provider: "simulation"
  });

  if (hasAtomicClaim(repos)) {
    return sendWithAtomicClaim(repos, input, recipient, campaign.id, messageVersion, idempotencyKey, requestFingerprint);
  }

  return sendWithLegacyClaim(repos, input, recipient, campaign, messageVersion, idempotencyKey);
}

async function sendWithAtomicClaim(
  repos: LocalRepositoryBundle & {
    outreachSendAttempts: {
      claim: NonNullable<LocalRepositoryBundle["outreachSendAttempts"]["claim"]>;
      complete: NonNullable<LocalRepositoryBundle["outreachSendAttempts"]["complete"]>;
    };
  },
  input: MessageSendInput,
  recipient: Awaited<ReturnType<LocalRepositoryBundle["campaignRecipients"]["getById"]>> & object,
  campaignId: string,
  messageVersion: string,
  idempotencyKey: string,
  requestFingerprint: string
): Promise<MessageSendResult> {
  const claim = await repos.outreachSendAttempts.claim({
    tenantId: input.tenantId,
    campaignId,
    recipientId: recipient.id,
    leadId: recipient.leadId,
    messageVersion,
    idempotencyKey,
    requestFingerprint,
    initiatedBy: input.actorId,
    destinationEmail: recipient.snapshotEmail
  });

  if (claim.result === "blocked" || claim.result === "conflict" || claim.result === "forbidden") {
    throw new PersistenceError("invalid_transition", claim.reason);
  }

  if (claim.result === "not_found") {
    throw new PersistenceError("not_found", claim.reason);
  }

  if (claim.result === "already_processed") {
    return {
      alreadyProcessed: true,
      delivery: {
        mode: "simulation",
        providerMessageId: claim.providerMessageId ?? undefined,
        providerStatus: "sent"
      },
      idempotencyKey: claim.idempotencyKey
    };
  }

  if (claim.result !== "claimed") {
    throw new PersistenceError("invalid_transition", claim.reason);
  }

  const deliveryRequest = {
    tenantId: input.tenantId,
    messageId: recipient.id,
    leadId: recipient.leadId,
    campaignId,
    recipientEmail: recipient.snapshotEmail,
    recipientName: recipient.snapshotContactName,
    companyName: recipient.snapshotCompanyName,
    approvedSubject: recipient.personalizedSubject,
    approvedPlainText: recipient.personalizedPlainText,
    approvedHtml: recipient.personalizedHtml || undefined,
    messageVersion,
    idempotencyKey
  };

  const delivery = await deliverApprovedOutreachMessage(deliveryRequest);

  if (delivery.providerStatus !== "sent") {
    await repos.outreachSendAttempts.complete({
      tenantId: input.tenantId,
      attemptId: claim.attemptId,
      status: "TEST_BLOCKED",
      providerMessageId: null,
      errorCode: "provider_rejected",
      errorMessage: delivery.error ?? "Delivery blocked.",
      recipientId: recipient.id,
      sentBy: input.actorId,
      idempotencyKey
    });
    throw new PersistenceError("invalid_transition", delivery.error ?? "Delivery blocked.");
  }

  await repos.outreachSendAttempts.complete({
    tenantId: input.tenantId,
    attemptId: claim.attemptId,
    status: "TEST_SENT",
    providerMessageId: delivery.providerMessageId ?? null,
    errorCode: null,
    errorMessage: null,
    recipientId: recipient.id,
    sentBy: input.actorId,
    idempotencyKey
  });

  await repos.activities.append(input.tenantId, {
    action: "campaign_draft_sent_simulated",
    entityId: campaignId,
    entityType: "campaign",
    metadata: {
      campaignRecipientId: recipient.id,
      idempotencyKey,
      mode: delivery.mode
    },
    title: `Simulated delivery: ${recipient.snapshotCompanyName}`
  });

  return { alreadyProcessed: false, delivery, idempotencyKey };
}

async function sendWithLegacyClaim(
  repos: LocalRepositoryBundle,
  input: MessageSendInput,
  recipient: NonNullable<Awaited<ReturnType<LocalRepositoryBundle["campaignRecipients"]["getById"]>>>,
  campaign: NonNullable<Awaited<ReturnType<LocalRepositoryBundle["campaigns"]["getById"]>>>,
  messageVersion: string,
  idempotencyKey: string
): Promise<MessageSendResult> {
  const existing = await repos.outreachSendAttempts.getByIdempotencyKey(input.tenantId, idempotencyKey);
  if (existing?.status === "TEST_SENT" || existing?.status === "TEST_ALREADY_PROCESSED") {
    return {
      alreadyProcessed: true,
      delivery: {
        mode: "simulation",
        providerMessageId: existing.providerMessageId ?? undefined,
        providerStatus: "sent"
      },
      idempotencyKey
    };
  }

  const deliveryRequest = {
    tenantId: input.tenantId,
    messageId: recipient.id,
    leadId: recipient.leadId,
    campaignId: campaign.id,
    recipientEmail: recipient.snapshotEmail,
    recipientName: recipient.snapshotContactName,
    companyName: recipient.snapshotCompanyName,
    approvedSubject: recipient.personalizedSubject,
    approvedPlainText: recipient.personalizedPlainText,
    approvedHtml: recipient.personalizedHtml || undefined,
    messageVersion,
    idempotencyKey
  };

  const startedAt = nowIso();
  const delivery = await deliverApprovedOutreachMessage(deliveryRequest);

  if (delivery.providerStatus !== "sent") {
    await repos.outreachSendAttempts.create({
      actualDestinationEmail: recipient.snapshotEmail,
      approvedContentHash: messageVersion,
      campaignId: campaign.id,
      campaignRecipientId: recipient.id,
      completedAt: nowIso(),
      deliveryMode: "simulation",
      idempotencyKey,
      initiatedBy: input.actorId,
      leadId: recipient.leadId,
      provider: "simulation",
      providerMessageId: null,
      retryable: false,
      sanitizedErrorCode: "provider_rejected",
      sanitizedErrorMessage: delivery.error ?? "Delivery blocked.",
      startedAt,
      status: "TEST_BLOCKED",
      tenantId: input.tenantId
    });
    throw new PersistenceError("invalid_transition", delivery.error ?? "Delivery blocked.");
  }

  const completedAt = nowIso();
  await repos.outreachSendAttempts.create({
    actualDestinationEmail: recipient.snapshotEmail,
    approvedContentHash: messageVersion,
    campaignId: campaign.id,
    campaignRecipientId: recipient.id,
    completedAt,
    deliveryMode: "simulation",
    idempotencyKey,
    initiatedBy: input.actorId,
    leadId: recipient.leadId,
    provider: "simulation",
    providerMessageId: delivery.providerMessageId ?? null,
    retryable: false,
    sanitizedErrorCode: null,
    sanitizedErrorMessage: null,
    startedAt,
    status: mapAttemptStatus(delivery.providerStatus),
    tenantId: input.tenantId
  });

  await repos.campaignRecipients.updateDraft(input.tenantId, recipient.id, {
    draftStatus: "DELIVERED",
    sentAt: completedAt,
    sentBy: input.actorId,
    sendIdempotencyKey: idempotencyKey
  });

  await repos.activities.append(input.tenantId, {
    action: "campaign_draft_sent_simulated",
    entityId: campaign.id,
    entityType: "campaign",
    metadata: {
      campaignRecipientId: recipient.id,
      idempotencyKey,
      mode: delivery.mode
    },
    title: `Simulated delivery: ${recipient.snapshotCompanyName}`
  });

  return { alreadyProcessed: false, delivery, idempotencyKey };
}
