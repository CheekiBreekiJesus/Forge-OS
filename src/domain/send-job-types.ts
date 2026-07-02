import type {
  EmailDeliveryErrorCode,
  EmailDeliveryProviderKey,
  EmailDeliveryResponse
} from "@/domain/email-delivery-types";

export type OutreachSendJobDeliveryMode = "simulation" | "brevo";

export type OutreachSendJobStatus =
  | "DRAFT"
  | "READY"
  | "QUEUED"
  | "PROCESSING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type OutreachSendJobRecipientStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "RETRY_PENDING"
  | "FAILED"
  | "SKIPPED"
  | "SUPPRESSED"
  | "CANCELLED";

export type OutreachSendJobAttemptStatus =
  | "ACCEPTED"
  | "FAILED"
  | "BLOCKED"
  | "ALREADY_PROCESSED";

export type OutreachSendJob = {
  id: string;
  tenantId: string;
  campaignId: string;
  provider: EmailDeliveryProviderKey;
  deliveryMode: OutreachSendJobDeliveryMode;
  status: OutreachSendJobStatus;
  batchSize: number;
  delayMs: number;
  dailyLimit: number;
  maxRetries: number;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
  queuedAt: string | null;
  startedAt: string | null;
  pausedAt: string | null;
  pausedBy: string | null;
  pauseReason: string | null;
  resumedAt: string | null;
  resumedBy: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  lastProcessedAt: string | null;
  processedCount: number;
  sentCount: number;
  failedCount: number;
  retryPendingCount: number;
  skippedCount: number;
  remainingCount: number;
  lockOwner: string | null;
  lockAcquiredAt: string | null;
  lockExpiresAt: string | null;
  lastStopReason: string | null;
  version: number;
};

export type OutreachSendJobRecipient = {
  id: string;
  tenantId: string;
  sendJobId: string;
  campaignId: string;
  campaignRecipientId: string;
  contactId: string | null;
  leadId: string;
  normalizedEmail: string;
  approvedContentVersion: string;
  status: OutreachSendJobRecipientStatus;
  attemptCount: number;
  nextAttemptAt: string | null;
  idempotencyKey: string;
  providerMessageId: string | null;
  lastErrorCode: EmailDeliveryErrorCode | null;
  lastErrorMessage: string | null;
  queuedAt: string;
  processingStartedAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OutreachSendJobAttempt = {
  id: string;
  tenantId: string;
  sendJobId: string;
  sendJobRecipientId: string;
  campaignId: string;
  campaignRecipientId: string;
  leadId: string;
  attemptNumber: number;
  provider: EmailDeliveryProviderKey;
  deliveryMode: OutreachSendJobDeliveryMode;
  idempotencyKey: string;
  startedAt: string;
  completedAt: string;
  status: OutreachSendJobAttemptStatus;
  providerMessageId: string | null;
  retryable: boolean;
  sanitizedErrorCode: EmailDeliveryErrorCode | null;
  sanitizedErrorMessage: string | null;
  providerCategory: string;
};

export type OutreachSendJobDailyUsage = {
  id: string;
  tenantId: string;
  usageDate: string;
  provider: EmailDeliveryProviderKey;
  realSendCount: number;
  updatedAt: string;
};

export type CreateOutreachSendJobInput = Omit<
  OutreachSendJob,
  "id" | "processedCount" | "sentCount" | "failedCount" | "retryPendingCount" | "skippedCount" | "remainingCount" | "lockOwner" | "lockAcquiredAt" | "lockExpiresAt" | "version"
> & {
  remainingCount: number;
};

export type CreateOutreachSendJobRecipientInput = Omit<OutreachSendJobRecipient, "id">;

export type CreateOutreachSendJobAttemptInput = Omit<OutreachSendJobAttempt, "id">;

export type SendJobExclusionReason =
  | "campaign_not_approved"
  | "recipient_not_included"
  | "recipient_not_approved"
  | "missing_email"
  | "invalid_email"
  | "suppressed"
  | "approval_stale"
  | "already_sent"
  | "duplicate_email"
  | "provider_not_ready"
  | "unsubscribe_not_ready"
  | "campaign_terminal";

export type SendJobEligibilityRow = {
  campaignRecipientId: string;
  leadId: string;
  email: string;
  reason: SendJobExclusionReason;
};

export type SendJobEligibleRecipient = {
  campaignRecipientId: string;
  leadId: string;
  contactId: string | null;
  normalizedEmail: string;
  approvedContentVersion: string;
  idempotencyKey: string;
};

export type SendJobEligibilityResult = {
  canQueue: boolean;
  campaignId: string;
  provider: EmailDeliveryProviderKey;
  deliveryMode: OutreachSendJobDeliveryMode;
  totalSnapshotRecipients: number;
  approvedRecipients: number;
  eligibleRecipients: SendJobEligibleRecipient[];
  excludedRecipients: SendJobEligibilityRow[];
  suppressedRecipients: SendJobEligibilityRow[];
  invalidRecipients: SendJobEligibilityRow[];
  staleApprovalRecipients: SendJobEligibilityRow[];
  alreadySentRecipients: SendJobEligibilityRow[];
  duplicateRecipients: SendJobEligibilityRow[];
  otherExcludedRecipients: SendJobEligibilityRow[];
  providerReady: boolean;
  unsubscribeReady: boolean;
  senderReady: boolean;
  reasons: SendJobExclusionReason[];
};

export type QueueSendJobInput = {
  tenantId: string;
  campaignId: string;
  provider?: EmailDeliveryProviderKey;
  deliveryMode?: OutreachSendJobDeliveryMode;
  batchSize?: number;
  delayMs?: number;
  dailyLimit?: number;
  maxRetries?: number;
  actorId?: string;
  confirmation: "QUEUE SIMULATION" | "QUEUE BREVO";
};

export type ProcessBatchInput = {
  tenantId: string;
  sendJobId: string;
  actorId?: string;
  lockTtlMs?: number;
};

export type ProcessBatchResult = {
  job: OutreachSendJob;
  processed: number;
  sent: number;
  failed: number;
  retryPending: number;
  suppressed: number;
  skipped: number;
  stopReason:
    | "processed_batch"
    | "paused"
    | "cancelled"
    | "completed"
    | "daily_limit_reached"
    | "provider_invalid"
    | "lock_busy"
    | "nothing_to_process";
};

export type SendJobDeliveryProvider = {
  diagnostic(): { configured: boolean; realSendEnabled: boolean };
  send(request: import("@/domain/email-delivery-types").EmailDeliveryRequest): Promise<EmailDeliveryResponse>;
};
