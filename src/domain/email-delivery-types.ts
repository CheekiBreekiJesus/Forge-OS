export type EmailDeliveryProviderKey = "simulation" | "brevo";

export type EmailDeliveryMode = "simulation" | "provider_test";

export type EmailDeliveryStatus =
  | "accepted"
  | "blocked"
  | "failed"
  | "already_processed";

export type EmailDeliveryErrorCode =
  | "configuration_missing"
  | "real_send_disabled"
  | "test_send_disabled"
  | "recipient_not_allowed"
  | "invalid_request"
  | "unauthorized"
  | "forbidden"
  | "not_enough_credits"
  | "rate_limited"
  | "timeout"
  | "provider_rejected"
  | "provider_unavailable"
  | "network_error"
  | "already_processed";

export type EmailProviderDiagnostic = {
  provider: EmailDeliveryProviderKey;
  configured: boolean;
  realSendEnabled: boolean;
  testSendEnabled: boolean;
  sandboxMode: boolean;
  apiKeyPresent: boolean;
  senderEmailConfigured: boolean;
  senderNameConfigured: boolean;
  replyToConfigured: boolean;
  allowlistConfigured: boolean;
  allowlistCount: number;
  missing: string[];
  warnings: string[];
};

export type EmailDeliveryRequest = {
  tenantId: string;
  campaignId: string;
  campaignRecipientId: string;
  leadId: string;
  approvedContentHash: string;
  idempotencyKey: string;
  toEmail: string;
  toName: string;
  subject: string;
  plainText: string;
  html?: string;
  initiatedBy: string;
  mode: EmailDeliveryMode;
};

export type EmailDeliveryResponse = {
  provider: EmailDeliveryProviderKey;
  mode: EmailDeliveryMode;
  status: EmailDeliveryStatus;
  providerMessageId: string | null;
  retryable: boolean;
  errorCode: EmailDeliveryErrorCode | null;
  errorMessage: string | null;
};

export type OutreachSendAttemptStatus =
  | "TEST_SENT"
  | "TEST_FAILED"
  | "TEST_BLOCKED"
  | "TEST_ALREADY_PROCESSED";

export type OutreachSendAttempt = {
  id: string;
  tenantId: string;
  provider: EmailDeliveryProviderKey;
  deliveryMode: EmailDeliveryMode;
  campaignId: string;
  campaignRecipientId: string;
  leadId: string;
  approvedContentHash: string;
  actualDestinationEmail: string;
  idempotencyKey: string;
  status: OutreachSendAttemptStatus;
  startedAt: string;
  completedAt: string;
  providerMessageId: string | null;
  retryable: boolean;
  sanitizedErrorCode: EmailDeliveryErrorCode | null;
  sanitizedErrorMessage: string | null;
  initiatedBy: string;
};

export type CreateOutreachSendAttemptInput = Omit<OutreachSendAttempt, "id">;
