import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { approveRecipientDraft, buildApprovalContentHash } from "@/application/campaign-approval-service";
import {
  generateCampaignDrafts,
  saveCampaignTemplate
} from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import { executeOutlookTestSend } from "@/application/outlook-send-service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { OUTLOOK_TEST_SEND_CONFIRMATION } from "@/domain/outlook-send-types";
import type { TrustedSendJobActorContext } from "@/features/email-delivery/send-job-actor-context";
import {
  createOutlookDurableSendAttemptStore,
  resetOutlookSendAttemptStoreForTests,
  enableOutlookSendAttemptMemoryStore
} from "@/features/outlook-graph/durable-send-attempt-store";
import { OutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import { readOutlookGraphConfig } from "@/features/outlook-graph/config";
import {
  recoverStaleOutlookSendAttempts,
  resetOutlookSendRecoveryForTests
} from "@/features/outlook-graph/send-recovery";
import {
  createOutlookSendServerDependencies,
  setOutlookSendServerDependenciesForTests
} from "@/features/outlook-graph/server-dependencies";
import { clearInMemoryTokenFallback, saveCachedTokens } from "@/features/outlook-graph/token-service";
import { POST as testSendPost } from "@/app/api/integrations/outlook/test-send/route";
import { POST as organicSessionPost } from "@/app/api/integrations/outlook/organic-session/route";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import {
  createLocalRepositoryBundle,
  seedDatabase
} from "@/persistence/indexeddb/repositories";
import { destroyDatabaseForTests } from "@/persistence/registry";
import type { CachedOutlookTokens } from "@/features/outlook-graph/types";
import { OUTLOOK_DURABLE_PROVIDER } from "@/domain/outlook-send-types";

const TEST_DB = "forgeos:test:outlook-hardening";
const TEST_KEY = "c".repeat(32);

const actor: TrustedSendJobActorContext = {
  correlationId: "corr-outlook",
  roles: ["marketing_manager"],
  source: "development_headers",
  tenantId: DEFAULT_TENANT_ID,
  userId: "operator_test"
};

const senderTokens: CachedOutlookTokens = {
  accessToken: "token",
  refreshToken: "refresh",
  expiresAt: Date.now() + 3_600_000,
  accountId: "acct",
  homeAccountId: "acct",
  mailboxAddress: "sender@example.com",
  displayName: "Sender",
  scopes: ["Mail.Send"],
  cachedAt: new Date().toISOString()
};

function trustedHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "x-forgeos-actor-id": actor.userId,
    "x-forgeos-correlation-id": actor.correlationId,
    "x-forgeos-roles": "marketing_manager",
    "x-forgeos-tenant-id": actor.tenantId
  };
}

function repos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

async function prepareApprovedCampaign(email = "allowed@example.com") {
  const r = repos();
  const lead = await r.leads.create(DEFAULT_TENANT_ID, {
    companyName: "Outlook Hardening Co",
    contactName: "Ana",
    email,
    source: "test"
  });
  await r.senderIdentities.update(DEFAULT_TENANT_ID, (await r.senderIdentities.getDefault(DEFAULT_TENANT_ID))!.id, {
    fromEmail: "sender@example.com",
    displayName: "Forge Sender"
  });
  const { campaign } = await createCampaignWithSnapshot(r, DEFAULT_TENANT_ID, {
    name: "Outlook Hardening Campaign",
    segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead.id])
  });
  await saveCampaignTemplate(r, DEFAULT_TENANT_ID, campaign.id, {
    plainTextTemplate:
      'Ola {{contactName}}.\n\nMensagem.\n\nSe preferir nao receber contactos comerciais, responda com o assunto "Remover".',
    subjectTemplate: "Ola {{companyName}}"
  });
  await generateCampaignDrafts(r, DEFAULT_TENANT_ID, campaign.id);
  const recipients = await r.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id);
  await approveRecipientDraft(r, DEFAULT_TENANT_ID, campaign.id, recipients[0]!.id, "operator_test");
  return { campaign, recipient: (await r.campaignRecipients.getById(DEFAULT_TENANT_ID, recipients[0]!.id))! };
}

function createDeps(r = repos()) {
  enableOutlookSendAttemptMemoryStore();
  const config = readOutlookGraphConfig({
    FORGEOS_LOCAL_ENCRYPTION_KEY: TEST_KEY,
    FORGEOS_PUBLIC_BASE_URL: "http://localhost:3000",
    MICROSOFT_CLIENT_ID: "client-id",
    MICROSOFT_GRAPH_BASE_URL: "https://mock.graph.local/v1.0",
    OUTLOOK_GRAPH_ENABLED: "true",
    OUTLOOK_LIVE_SEND_ENABLED: "true",
    OUTLOOK_TEST_RECIPIENTS: "allowed@example.com"
  });
  const provider = new OutlookGraphEmailProvider({
    ...config,
    graphBaseUrl: "https://mock.graph.local/v1.0"
  });
  const attemptStore = createOutlookDurableSendAttemptStore();
  const deps = createOutlookSendServerDependencies(r, { attemptStore, config, provider });
  setOutlookSendServerDependenciesForTests(deps);
  return deps;
}

describe("outlook send hardening", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    await seedDatabase(getDatabase(TEST_DB), DEFAULT_TENANT_ID, false);
    clearInMemoryTokenFallback();
    resetOutlookSendAttemptStoreForTests();
    resetOutlookSendRecoveryForTests();
    setOutlookSendServerDependenciesForTests(null);
    process.env.FORGEOS_PUBLIC_BASE_URL = "http://localhost:3000";
    process.env.OUTLOOK_GRAPH_ENABLED = "true";
    process.env.OUTLOOK_LIVE_SEND_ENABLED = "true";
    process.env.OUTLOOK_TEST_RECIPIENTS = "allowed@example.com";
    process.env.MICROSOFT_CLIENT_ID = "client-id";
    process.env.FORGEOS_LOCAL_ENCRYPTION_KEY = TEST_KEY;
    process.env.MICROSOFT_GRAPH_BASE_URL = "https://mock.graph.local/v1.0";
    await saveCachedTokens(readOutlookGraphConfig(), senderTokens);
  });

  it("ignores client-supplied subject and body", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign();
    const deps = createDeps();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }) as Response);
    await executeOutlookTestSend(deps, actor, {
      campaignId: campaign.id,
      confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
      recipientId: recipient.id
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain(recipient.personalizedSubject);
    expect(String(init.body)).not.toContain("MALICIOUS SUBJECT");
    fetchMock.mockRestore();
  });

  it("rejects unapproved recipient", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign();
    const r = repos();
    const unapproved = { ...recipient, draftStatus: "DRAFTED" as const };
    vi.spyOn(r.campaignRecipients, "getById").mockResolvedValue(unapproved);
    const deps = createDeps(r);
    await expect(
      executeOutlookTestSend(deps, actor, {
        campaignId: campaign.id,
        confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
        recipientId: recipient.id
      })
    ).rejects.toMatchObject({ code: "invalid_transition" });
  });

  it("ignores stale client approval version and uses canonical snapshot", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign();
    createDeps();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }) as Response);
    const request = new NextRequest("http://localhost:3000/api/integrations/outlook/test-send", {
      body: JSON.stringify({
        approvedDraftVersion: "stale-hash",
        campaignId: campaign.id,
        confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
        recipientId: recipient.id,
        renderedBody: "MALICIOUS BODY",
        subject: "MALICIOUS SUBJECT"
      }),
      headers: trustedHeaders(),
      method: "POST"
    });
    const response = await testSendPost(request);
    expect(response.status).toBe(202);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain(recipient.personalizedSubject);
    expect(String(init.body)).not.toContain("MALICIOUS SUBJECT");
    fetchMock.mockRestore();
  });

  it("rejects recipient outside test allowlist", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign("other@example.com");
    const deps = createDeps();
    await expect(
      executeOutlookTestSend(deps, actor, {
        campaignId: campaign.id,
        confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
        recipientId: recipient.id
      })
    ).rejects.toMatchObject({ code: "recipient_not_allowed" });
  });

  it("rejects mailbox mismatch", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign();
    await saveCachedTokens(readOutlookGraphConfig(), {
      ...senderTokens,
      mailboxAddress: "wrong@example.com"
    });
    const deps = createDeps();
    await expect(
      executeOutlookTestSend(deps, actor, {
        campaignId: campaign.id,
        confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
        recipientId: recipient.id
      })
    ).rejects.toMatchObject({ code: "mailbox_mismatch" });
  });

  it("creates durable attempt before graph and blocks duplicate after restart", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign();
    const deps = createDeps();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }) as Response);
    const first = await executeOutlookTestSend(deps, actor, {
      campaignId: campaign.id,
      confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
      recipientId: recipient.id
    });
    expect(first.blockedByExistingAttempt).toBe(false);
    const second = await executeOutlookTestSend(deps, actor, {
      campaignId: campaign.id,
      confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
      recipientId: recipient.id
    });
    expect(second.blockedByExistingAttempt).toBe(true);
    fetchMock.mockRestore();
  });

  it("marks stale submitting attempt uncertain and blocks resubmission", async () => {
    const store = createOutlookDurableSendAttemptStore();
    const staleAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await store.createSubmitting({
      acceptedAt: null,
      approvedDraftVersion: "hash-1",
      campaignId: "cmp",
      campaignRecipientId: "cmr",
      createdAt: staleAt,
      failedAt: null,
      httpStatus: null,
      idempotencyKey: "outlook:cmp:cmr:hash-1:outlook",
      initiatedBy: "test",
      provider: OUTLOOK_DURABLE_PROVIDER,
      providerMessageId: null,
      retryable: false,
      sanitizedErrorCode: null,
      sanitizedErrorMessage: null,
      status: "submitting",
      submittingAt: staleAt,
      tenantId: DEFAULT_TENANT_ID,
      uncertainAt: null,
      cancelledAt: null
    });
    const report = await recoverStaleOutlookSendAttempts(store);
    expect(report.recoveredUncertain).toBe(1);
    const updated = await store.getByIdempotencyKey(DEFAULT_TENANT_ID, "outlook:cmp:cmr:hash-1:outlook");
    expect(updated?.status).toBe("uncertain");
  });

  it("rejects arbitrary organic-session payloads", async () => {
    createDeps();
    const request = new NextRequest("http://localhost:3000/api/integrations/outlook/organic-session", {
      body: JSON.stringify({
        items: [{ subject: "bad", renderedBody: "bad" }]
      }),
      headers: trustedHeaders(),
      method: "POST"
    });
    const response = await organicSessionPost(request);
    expect(response.status).toBe(400);
  });

  it("rejects invalid origin", async () => {
    createDeps();
    const request = new NextRequest("http://localhost:3000/api/integrations/outlook/test-send", {
      body: JSON.stringify({ confirmation: OUTLOOK_TEST_SEND_CONFIRMATION }),
      headers: {
        ...trustedHeaders(),
        origin: "https://evil.example"
      },
      method: "POST"
    });
    const response = await testSendPost(request);
    expect(response.status).toBe(403);
  });

  it("accepts same-origin request with trusted actor", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign();
    createDeps();
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }) as Response);
    const request = new NextRequest("http://localhost:3000/api/integrations/outlook/test-send", {
      body: JSON.stringify({
        campaignId: campaign.id,
        confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
        recipientId: recipient.id,
        subject: "IGNORED",
        renderedBody: "IGNORED"
      }),
      headers: trustedHeaders(),
      method: "POST"
    });
    const response = await testSendPost(request);
    expect(response.status).toBe(202);
    vi.restoreAllMocks();
  });

  it("restart safety: crash before response persistence leaves uncertain and blocks duplicate", async () => {
    const { campaign, recipient } = await prepareApprovedCampaign();
    const deps = createDeps();
    const hash = buildApprovalContentHash(recipient);
    const attemptStore = deps.attemptStore;
    const now = new Date().toISOString();
    await attemptStore.createSubmitting({
      acceptedAt: null,
      approvedDraftVersion: hash,
      campaignId: campaign.id,
      campaignRecipientId: recipient.id,
      createdAt: now,
      failedAt: null,
      httpStatus: null,
      idempotencyKey: `outlook:${campaign.id}:${recipient.id}:${hash}:outlook`,
      initiatedBy: actor.userId,
      provider: OUTLOOK_DURABLE_PROVIDER,
      providerMessageId: null,
      retryable: false,
      sanitizedErrorCode: null,
      sanitizedErrorMessage: null,
      status: "submitting",
      submittingAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      tenantId: DEFAULT_TENANT_ID,
      uncertainAt: null,
      cancelledAt: null
    });
    resetOutlookSendRecoveryForTests();
    await recoverStaleOutlookSendAttempts(attemptStore);
    const blocked = await executeOutlookTestSend(deps, actor, {
      campaignId: campaign.id,
      confirmation: OUTLOOK_TEST_SEND_CONFIRMATION,
      recipientId: recipient.id
    });
    expect(blocked.blockedByExistingAttempt).toBe(true);
    expect(blocked.result.classification).toBe("uncertain");
  });
});
