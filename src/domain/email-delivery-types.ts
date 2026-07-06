export type EmailDeliveryProviderKey = "simulation" | "brevo";

export type EmailDeliveryMode = "simulation" | "provider_test" | "delivery_self_test";

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
  emailDeliveryProvider: string;
  outreachDeliveryProvider: string;
  configured: boolean;
  realSendEnabled: boolean;
  testSendEnabled: boolean;
  sandboxMode: boolean;
  apiKeyPresent: boolean;
  brevoApiKeyRedacted: string | null;
  senderEmail: string | null;
  senderName: string | null;
  senderEmailConfigured: boolean;
  senderNameConfigured: boolean;
  replyToConfigured: boolean;
  allowlistConfigured: boolean;
  allowlistCount: number;
  configuredTestRecipientEmail: string | null;
  publicBaseUrlConfigured: boolean;
  unsubscribeSecretConfigured: boolean;
  webhookSecretConfigured: boolean;
  gmailConfigured: boolean;
  outlookConfigured: boolean;
  runtimeStartupMode: string;
  demoStartForcedSimulation: boolean;
  missing: string[];
  warnings: string[];
};

export type EmailDeliverySelfTestInput = {
  recipientEmail: string;
  subject: string;
  messageBody: string;
  confirmation: string;
  initiatedBy?: string;
};

export type EmailDeliverySelfTestResult = EmailDeliveryResponse & {
  idempotencyKey: string;
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
  unsubscribeUrl?: string;
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

export type ProviderEventType =
  | "sent"
  | "delivered"
  | "soft_bounce"
  | "hard_bounce"
  | "complaint"
  | "unsubscribe"
  | "failed"
  | "deferred"
  | "blocked"
  | "invalid_email"
  | "opened"
  | "clicked"
  | "unknown";

export type ProviderEventProcessingStatus =
  | "processed"
  | "duplicate"
  | "ignored"
  | "unmatched"
  | "failed";

export type ProviderEventEffect =
  | "none"
  | "marked_delivered"
  | "marked_soft_bounced"
  | "suppressed_hard_bounce"
  | "suppressed_complaint"
  | "suppressed_unsubscribe"
  | "marked_failed"
  | "marked_deferred";

export type OutreachProviderEvent = {
  id: string;
  tenantId: string;
  provider: EmailDeliveryProviderKey;
  providerEventId: string | null;
  eventFingerprint: string;
  providerMessageId: string | null;
  eventType: ProviderEventType;
  occurredAt: string;
  receivedAt: string;
  campaignId: string | null;
  campaignRecipientId: string | null;
  leadId: string | null;
  sendAttemptId: string | null;
  normalizedEmail: string | null;
  sanitizedMetadata: Record<string, string | number | boolean | null>;
  processingStatus: ProviderEventProcessingStatus;
  effect: ProviderEventEffect;
  duplicate: boolean;
  errorMessage: string | null;
};

export type CreateOutreachProviderEventInput = Omit<OutreachProviderEvent, "id">;

export type PublicUnsubscribeTokenVersion = 1;

export type PublicUnsubscribeTokenClaims = {
  version: PublicUnsubscribeTokenVersion;
  tenantId: string;
  campaignId: string;
  campaignRecipientId: string;
  leadId: string;
  emailHash: string;
  issuedAt: number;
  expiresAt: number | null;
};

export type PublicUnsubscribeResult =
  | "confirmed"
  | "already_unsubscribed"
  | "invalid_token"
  | "durable_store_unavailable";
