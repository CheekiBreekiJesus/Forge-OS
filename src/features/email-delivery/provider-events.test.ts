import { describe, expect, it, vi } from "vitest";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import {
  normalizeBrevoWebhookPayload,
  reconcileProviderEvent
} from "./provider-events";

function recipient(overrides: Partial<CampaignRecipient> = {}): CampaignRecipient {
  return {
    approvalContentHash: "hash",
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    approvedAt: "2026-01-01T00:00:00.000Z",
    approvedBy: "operator",
    campaignId: "cmp_1",
    contactId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    draftStatus: "APPROVED",
    draftUpdatedAt: "2026-01-01T00:00:00.000Z",
    externalClient: null,
    generatedAt: "2026-01-01T00:00:00.000Z",
    generationMethod: "deterministic_template",
    id: "cmr_1",
    inclusionReason: "sendable",
    leadId: "lead_1",
    openedExternallyAt: null,
    operatorNote: "",
    personalizedHtml: "",
    personalizedPlainText: "Body",
    personalizedSubject: "Subject",
    recipientDeliveryMode: null,
    sendIdempotencyKey: null,
    sentAt: null,
    sentBy: null,
    simulatedAt: null,
    snapshotCategory: "Hospitality",
    snapshotCompanyName: "Lead Co",
    snapshotContactName: "Ana",
    snapshotEmail: "lead@example.com",
    snapshotRegion: "Lisbon",
    snapshotWebsite: "",
    greetingOverride: "",
    organizationDisplayNameOverride: "",
    contactSalutation: null,
    status: "included",
    templateVersion: 1,
    tenantId: "tenant_a",
    userEdited: false,
    ...overrides
  };
}

function createRepos(initialRecipient = recipient()): LocalRepositoryBundle {
  const providerEvents: unknown[] = [];
  let row = initialRecipient;
  return {
    activities: { append: vi.fn(async () => ({})) },
    campaignRecipients: {
      getById: vi.fn(async () => row),
      listForTenant: vi.fn(async () => [row]),
      updateDraft: vi.fn(async (_tenantId, _id, patch) => {
        row = { ...row, ...patch };
        return row;
      })
    },
    emailSuppressions: {
      create: vi.fn(async (_tenantId, input) => ({
        active: true,
        campaignId: input.campaignId ?? null,
        contactId: input.contactId ?? null,
        createdAt: "2026-01-01T00:00:00.000Z",
        createdBy: input.createdBy ?? "system",
        id: "sup_1",
        leadId: input.leadId ?? null,
        normalizedEmail: String(input.email).toLowerCase(),
        notes: input.notes ?? "",
        reason: input.reason,
        removalReason: null,
        removedAt: null,
        removedBy: null,
        source: input.source ?? "system",
        tenantId: _tenantId
      })),
      getActiveByEmail: vi.fn(async () => null)
    },
    leads: { update: vi.fn(async () => ({})) },
    outreachProviderEvents: {
      create: vi.fn(async (input) => {
        const event = { ...input, id: `ope_${providerEvents.length + 1}` };
        providerEvents.push(event);
        return event;
      }),
      getByFingerprint: vi.fn(async (_tenantId, fingerprint) =>
        providerEvents.find((event) => (event as { eventFingerprint: string }).eventFingerprint === fingerprint) ?? null
      ),
      listForTenant: vi.fn(async () => providerEvents),
      listRecent: vi.fn(async () => providerEvents)
    },
    outreachSendAttempts: {
      listForTenant: vi.fn(async () => [
        {
          actualDestinationEmail: "qa@example.com",
          approvedContentHash: "hash",
          campaignId: "cmp_1",
          campaignRecipientId: "cmr_1",
          completedAt: "2026-01-01T00:00:01.000Z",
          deliveryMode: "provider_test",
          id: "osa_1",
          idempotencyKey: "key",
          initiatedBy: "operator",
          leadId: "lead_1",
          provider: "brevo",
          providerMessageId: "<message@relay.example>",
          retryable: false,
          sanitizedErrorCode: null,
          sanitizedErrorMessage: null,
          startedAt: "2026-01-01T00:00:00.000Z",
          status: "TEST_SENT",
          tenantId: "tenant_a"
        }
      ])
    }
  } as unknown as LocalRepositoryBundle;
}

function brevoEvent(event: string) {
  const normalized = normalizeBrevoWebhookPayload({
    email: "lead@example.com",
    event,
    id: 26224,
    "message-id": "<message@relay.example>",
    ts_event: 1598034509
  });
  if (!normalized) throw new Error("Expected normalized event.");
  return normalized;
}

describe("provider event reconciliation", () => {
  it("marks delivered recipients from Brevo delivered events", async () => {
    const repos = createRepos();

    const stored = await reconcileProviderEvent(repos, "tenant_a", brevoEvent("delivered"));

    expect(stored.processingStatus).toBe("processed");
    expect(stored.effect).toBe("marked_delivered");
    expect(repos.campaignRecipients.updateDraft).toHaveBeenCalledWith("tenant_a", "cmr_1", {
      draftStatus: "DELIVERED"
    });
  });

  it("records duplicate webhook delivery without repeating effects", async () => {
    const repos = createRepos();
    const event = brevoEvent("delivered");

    await reconcileProviderEvent(repos, "tenant_a", event);
    const duplicate = await reconcileProviderEvent(repos, "tenant_a", event);

    expect(duplicate.processingStatus).toBe("duplicate");
    expect(duplicate.duplicate).toBe(true);
    expect(repos.campaignRecipients.updateDraft).toHaveBeenCalledTimes(1);
  });

  it("creates global suppression for hard bounces", async () => {
    const repos = createRepos();

    const stored = await reconcileProviderEvent(repos, "tenant_a", brevoEvent("hard_bounce"));

    expect(stored.effect).toBe("suppressed_hard_bounce");
    expect(repos.emailSuppressions.create).toHaveBeenCalledWith(
      "tenant_a",
      expect.objectContaining({ reason: "hard_bounce", source: "provider_webhook" })
    );
  });

  it("does not let delivered reverse complaint state", async () => {
    const repos = createRepos(recipient({ draftStatus: "COMPLAINED" }));

    await reconcileProviderEvent(repos, "tenant_a", brevoEvent("delivered"));

    expect(repos.campaignRecipients.updateDraft).not.toHaveBeenCalled();
  });
});
