import {
  buildApprovalContentHash,
  evaluateRecipientApproval
} from "@/application/campaign-approval-service";
import { loadSenderContext } from "@/application/campaign-sender-context";
import { isEmailSuppressed } from "@/application/suppression-service";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";
import { isValidEmailSyntax } from "@/features/leadops/import-normalization";
import { loadCachedTokens } from "@/features/outlook-graph/token-service";
import type { OutlookGraphConfig } from "@/features/outlook-graph/config";
import type { OutlookApprovedSendPayload } from "@/features/outlook-graph/types";
import {
  buildOutlookDurableIdempotencyKey,
  type OutlookDurableSendAttemptStore
} from "@/features/outlook-graph/durable-send-attempt-store";
import {
  isBlockingOutlookAttemptStatus,
  isStaleSubmittingAttempt
} from "@/features/outlook-graph/durable-send-attempt-store";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export type CanonicalOutlookSendContext = {
  campaign: OutreachCampaign;
  recipient: CampaignRecipient;
  approvedDraftVersion: string;
  senderSnapshot: Record<string, string | null>;
  recipientEmail: string;
  subject: string;
  renderedBody: string;
  bodyContentType: "HTML" | "Text";
  locale: string;
  idempotencyKey: string;
  connectedMailbox: string | null;
  expectedSenderMailbox: string;
};

export type MailboxMismatchDetails = {
  connectedMailbox: string;
  expectedSenderMailbox: string;
};

export class OutlookCanonicalSendError extends Error {
  constructor(
    public readonly code:
      | "not_found"
      | "invalid_transition"
      | "mailbox_mismatch"
      | "recipient_not_allowed"
      | "already_sent"
      | "duplicate_blocked",
    message: string,
    public readonly details?: MailboxMismatchDetails
  ) {
    super(message);
    this.name = "OutlookCanonicalSendError";
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function unresolvedPattern(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text);
}

export function buildSenderSnapshotFromContext(
  sender: Awaited<ReturnType<typeof loadSenderContext>>
): Record<string, string | null> {
  return {
    displayName: sender.sender.displayName || null,
    fromEmail: sender.sender.fromEmail || null,
    replyToEmail: sender.sender.replyToEmail || null,
    phone: sender.sender.phone || null,
    companyName: sender.company.tradingName || sender.company.legalName || null
  };
}

export async function loadCanonicalOutlookSendContext(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  recipientId: string,
  options: {
    requireTestRecipientAllowlist?: boolean;
    testRecipientAllowlist?: string[];
    outlookConfig: OutlookGraphConfig;
    attemptStore: OutlookDurableSendAttemptStore;
    clientApprovedDraftVersion?: string;
  }
): Promise<CanonicalOutlookSendContext> {
  const campaign = await repos.campaigns.getById(tenantId, campaignId);
  if (!campaign) {
    throw new OutlookCanonicalSendError("not_found", "Campaign not found.");
  }

  const recipient = await repos.campaignRecipients.getById(tenantId, recipientId);
  if (!recipient || recipient.campaignId !== campaign.id) {
    throw new OutlookCanonicalSendError("not_found", "Campaign recipient not found.");
  }

  if (recipient.draftStatus !== "APPROVED") {
    throw new OutlookCanonicalSendError("invalid_transition", "Recipient draft must be approved.");
  }
  if (!recipient.approvalContentHash) {
    throw new OutlookCanonicalSendError("invalid_transition", "Recipient approval hash is missing.");
  }
  const approvedDraftVersion = recipient.approvalContentHash;
  if (buildApprovalContentHash(recipient) !== approvedDraftVersion) {
    throw new OutlookCanonicalSendError("invalid_transition", "Approved content changed since approval.");
  }
  if (
    options.clientApprovedDraftVersion &&
    options.clientApprovedDraftVersion !== approvedDraftVersion
  ) {
    throw new OutlookCanonicalSendError("invalid_transition", "Stale approval version rejected.");
  }

  const approval = await evaluateRecipientApproval(repos, tenantId, campaign, recipient);
  if (!approval.canApprove) {
    if (approval.reasons.includes("suppressed")) {
      throw new OutlookCanonicalSendError("invalid_transition", "Recipient is suppressed.");
    }
    if (approval.reasons.includes("demo_sender_values")) {
      throw new OutlookCanonicalSendError("invalid_transition", "Demo sender values are not allowed.");
    }
    if (approval.reasons.includes("unresolved_variables")) {
      throw new OutlookCanonicalSendError("invalid_transition", "Unresolved placeholders remain in draft.");
    }
    if (approval.reasons.includes("already_sent")) {
      throw new OutlookCanonicalSendError("already_sent", "Recipient was already sent.");
    }
    throw new OutlookCanonicalSendError(
      "invalid_transition",
      `Recipient is not sendable: ${approval.reasons.join(", ")}`
    );
  }

  if (
    unresolvedPattern(recipient.personalizedSubject) ||
    unresolvedPattern(recipient.personalizedPlainText)
  ) {
    throw new OutlookCanonicalSendError("invalid_transition", "Unresolved placeholders remain in draft.");
  }

  const recipientEmail = normalizeEmail(recipient.snapshotEmail);
  if (!isValidEmailSyntax(recipientEmail)) {
    throw new OutlookCanonicalSendError("invalid_transition", "Recipient email is invalid.");
  }

  if (options.requireTestRecipientAllowlist) {
    const allowlist = options.testRecipientAllowlist ?? [];
    if (!allowlist.includes(recipientEmail)) {
      throw new OutlookCanonicalSendError(
        "recipient_not_allowed",
        "Recipient is not in the Outlook test allowlist."
      );
    }
  }

  const suppressed = await isEmailSuppressed(repos, tenantId, recipientEmail);
  if (suppressed) {
    throw new OutlookCanonicalSendError("invalid_transition", "Recipient is suppressed.");
  }

  if (recipient.sentAt) {
    throw new OutlookCanonicalSendError("already_sent", "Recipient was already sent.");
  }

  const idempotencyKey = buildOutlookDurableIdempotencyKey(
    campaign.id,
    recipient.id,
    approvedDraftVersion
  );
  const existingAttempt = await options.attemptStore.getByIdempotencyKey(tenantId, idempotencyKey);
  if (existingAttempt) {
    if (existingAttempt.status === "submitting" && isStaleSubmittingAttempt(existingAttempt)) {
      // recovery will mark uncertain; still block here until recovery runs
    }
    if (isBlockingOutlookAttemptStatus(existingAttempt.status)) {
      throw new OutlookCanonicalSendError(
        "duplicate_blocked",
        `Send blocked by durable attempt status: ${existingAttempt.status}.`
      );
    }
  }

  const senderContext = await loadSenderContext(repos, tenantId, campaign);
  if (!senderContext.ready) {
    throw new OutlookCanonicalSendError("invalid_transition", "Sender snapshot is incomplete.");
  }

  const expectedSenderMailbox = normalizeEmail(
    senderContext.sender.fromEmail || senderContext.sender.replyToEmail
  );
  if (!expectedSenderMailbox) {
    throw new OutlookCanonicalSendError("invalid_transition", "Sender mailbox is missing.");
  }

  const cachedTokens = await loadCachedTokens(options.outlookConfig);
  const connectedMailbox = normalizeEmail(
    cachedTokens?.mailboxAddress ?? ""
  );
  if (!connectedMailbox) {
    throw new OutlookCanonicalSendError("invalid_transition", "Outlook mailbox is not connected.");
  }
  if (connectedMailbox !== expectedSenderMailbox) {
    throw new OutlookCanonicalSendError("mailbox_mismatch", "Connected mailbox does not match sender.", {
      connectedMailbox,
      expectedSenderMailbox
    });
  }

  const subject = recipient.personalizedSubject;
  const renderedBody = recipient.personalizedHtml?.trim()
    ? recipient.personalizedHtml
    : recipient.personalizedPlainText;
  const bodyContentType: "HTML" | "Text" = recipient.personalizedHtml?.trim() ? "HTML" : "Text";

  return {
    approvedDraftVersion,
    bodyContentType,
    campaign,
    connectedMailbox,
    expectedSenderMailbox,
    idempotencyKey,
    locale: campaign.language || "pt-PT",
    recipient,
    recipientEmail,
    renderedBody,
    senderSnapshot: buildSenderSnapshotFromContext(senderContext),
    subject
  };
}

export function toOutlookApprovedPayload(
  attemptId: string,
  context: CanonicalOutlookSendContext
): OutlookApprovedSendPayload {
  return {
    attemptId,
    approvedDraftVersion: context.approvedDraftVersion,
    bodyContentType: context.bodyContentType,
    campaignId: context.campaign.id,
    locale: context.locale,
    recipientEmail: context.recipientEmail,
    recipientId: context.recipient.id,
    renderedBody: context.renderedBody,
    senderSnapshot: context.senderSnapshot,
    subject: context.subject
  };
}

export function mapPersistenceError(error: unknown): never {
  if (error instanceof OutlookCanonicalSendError) throw error;
  if (error instanceof PersistenceError) {
    throw new OutlookCanonicalSendError("invalid_transition", error.message);
  }
  throw error;
}
