import { describe, expect, it, vi } from "vitest";
import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import {
  buildTestSendIdempotencyKey,
  sendProtectedTestEmail
} from "@/application/outreach-test-send-service";
import type { EmailDeliveryProvider } from "@/features/email-delivery/provider";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

const campaign: OutreachCampaign = {
  id: "cmp_test",
  tenantId: "tenant_a",
  name: "Test",
  description: "",
  language: "pt-PT",
  status: "approved",
  segmentDefinition: null,
  recipientSnapshotCreatedAt: null,
  recipientSnapshotCount: 1,
  subjectTemplate: "",
  plainTextTemplate: "",
  htmlTemplate: "",
  templateVersion: 1,
  templateUpdatedAt: null,
  fromName: "",
  senderProfileId: null,
  replyTo: "",
  deliveryMode: "simulation",
  createdBy: "local-user",
  sentCount: 0,
  totalCount: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

function approvedRecipient(overrides: Partial<CampaignRecipient> = {}): CampaignRecipient {
  const base: CampaignRecipient = {
    id: "cmr_1",
    tenantId: "tenant_a",
    campaignId: campaign.id,
    leadId: "lead_1",
    contactId: null,
    snapshotEmail: "lead@example.invalid",
    snapshotCompanyName: "Lead Company",
    snapshotContactName: "Ana",
    snapshotCategory: "Hospitality",
    snapshotRegion: "Lisbon",
    snapshotWebsite: "",
    inclusionReason: "sendable",
    status: "included",
    personalizedSubject: "Approved subject",
    personalizedPlainText: "Approved body",
    personalizedHtml: "<p>Approved body</p>",
    draftStatus: "APPROVED",
    generatedAt: "2026-01-01T00:00:00.000Z",
    generationMethod: "deterministic_template",
    templateVersion: 1,
    userEdited: false,
    draftUpdatedAt: "2026-01-01T00:00:00.000Z",
    approvedAt: "2026-01-01T00:05:00.000Z",
    approvedBy: "operator@example.com",
    approvalContentHash: null,
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    openedExternallyAt: null,
    externalClient: null,
    sentAt: null,
    sentBy: null,
    recipientDeliveryMode: null,
    operatorNote: "",
    simulatedAt: null,
    sendIdempotencyKey: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
  return { ...base, approvalContentHash: overrides.approvalContentHash ?? buildApprovalContentHash(base) };
}

function createRepos(recipient = approvedRecipient()): LocalRepositoryBundle {
  const attempts: unknown[] = [];
  return {
    activities: { append: vi.fn(async () => ({})) },
    campaigns: { getById: vi.fn(async () => campaign) },
    campaignRecipients: { getById: vi.fn(async () => recipient) },
    emailSuppressions: { getActiveByEmail: vi.fn(async () => null) },
    outreachSendAttempts: {
      create: vi.fn(async (input) => {
        const row = { ...input, id: "osa_1" };
        attempts.push(row);
        return row;
      }),
      getByIdempotencyKey: vi.fn(async () => null),
      listForRecipient: vi.fn(async () => attempts),
      listForTenant: vi.fn(async () => attempts)
    }
  } as unknown as LocalRepositoryBundle;
}

function createProvider(): EmailDeliveryProvider {
  return {
    diagnostic: vi.fn(() => ({
      allowlistConfigured: true,
      allowlistCount: 1,
      apiKeyPresent: true,
      configured: true,
      missing: [],
      provider: "brevo" as const,
      realSendEnabled: true,
      replyToConfigured: true,
      sandboxMode: false,
      senderEmailConfigured: true,
      senderNameConfigured: true,
      testSendEnabled: true,
      publicBaseUrlConfigured: true,
      unsubscribeSecretConfigured: true,
      webhookSecretConfigured: true,
      warnings: []
    })),
    send: vi.fn(async () => ({
      errorCode: null,
      errorMessage: null,
      mode: "provider_test" as const,
      provider: "brevo" as const,
      providerMessageId: "<message@relay.example>",
      retryable: false,
      status: "accepted" as const
    }))
  };
}

describe("protected outreach test send service", () => {
  it("persists TEST_SENT attempt without marking the original lead sent", async () => {
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");
    vi.stubEnv("OUTREACH_UNSUBSCRIBE_SECRET", "test-secret-with-enough-entropy-for-hmac-signing");
    const recipient = approvedRecipient();
    const repos = createRepos(recipient);
    const provider = createProvider();

    const result = await sendProtectedTestEmail(repos, provider, {
      campaignId: campaign.id,
      confirmation: "SEND TEST",
      initiatedBy: "operator@example.com",
      recipientId: recipient.id,
      tenantId: "tenant_a",
      testRecipientEmail: "qa@example.com"
    });

    expect(result.delivery.status).toBe("accepted");
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect(vi.mocked(provider.send).mock.calls[0]?.[0].unsubscribeUrl).toContain("/pt-PT/unsubscribe?token=");
    expect(repos.outreachSendAttempts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actualDestinationEmail: "qa@example.com",
        campaignRecipientId: recipient.id,
        providerMessageId: "<message@relay.example>",
        status: "TEST_SENT"
      })
    );
    expect(recipient.sentAt).toBeNull();
    expect(recipient.draftStatus).toBe("APPROVED");
  });

  it("returns an existing result for duplicate idempotency without calling provider", async () => {
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");
    vi.stubEnv("OUTREACH_UNSUBSCRIBE_SECRET", "test-secret-with-enough-entropy-for-hmac-signing");
    const recipient = approvedRecipient();
    const key = buildTestSendIdempotencyKey(campaign.id, recipient, "qa@example.com");
    const repos = createRepos(recipient);
    vi.mocked(repos.outreachSendAttempts.getByIdempotencyKey).mockResolvedValue({
      actualDestinationEmail: "qa@example.com",
      approvedContentHash: recipient.approvalContentHash!,
      campaignId: campaign.id,
      campaignRecipientId: recipient.id,
      completedAt: "2026-01-01T00:00:01.000Z",
      deliveryMode: "provider_test",
      id: "osa_existing",
      idempotencyKey: key,
      initiatedBy: "operator@example.com",
      leadId: recipient.leadId,
      provider: "brevo",
      providerMessageId: "<message@relay.example>",
      retryable: false,
      sanitizedErrorCode: null,
      sanitizedErrorMessage: null,
      startedAt: "2026-01-01T00:00:00.000Z",
      status: "TEST_SENT",
      tenantId: "tenant_a"
    });
    const provider = createProvider();

    const result = await sendProtectedTestEmail(repos, provider, {
      campaignId: campaign.id,
      confirmation: "SEND TEST",
      recipientId: recipient.id,
      tenantId: "tenant_a",
      testRecipientEmail: "qa@example.com"
    });

    expect(result.alreadyProcessed).toBe(true);
    expect(result.delivery.status).toBe("already_processed");
    expect(provider.send).not.toHaveBeenCalled();
  });
});
