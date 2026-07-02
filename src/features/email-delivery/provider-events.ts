import { createHash } from "node:crypto";
import { createEmailSuppression } from "@/application/suppression-service";
import type { CampaignDraftStatus } from "@/domain/campaign-types";
import type {
  ProviderEventEffect,
  ProviderEventType
} from "@/domain/email-delivery-types";
import { normalizeEmail } from "@/features/leadops/import-normalization";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

export type BrevoWebhookPayload = {
  event?: unknown;
  email?: unknown;
  id?: unknown;
  "message-id"?: unknown;
  messageId?: unknown;
  ts_event?: unknown;
  ts_epoch?: unknown;
  ts?: unknown;
  date?: unknown;
  subject?: unknown;
  tag?: unknown;
  tags?: unknown;
  reason?: unknown;
};

export type NormalizedProviderEvent = {
  provider: "brevo";
  providerEventId: string | null;
  eventFingerprint: string;
  providerMessageId: string | null;
  eventType: ProviderEventType;
  occurredAt: string;
  normalizedEmail: string | null;
  sanitizedMetadata: Record<string, string | number | boolean | null>;
};

const TERMINAL_STATUSES: CampaignDraftStatus[] = [
  "COMPLAINED",
  "UNSUBSCRIBED",
  "HARD_BOUNCED",
  "SUPPRESSED",
  "SENT_MANUALLY"
];

const EVENT_STATUS: Partial<Record<ProviderEventType, CampaignDraftStatus>> = {
  delivered: "DELIVERED",
  soft_bounce: "SOFT_BOUNCED",
  hard_bounce: "HARD_BOUNCED",
  complaint: "COMPLAINED",
  unsubscribe: "UNSUBSCRIBED",
  failed: "DELIVERY_FAILED",
  deferred: "DEFERRED",
  blocked: "DELIVERY_FAILED",
  invalid_email: "HARD_BOUNCED"
};

const EVENT_EFFECT: Partial<Record<ProviderEventType, ProviderEventEffect>> = {
  delivered: "marked_delivered",
  soft_bounce: "marked_soft_bounced",
  hard_bounce: "suppressed_hard_bounce",
  complaint: "suppressed_complaint",
  unsubscribe: "suppressed_unsubscribe",
  failed: "marked_failed",
  deferred: "marked_deferred",
  blocked: "marked_failed",
  invalid_email: "suppressed_hard_bounce"
};

export function normalizeBrevoWebhookPayload(payload: BrevoWebhookPayload): NormalizedProviderEvent | null {
  const eventType = mapBrevoEvent(readString(payload.event));
  const providerMessageId = readString(payload["message-id"]) ?? readString(payload.messageId);
  const providerEventId = readString(payload.id);
  const normalizedEmail = normalizeEmail(readString(payload.email) ?? "");
  const occurredAt = readTimestamp(payload);
  const sanitizedMetadata = sanitizeBrevoMetadata(payload);
  const eventFingerprint = buildProviderEventFingerprint({
    eventType,
    normalizedEmail: normalizedEmail || null,
    occurredAt,
    provider: "brevo",
    providerEventId,
    providerMessageId
  });

  if (!readString(payload.event)) return null;

  return {
    eventFingerprint,
    eventType,
    normalizedEmail: normalizedEmail || null,
    occurredAt,
    provider: "brevo",
    providerEventId,
    providerMessageId,
    sanitizedMetadata
  };
}

export async function reconcileProviderEvent(
  repos: LocalRepositoryBundle,
  tenantId: string,
  event: NormalizedProviderEvent
) {
  const duplicate = await repos.outreachProviderEvents.getByFingerprint(
    tenantId,
    event.eventFingerprint
  );
  if (duplicate) {
    return repos.outreachProviderEvents.create({
      ...event,
      campaignId: duplicate.campaignId,
      campaignRecipientId: duplicate.campaignRecipientId,
      duplicate: true,
      effect: "none",
      errorMessage: null,
      leadId: duplicate.leadId,
      processingStatus: "duplicate",
      receivedAt: new Date().toISOString(),
      sendAttemptId: duplicate.sendAttemptId,
      tenantId
    });
  }

  const attempts = await repos.outreachSendAttempts.listForTenant(tenantId);
  const attempt = event.providerMessageId
    ? attempts.find((row) => row.providerMessageId === event.providerMessageId)
    : null;

  if (!attempt) {
    return repos.outreachProviderEvents.create({
      ...event,
      campaignId: null,
      campaignRecipientId: null,
      duplicate: false,
      effect: "none",
      errorMessage: null,
      leadId: null,
      processingStatus: "unmatched",
      receivedAt: new Date().toISOString(),
      sendAttemptId: null,
      tenantId
    });
  }

  const recipient = await repos.campaignRecipients.getById(tenantId, attempt.campaignRecipientId);
  if (!recipient) {
    return repos.outreachProviderEvents.create({
      ...event,
      campaignId: attempt.campaignId,
      campaignRecipientId: attempt.campaignRecipientId,
      duplicate: false,
      effect: "none",
      errorMessage: "Campaign recipient not found.",
      leadId: attempt.leadId,
      processingStatus: "failed",
      receivedAt: new Date().toISOString(),
      sendAttemptId: attempt.id,
      tenantId
    });
  }

  const effect = EVENT_EFFECT[event.eventType] ?? "none";
  const status = EVENT_STATUS[event.eventType] ?? null;

  if (status && canApplyStatus(recipient.draftStatus, status)) {
    await repos.campaignRecipients.updateDraft(tenantId, recipient.id, {
      draftStatus: status
    });
  }

  if (event.eventType === "hard_bounce" || event.eventType === "invalid_email") {
    await createEmailSuppression(repos, tenantId, {
      campaignId: attempt.campaignId,
      createdBy: "provider-webhook",
      email: recipient.snapshotEmail,
      leadId: attempt.leadId,
      notes: "Created from Brevo hard-bounce or invalid-email event.",
      reason: "hard_bounce",
      source: "provider_webhook"
    });
  }
  if (event.eventType === "complaint") {
    await createEmailSuppression(repos, tenantId, {
      campaignId: attempt.campaignId,
      createdBy: "provider-webhook",
      email: recipient.snapshotEmail,
      leadId: attempt.leadId,
      notes: "Created from Brevo spam complaint event.",
      reason: "complaint",
      source: "provider_webhook"
    });
  }
  if (event.eventType === "unsubscribe") {
    await createEmailSuppression(repos, tenantId, {
      campaignId: attempt.campaignId,
      createdBy: "provider-webhook",
      email: recipient.snapshotEmail,
      leadId: attempt.leadId,
      notes: "Created from Brevo unsubscribe event.",
      reason: "unsubscribe",
      source: "provider_webhook"
    });
  }

  await repos.activities.append(tenantId, {
    action: "provider_event_reconciled",
    entityId: attempt.campaignId,
    entityType: "campaign",
    metadata: {
      campaignRecipientId: attempt.campaignRecipientId,
      eventType: event.eventType,
      provider: event.provider
    },
    title: `Provider event reconciled: ${event.eventType}`
  });

  return repos.outreachProviderEvents.create({
    ...event,
    campaignId: attempt.campaignId,
    campaignRecipientId: attempt.campaignRecipientId,
    duplicate: false,
    effect,
    errorMessage: null,
    leadId: attempt.leadId,
    processingStatus: event.eventType === "unknown" ? "ignored" : "processed",
    receivedAt: new Date().toISOString(),
    sendAttemptId: attempt.id,
    tenantId
  });
}

export function mapBrevoEvent(event: string | null): ProviderEventType {
  const normalized = event?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (normalized) {
    case "sent":
    case "request":
      return "sent";
    case "delivered":
      return "delivered";
    case "soft_bounce":
    case "softbounced":
      return "soft_bounce";
    case "hard_bounce":
    case "hardbounced":
      return "hard_bounce";
    case "spam":
    case "complaint":
      return "complaint";
    case "unsubscribed":
    case "unsubscribe":
      return "unsubscribe";
    case "deferred":
      return "deferred";
    case "blocked":
      return "blocked";
    case "invalid_email":
    case "invalid":
      return "invalid_email";
    case "error":
      return "failed";
    case "opened":
    case "uniqueopened":
    case "first_opening":
    case "proxy_open":
    case "unique_proxy_open":
      return "opened";
    case "click":
    case "clicked":
      return "clicked";
    default:
      return "unknown";
  }
}

export function buildProviderEventFingerprint(input: {
  provider: string;
  providerEventId: string | null;
  providerMessageId: string | null;
  eventType: ProviderEventType;
  normalizedEmail: string | null;
  occurredAt: string;
}): string {
  return createHash("sha256")
    .update(
      [
        input.provider,
        input.providerEventId ?? "",
        input.providerMessageId ?? "",
        input.eventType,
        input.normalizedEmail ?? "",
        input.occurredAt
      ].join("|")
    )
    .digest("hex");
}

function canApplyStatus(current: CampaignDraftStatus, next: CampaignDraftStatus): boolean {
  if (TERMINAL_STATUSES.includes(current) && !TERMINAL_STATUSES.includes(next)) return false;
  if ((current === "COMPLAINED" || current === "UNSUBSCRIBED") && next === "HARD_BOUNCED") return false;
  if (current === "HARD_BOUNCED" && next === "DELIVERED") return false;
  return true;
}

function sanitizeBrevoMetadata(payload: BrevoWebhookPayload): Record<string, string | number | boolean | null> {
  return {
    event: readString(payload.event),
    id: readString(payload.id),
    messageId: readString(payload["message-id"]) ?? readString(payload.messageId),
    reason: readString(payload.reason),
    subjectPresent: Boolean(readString(payload.subject)),
    tag: readString(payload.tag),
    ts: readNumber(payload.ts),
    tsEpoch: readNumber(payload.ts_epoch),
    tsEvent: readNumber(payload.ts_event)
  };
}

function readTimestamp(payload: BrevoWebhookPayload): string {
  const epochMs = readNumber(payload.ts_epoch);
  if (epochMs) return new Date(epochMs).toISOString();
  const epochSeconds = readNumber(payload.ts_event) ?? readNumber(payload.ts);
  if (epochSeconds) return new Date(epochSeconds * 1000).toISOString();
  const date = readString(payload.date);
  if (date) {
    const parsed = Date.parse(date);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
