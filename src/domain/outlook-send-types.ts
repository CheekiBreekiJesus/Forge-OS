export type OutlookDurableSendAttemptStatus =
  | "queued"
  | "submitting"
  | "accepted"
  | "permanent_failure"
  | "temporary_failure"
  | "throttled"
  | "reconnect_required"
  | "uncertain"
  | "cancelled";

export const OUTLOOK_DURABLE_PROVIDER = "outlook" as const;

export type OutlookDurableSendAttempt = {
  id: string;
  tenantId: string;
  campaignId: string;
  campaignRecipientId: string;
  approvedDraftVersion: string;
  provider: typeof OUTLOOK_DURABLE_PROVIDER;
  idempotencyKey: string;
  status: OutlookDurableSendAttemptStatus;
  createdAt: string;
  submittingAt: string | null;
  acceptedAt: string | null;
  failedAt: string | null;
  uncertainAt: string | null;
  cancelledAt: string | null;
  httpStatus: number | null;
  providerMessageId: string | null;
  retryable: boolean;
  sanitizedErrorCode: string | null;
  sanitizedErrorMessage: string | null;
  initiatedBy: string;
};

export type CreateOutlookDurableSendAttemptInput = Omit<OutlookDurableSendAttempt, "id">;

export const OUTLOOK_SUBMITTING_STALE_THRESHOLD_MS = 5 * 60 * 1000;

export const OUTLOOK_TEST_SEND_CONFIRMATION = "SEND OUTLOOK TEST" as const;
export const OUTLOOK_ORGANIC_SESSION_CONFIRMATION = "START OUTLOOK ORGANIC SESSION" as const;
