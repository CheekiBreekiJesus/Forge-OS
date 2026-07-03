import { describe, expect, it } from "vitest";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type { Lead } from "@/domain/types";
import {
  buildApprovalContentHash,
  buildSendIdempotencyKey,
  computeCampaignProgress,
  deriveCampaignStatus,
  evaluateRecipientApproval
} from "@/application/campaign-approval-service";
import type { SenderContext } from "@/application/campaign-sender-context";
import {
  buildGmailComposeUrl,
  buildOutlookComposeUrl
} from "@/features/email-composition/copy";
import { assertSafeOutboundContent } from "@/features/leadops/campaign-draft-composition";

const campaign: OutreachCampaign = {
  id: "cmp_test",
  tenantId: "tenant_a",
  name: "Test",
  description: "",
  language: "pt-PT",
  status: "draft",
  segmentDefinition: null,
  recipientSnapshotCreatedAt: null,
  recipientSnapshotCount: 1,
  subjectTemplate: "Hi {{companyName}}",
  plainTextTemplate: "Body {{contactName}} {{unsubscribeInstruction}}",
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

const senderContext: SenderContext = {
  company: {
    addressLine1: "",
    addressLine2: "",
    city: "Lisboa",
    country: "PT",
    defaultCurrency: "EUR",
    defaultLanguage: "pt-PT",
    facebookUrl: "",
    generalEmail: "geral@example.pt",
    generalPhone: "",
    id: "c1",
    legalFooter: "",
    legalName: "Forge Cups",
    linkedinUrl: "",
    logoLocalAssetId: null,
    logoPublicUrl: "",
    postalCode: "",
    region: "",
    tenantId: "tenant_a",
    tradingName: "Forge Cups",
    vatNumber: "",
    websiteUrl: "https://example.pt"
  },
  sender: {
    active: true,
    companyProfileId: "c1",
    defaultLanguage: "pt-PT",
    displayName: "Maria",
    fromEmail: "maria@example.pt",
    id: "s1",
    isDefault: true,
    jobTitle: "",
    phone: "+351244555666",
    replyToEmail: "maria@example.pt",
    signatureHtml: "",
    signatureText: "",
    tenantId: "tenant_a",
    userProfileId: "u1"
  },
  missingFields: [],
  ready: true
};

function recipient(overrides: Partial<CampaignRecipient> = {}): CampaignRecipient {
  return {
    id: "cmr_1",
    tenantId: "tenant_a",
    campaignId: "cmp_test",
    leadId: "lead_1",
    contactId: null,
    snapshotEmail: "client@example.invalid",
    snapshotCompanyName: "Client Co",
    snapshotContactName: "Ana",
    snapshotCategory: "Hospitality",
    snapshotRegion: "Lisbon",
    snapshotWebsite: "",
    greetingOverride: "",
    organizationDisplayNameOverride: "",
    contactSalutation: null,
    inclusionReason: "sendable",
    status: "included",
    personalizedSubject: "Copos para Client Co",
    personalizedPlainText:
      'Olá Ana.\n\nSe preferir não receber contactos comerciais, responda com o assunto "Remover".',
    personalizedHtml: "",
    draftStatus: "DRAFTED",
    generatedAt: "2026-01-01T00:00:00.000Z",
    generationMethod: "deterministic_template",
    templateVersion: 1,
    userEdited: false,
    draftUpdatedAt: "2026-01-01T00:00:00.000Z",
    approvedAt: null,
    approvedBy: null,
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
}

const leadRow = {
  consentStatus: "opted_in",
  outreachStatus: "ready"
} as unknown as Lead;

const mockRepos = {
  emailSuppressions: {
    listActive: async () => []
  }
} as never;

describe("campaign approval service", () => {
  it("evaluates approval requirements for safe drafted content", async () => {
    const evaluation = await evaluateRecipientApproval(
      mockRepos,
      "tenant_a",
      campaign,
      recipient(),
      senderContext,
      leadRow
    );
    expect(evaluation.canApprove).toBe(true);
  });

  it("blocks approval for unresolved variables and missing opt-out", async () => {
    const unresolved = await evaluateRecipientApproval(
      mockRepos,
      "tenant_a",
      campaign,
      recipient({
        personalizedPlainText: "Hello {{unknown}}",
        draftStatus: "NEEDS_REVIEW"
      }),
      senderContext,
      leadRow
    );
    expect(unresolved.canApprove).toBe(false);
    expect(unresolved.reasons).toContain("needs_review");

    const missingOptOut = await evaluateRecipientApproval(
      mockRepos,
      "tenant_a",
      campaign,
      recipient({ personalizedPlainText: "Hello there, no instruction here." }),
      senderContext,
      leadRow
    );
    expect(missingOptOut.canApprove).toBe(false);
    expect(missingOptOut.reasons).toContain("missing_opt_out");
  });

  it("builds stable approval hash and idempotency key", () => {
    const row = recipient();
    const hash = buildApprovalContentHash(row);
    expect(hash).toContain("client@example.invalid");
    expect(buildSendIdempotencyKey("cmp_test", row)).toContain("cmp_test:cmr_1:");
    expect(buildSendIdempotencyKey("cmp_test", row)).toContain(hash);
  });

  it("derives campaign progress and status", () => {
    const rows = [
      recipient({ draftStatus: "DRAFTED" }),
      recipient({ id: "cmr_2", draftStatus: "APPROVED" }),
      recipient({ id: "cmr_3", draftStatus: "OPENED_EXTERNALLY" }),
      recipient({ id: "cmr_4", draftStatus: "SENT_MANUALLY" })
    ];
    const progress = computeCampaignProgress(rows);
    expect(progress.total).toBe(4);
    expect(progress.approved).toBe(1);
    expect(progress.openedExternally).toBe(1);
    expect(progress.manuallySent).toBe(1);
    expect(deriveCampaignStatus(campaign, rows)).toBe("in_progress");
  });

  it("builds Gmail and Outlook URLs without localhost or blob values", () => {
    const subject = "Assunto com acentuação";
    const body = "Corpo com quebras\n\ne sem URLs locais.";
    const gmail = buildGmailComposeUrl({
      to: "client@example.invalid",
      subject,
      body
    });
    const outlook = buildOutlookComposeUrl({
      to: "client@example.invalid",
      subject,
      body
    });
    expect(gmail.url).toMatch(/^https:\/\/mail\.google\.com\/mail\//);
    expect(outlook.url).toMatch(/^https:\/\/outlook\.office\.com\//);
    expect(gmail.url).not.toMatch(/localhost|blob:/i);
    expect(outlook.url).not.toMatch(/localhost|blob:/i);
    assertSafeOutboundContent(subject, body, "<p>ok</p>");
    expect(() => assertSafeOutboundContent("x", "blob:test", "")).toThrow();
  });
});
