import { describe, expect, it, vi } from "vitest";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { OutreachSendJob, OutreachSendJobRecipient } from "@/domain/send-job-types";
import { buildServerCampaignDeliveryRequest } from "./build-campaign-delivery-request";

const job: OutreachSendJob = {
  approvedBy: "operator",
  batchSize: 5,
  campaignId: "campaign_001",
  cancelledAt: null,
  cancelledBy: null,
  cancelReason: null,
  completedAt: null,
  createdAt: "2026-07-09T00:00:00.000Z",
  createdBy: "operator",
  dailyLimit: 25,
  delayMs: 0,
  deliveryMode: "brevo",
  failedCount: 0,
  id: "job_001",
  lastProcessedAt: null,
  lastStopReason: null,
  lockAcquiredAt: null,
  lockExpiresAt: null,
  lockOwner: null,
  maxRetries: 2,
  pausedAt: null,
  pausedBy: null,
  pauseReason: null,
  processedCount: 0,
  provider: "brevo",
  queuedAt: "2026-07-09T00:00:00.000Z",
  remainingCount: 1,
  resumedAt: null,
  resumedBy: null,
  retryPendingCount: 0,
  sentCount: 0,
  skippedCount: 0,
  startedAt: null,
  status: "QUEUED",
  tenantId: "tenant_jh_gomes",
  version: 1
};

const recipient = {
  approvalContentHash: "hash_123",
  campaignId: "campaign_001",
  contactId: "contact_001",
  createdAt: "2026-07-09T00:00:00.000Z",
  draftStatus: "APPROVED",
  id: "recipient_001",
  leadId: "lead_001",
  personalizedHtml: "<p>Hello</p>",
  personalizedPlainText: "Hello",
  personalizedSubject: "Subject",
  recipientDeliveryMode: "manual_external",
  sendIdempotencyKey: null,
  sentAt: null,
  snapshotCompanyName: "Acme",
  snapshotContactName: "Alex",
  snapshotEmail: "alex@example.invalid",
  status: "included",
  templateVersion: 1,
  tenantId: "tenant_jh_gomes"
} as CampaignRecipient;

const jobRecipient: OutreachSendJobRecipient = {
  approvedContentVersion: "hash_123",
  attemptCount: 0,
  campaignId: "campaign_001",
  campaignRecipientId: "recipient_001",
  completedAt: null,
  contactId: "contact_001",
  createdAt: "2026-07-09T00:00:00.000Z",
  id: "job_recipient_001",
  idempotencyKey: "campaign-send:tenant:campaign:recipient:hash:brevo",
  lastErrorCode: null,
  lastErrorMessage: null,
  leadId: "lead_001",
  nextAttemptAt: null,
  normalizedEmail: "alex@example.invalid",
  processingStartedAt: null,
  providerMessageId: null,
  queuedAt: "2026-07-09T00:00:00.000Z",
  sendJobId: "job_001",
  sentAt: null,
  status: "QUEUED",
  tenantId: "tenant_jh_gomes",
  updatedAt: "2026-07-09T00:00:00.000Z"
};

describe("buildServerCampaignDeliveryRequest", () => {
  it("builds real_send requests with unsubscribe URLs for Brevo jobs", () => {
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");
    vi.stubEnv("OUTREACH_UNSUBSCRIBE_SECRET", "test-secret-with-enough-entropy-for-hmac-signing");

    const request = buildServerCampaignDeliveryRequest({
      actorId: "operator",
      job,
      jobRecipient,
      language: "pt-PT",
      recipient
    });

    expect(request.mode).toBe("real_send");
    expect(request.unsubscribeUrl).toContain("https://forgeos.example/pt-PT/unsubscribe?token=");
    expect(request.toEmail).toBe("alex@example.invalid");
  });
});
