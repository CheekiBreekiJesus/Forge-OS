import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import { sendApprovedOutreachMessage } from "./outreach-message-send-service";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";

vi.mock("@/features/leadops/providers", () => ({
  deliverApprovedOutreachMessage: vi.fn(async (request: { approvedSubject: string; approvedPlainText: string }) => ({
    mode: "simulation",
    providerStatus: "sent",
    providerMessageId: "sim-123",
    deliveredSubject: request.approvedSubject,
    deliveredPlainText: request.approvedPlainText
  }))
}));

function buildRecipient(overrides: Partial<CampaignRecipient> = {}): CampaignRecipient {
  const base: CampaignRecipient = {
    id: "recipient-1",
    tenantId: "tenant-1",
    campaignId: "campaign-1",
    leadId: "lead-1",
    contactId: null,
    snapshotEmail: "alex@example.test",
    snapshotCompanyName: "Synthetic Co",
    snapshotContactName: "Alex",
    snapshotCategory: "",
    snapshotRegion: "",
    snapshotWebsite: "",
    greetingOverride: "",
    organizationDisplayNameOverride: "",
    contactSalutation: null,
    inclusionReason: "",
    status: "included",
    personalizedSubject: "Exact Subject",
    personalizedPlainText: "Exact body",
    personalizedHtml: "",
    draftStatus: "APPROVED",
    generatedAt: null,
    generationMethod: null,
    templateVersion: null,
    userEdited: false,
    draftUpdatedAt: null,
    approvedAt: "2026-01-01T00:00:00.000Z",
    approvedBy: "user-1",
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
  base.approvalContentHash = buildApprovalContentHash(base);
  return base;
}

function buildCampaign(): OutreachCampaign {
  return {
    id: "campaign-1",
    tenantId: "tenant-1",
    name: "Campaign",
    description: "",
    language: "pt-PT",
    status: "active",
    segmentDefinition: null,
    recipientSnapshotCreatedAt: null,
    recipientSnapshotCount: 0,
    subjectTemplate: "",
    plainTextTemplate: "",
    htmlTemplate: "",
    templateVersion: 1,
    templateUpdatedAt: null,
    fromName: "",
    senderProfileId: null,
    replyTo: "",
    deliveryMode: "simulation",
    createdBy: "user-1",
    sentCount: 0,
    totalCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
}

describe("sendApprovedOutreachMessage atomic claim path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses claim/complete hooks when available", async () => {
    const recipient = buildRecipient();
    const claim = vi.fn(async () => ({
      result: "claimed" as const,
      attemptId: "attempt-1",
      idempotencyKey: "outreach-send:tenant-1:recipient-1:hash-v1",
      reclaimed: false
    }));
    const complete = vi.fn(async () => undefined);
    const append = vi.fn(async () => ({
      id: "act-1",
      tenantId: "tenant-1",
      entityType: "campaign",
      entityId: "campaign-1",
      action: "campaign_draft_sent_simulated",
      title: "t",
      metadata: {},
      occurredAt: "2026-01-01T00:00:00.000Z"
    }));

    const repos = {
      campaigns: { getById: vi.fn(async () => buildCampaign()) },
      campaignRecipients: { getById: vi.fn(async () => recipient) },
      outreachSendAttempts: {
        getByIdempotencyKey: vi.fn(),
        create: vi.fn(),
        claim,
        complete
      },
      activities: { append }
    } as unknown as LocalRepositoryBundle;

    const result = await sendApprovedOutreachMessage(repos, {
      tenantId: "tenant-1",
      campaignId: "campaign-1",
      recipientId: "recipient-1",
      actorId: "user-1"
    });

    expect(claim).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledOnce();
    expect(result.alreadyProcessed).toBe(false);
    expect(result.delivery.deliveredSubject).toBe("Exact Subject");
  });
});
