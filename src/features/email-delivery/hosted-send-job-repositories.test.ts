import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type { DurableStoreConfig } from "./durable-outreach-store";
import {
  buildHostedCampaignProjectionFingerprint,
  getHostedCampaignPreparationStatus,
  prepareHostedCampaignProjection,
  type HostedCampaignProjectionInput
} from "./hosted-send-job-repositories";

const config: DurableStoreConfig = {
  serviceRoleKey: "service-role-test-key",
  supabaseUrl: "https://db.example"
};

const timestamp = "2026-07-03T12:00:00.000Z";

function campaign(): OutreachCampaign {
  return {
    createdAt: timestamp,
    createdBy: "operator",
    deliveryMode: "simulation",
    description: "",
    fromName: "ForgeOS",
    htmlTemplate: "<p>Hello</p>",
    id: "cmp_hosted_1",
    language: "pt-PT",
    name: "Hosted campaign",
    plainTextTemplate: "Hello",
    recipientSnapshotCount: 1,
    recipientSnapshotCreatedAt: timestamp,
    replyTo: "reply@example.invalid",
    segmentDefinition: null,
    senderProfileId: "sender_1",
    sentCount: 0,
    status: "approved",
    subjectTemplate: "Subject",
    templateUpdatedAt: timestamp,
    templateVersion: 1,
    tenantId: "tenant_a",
    totalCount: 1,
    updatedAt: timestamp
  };
}

function recipient(overrides: Partial<CampaignRecipient> = {}): CampaignRecipient {
  const base: CampaignRecipient = {
    approvalContentHash: null,
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    approvedAt: timestamp,
    approvedBy: "operator",
    campaignId: "cmp_hosted_1",
    contactId: null,
    createdAt: timestamp,
    draftStatus: "APPROVED",
    draftUpdatedAt: timestamp,
    externalClient: null,
    generatedAt: timestamp,
    generationMethod: "manual",
    greetingOverride: "",
    organizationDisplayNameOverride: "",
    contactSalutation: null,
    id: "cmr_hosted_1",
    inclusionReason: "selected",
    leadId: "lead_1",
    openedExternallyAt: null,
    operatorNote: "",
    personalizedHtml: "<p>Hello</p>",
    personalizedPlainText: "Hello\n\nReply Remover to opt out.",
    personalizedSubject: "Subject",
    recipientDeliveryMode: null,
    sendIdempotencyKey: null,
    sentAt: null,
    sentBy: null,
    simulatedAt: null,
    snapshotCategory: "",
    snapshotCompanyName: "Example Co",
    snapshotContactName: "Example Contact",
    snapshotEmail: "lead@example.invalid",
    snapshotRegion: "",
    snapshotWebsite: "",
    status: "included",
    templateVersion: 1,
    tenantId: "tenant_a",
    userEdited: false,
    ...overrides
  };
  return {
    ...base,
    approvalContentHash: overrides.approvalContentHash ?? buildApprovalContentHash(base)
  };
}

function projection(overrides: Partial<HostedCampaignProjectionInput> = {}): HostedCampaignProjectionInput {
  return {
    campaign: campaign(),
    company: {
      generalEmail: "info@example.invalid",
      legalFooter: "Footer",
      legalName: "Example Legal",
      tradingName: "Example",
      websiteUrl: "https://example.invalid"
    },
    recipients: [recipient()],
    sender: {
      displayName: "Operator",
      fromEmail: "operator@example.invalid",
      id: "sender_1",
      replyToEmail: "reply@example.invalid",
      signatureHtml: "",
      signatureText: ""
    },
    ...overrides
  };
}

function response(body: unknown, ok = true): Response {
  return { json: async () => body, ok } as Response;
}

describe("hosted campaign projection preparation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects stale recipient approvals before writing hosted rows", async () => {
    const fetch = vi.fn(async () => response([]));
    vi.stubGlobal("fetch", fetch);

    await expect(
      prepareHostedCampaignProjection(
        projection({ recipients: [recipient({ approvalContentHash: "stale" })] }),
        { tenantId: "tenant_a", userId: "user_1" },
        config
      )
    ).rejects.toMatchObject({
      code: "invalid_transition"
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("upserts an approved campaign projection and replaces prepared recipients", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ campaign_ref: "cmp_hosted_1", tenant_id: "tenant_a" }]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ campaign_recipient_ref: "cmr_hosted_1", tenant_id: "tenant_a" }]))
      .mockResolvedValueOnce(response([{ id: "activity_1", tenant_id: "tenant_a" }]));
    vi.stubGlobal("fetch", fetch);

    const result = await prepareHostedCampaignProjection(
      projection(),
      { tenantId: "tenant_a", userId: "user_1" },
      config
    );

    expect(result).toMatchObject({
      campaignId: "cmp_hosted_1",
      preparedRecipients: 1,
      reused: false,
      snapshotFingerprint: buildHostedCampaignProjectionFingerprint(projection())
    });
    expect(String(fetch.mock.calls[0][0])).toContain("outreach_hosted_campaigns");
    expect(String(fetch.mock.calls[2][0])).toContain("outreach_hosted_campaign_recipients");
    expect(String(fetch.mock.calls[3][0])).toContain("outreach_hosted_campaign_recipients");
    expect(String(fetch.mock.calls[4][0])).toContain("outreach_hosted_activity_events");
    expect(JSON.parse(String(fetch.mock.calls[3][1].body))[0]).toMatchObject({
      approval_content_hash: buildApprovalContentHash(recipient()),
      campaign_recipient_ref: "cmr_hosted_1",
      tenant_id: "tenant_a"
    });
  });

  it("reuses an already prepared hosted snapshot idempotently", async () => {
    const input = projection();
    const fingerprint = buildHostedCampaignProjectionFingerprint(input);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response([
          {
            campaign_ref: "cmp_hosted_1",
            prepared_at: timestamp,
            prepared_by: "user_1",
            recipient_snapshot_count: 1,
            snapshot_fingerprint: fingerprint,
            tenant_id: "tenant_a"
          }
        ])
      )
      .mockResolvedValueOnce(response([{ id: "activity_1", tenant_id: "tenant_a" }]));
    vi.stubGlobal("fetch", fetch);

    const result = await prepareHostedCampaignProjection(input, { tenantId: "tenant_a", userId: "user_1" }, config);

    expect(result).toMatchObject({
      campaignId: "cmp_hosted_1",
      preparedRecipients: 1,
      reused: true,
      snapshotFingerprint: fingerprint
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[1][0])).toContain("outreach_hosted_activity_events");
  });

  it("reads hosted preparation status and audit entries without sending", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response([
          {
            campaign_ref: "cmp_hosted_1",
            prepared_at: timestamp,
            prepared_by: "user_1",
            recipient_snapshot_count: 1,
            snapshot_fingerprint: "fingerprint",
            tenant_id: "tenant_a"
          }
        ])
      )
      .mockResolvedValueOnce(
        response([
          {
            action: "campaign_server_send_prepared",
            occurred_at: timestamp,
            title: "Campaign prepared for server sending"
          }
        ])
      );
    vi.stubGlobal("fetch", fetch);

    const status = await getHostedCampaignPreparationStatus("cmp_hosted_1", { tenantId: "tenant_a" }, config);

    expect(status).toMatchObject({
      campaignId: "cmp_hosted_1",
      preparedBy: "user_1",
      preparedRecipients: 1,
      status: "prepared"
    });
    expect(status.activity).toHaveLength(1);
    expect(String(fetch.mock.calls[0][0])).toContain("outreach_hosted_campaigns");
    expect(String(fetch.mock.calls[1][0])).toContain("outreach_hosted_activity_events");
  });
});
