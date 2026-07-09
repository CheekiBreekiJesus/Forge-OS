import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { approveRecipientDraft } from "@/application/campaign-approval-service";
import {
  generateCampaignDrafts,
  saveCampaignTemplate
} from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import {
  cancelJobThroughServer,
  getSendJobStatusThroughServer,
  pauseJobThroughServer,
  processNextBatchThroughServer,
  queueCampaignThroughServer,
  resumeJobThroughServer,
  retryEligibleFailureThroughServer
} from "@/application/send-job-server-mutations";
import { createSendJobRouteHandler } from "@/app/api/outreach/send-jobs/_shared";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import type {
  EmailDeliveryRequest,
  EmailDeliveryResponse,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import type { SendJobDeliveryProvider } from "@/domain/send-job-types";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import {
  createLocalRepositoryBundle,
  seedDatabase
} from "@/persistence/indexeddb/repositories";
import { destroyDatabaseForTests } from "@/persistence/registry";

const TEST_DB = "forgeos:test:send-job-server-mutations";

class ScriptedProvider implements SendJobDeliveryProvider {
  calls: EmailDeliveryRequest[] = [];

  constructor(public outcomes: Record<string, EmailDeliveryResponse> = {}) {}

  diagnostic(): Pick<EmailProviderDiagnostic, "configured" | "realSendEnabled"> {
    return { configured: true, realSendEnabled: false };
  }

  async send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse> {
    this.calls.push(request);
    return (
      this.outcomes[request.toEmail] ?? {
        errorCode: null,
        errorMessage: null,
        mode: request.mode,
        provider: "simulation",
        providerMessageId: `server-simulation-${request.idempotencyKey}`,
        retryable: false,
        status: "accepted"
      }
    );
  }
}

function repos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

function trustedRequest(body: unknown, role = "marketing_manager", tenantId: string = DEFAULT_TENANT_ID) {
  return new Request("http://localhost/api/outreach/send-jobs", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forgeos-actor-id": "user_server_test",
      "x-forgeos-correlation-id": "corr_server_test",
      "x-forgeos-roles": role,
      "x-forgeos-tenant-id": tenantId
    },
    method: "POST"
  });
}

async function prepareApprovedCampaign(count: number) {
  const r = repos();
  const leadIds: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const lead = await r.leads.create(DEFAULT_TENANT_ID, {
      companyName: `Server Send Job Co ${index}`,
      contactName: `Contact ${index}`,
      email: `server-sendjob.${index}@example.invalid`,
      source: "test"
    });
    leadIds.push(lead.id);
  }
  const { campaign } = await createCampaignWithSnapshot(r, DEFAULT_TENANT_ID, {
    name: "Server Send Job Campaign",
    segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", leadIds)
  });
  await saveCampaignTemplate(r, DEFAULT_TENANT_ID, campaign.id, {
    plainTextTemplate:
      'Ola {{contactName}}.\n\nMensagem.\n\nSe preferir nao receber contactos comerciais, responda com o assunto "Remover".',
    subjectTemplate: "Ola {{companyName}}"
  });
  await generateCampaignDrafts(r, DEFAULT_TENANT_ID, campaign.id);
  const recipients = await r.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id);
  for (const recipient of recipients) {
    await approveRecipientDraft(r, DEFAULT_TENANT_ID, campaign.id, recipient.id);
  }
  return {
    campaign: (await r.campaigns.getById(DEFAULT_TENANT_ID, campaign.id))!,
    repos: r
  };
}

describe("send-job server mutation boundaries", () => {
  beforeEach(async () => {
    vi.unstubAllEnvs();
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("rejects browser-supplied tenant fields and does not queue", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider();
    const handler = createSendJobRouteHandler(queueCampaignThroughServer, {
      deps: { provider, repos: r }
    });

    const response = await handler(
      trustedRequest({
        campaignId: campaign.id,
        confirmation: "QUEUE SIMULATION",
        tenantId: "tenant_attacker"
      })
    );
    const payload = await response.json();
    const jobs = await r.outreachSendJobs.listForCampaign(DEFAULT_TENANT_ID, campaign.id);

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("bad_request");
    expect(jobs).toHaveLength(0);
  });

  it("runs the authorized durable simulation flow through server boundaries", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(3);
    const provider = new ScriptedProvider();
    const deps = { provider, repos: r };
    const queue = createSendJobRouteHandler(queueCampaignThroughServer, { deps });
    const process = createSendJobRouteHandler(processNextBatchThroughServer, { deps });
    const pause = createSendJobRouteHandler(pauseJobThroughServer, { deps });
    const resume = createSendJobRouteHandler(resumeJobThroughServer, { deps });
    const cancel = createSendJobRouteHandler(cancelJobThroughServer, { deps });
    const status = createSendJobRouteHandler(getSendJobStatusThroughServer, { deps });

    const queuedResponse = await queue(
      trustedRequest({
        batchSize: 1,
        campaignId: campaign.id,
        confirmation: "QUEUE SIMULATION",
        deliveryMode: "simulation",
        provider: "simulation"
      })
    );
    const queuedPayload = await queuedResponse.json();
    const jobId = queuedPayload.result.job.id as string;

    const firstBatch = await process(trustedRequest({ jobId }));
    await pause(trustedRequest({ jobId, reason: "review" }));
    const pausedProcess = await process(trustedRequest({ jobId }));
    await resume(trustedRequest({ jobId }));
    const secondBatch = await process(trustedRequest({ jobId }));
    const cancelResponse = await cancel(trustedRequest({ jobId, reason: "stop remaining" }));
    const statusResponse = await status(trustedRequest({ jobId }));

    const firstPayload = await firstBatch.json();
    const pausedPayload = await pausedProcess.json();
    const secondPayload = await secondBatch.json();
    const cancelPayload = await cancelResponse.json();
    const statusPayload = await statusResponse.json();

    expect(queuedResponse.status).toBe(200);
    expect(firstPayload.result.processed).toBe(1);
    expect(pausedProcess.status).toBe(409);
    expect(pausedPayload.error.code).toBe("invalid_transition");
    expect(secondPayload.result.processed).toBe(1);
    expect(cancelPayload.result.job.status).toBe("CANCELLED");
    expect(statusPayload.result.recipientStatusCounts.SENT).toBe(2);
    expect(statusPayload.result.recipientStatusCounts.CANCELLED).toBe(1);
    expect(provider.calls).toHaveLength(2);
  });

  it("rejects unauthorized roles server-side", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider();
    const handler = createSendJobRouteHandler(queueCampaignThroughServer, {
      deps: { provider, repos: r }
    });

    const response = await handler(
      trustedRequest({ campaignId: campaign.id, confirmation: "QUEUE SIMULATION" }, "viewer")
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("forbidden");
    expect(await r.outreachSendJobs.listForCampaign(DEFAULT_TENANT_ID, campaign.id)).toHaveLength(0);
  });

  it("rejects cross-tenant campaign queue attempts", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider();
    const handler = createSendJobRouteHandler(queueCampaignThroughServer, {
      deps: { provider, repos: r }
    });

    const response = await handler(
      trustedRequest({ campaignId: campaign.id, confirmation: "QUEUE SIMULATION" }, "marketing_manager", "tenant_other")
    );

    expect(response.status).toBe(404);
    expect(await r.outreachSendJobs.listForCampaign(DEFAULT_TENANT_ID, campaign.id)).toHaveLength(0);
  });

  it("rejects retry for permanent failures", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider({
      "server-sendjob.0@example.invalid": {
        errorCode: "provider_rejected",
        errorMessage: "Permanent rejection with sanitized provider message.",
        mode: "simulation",
        provider: "simulation",
        providerMessageId: null,
        retryable: false,
        status: "failed"
      }
    });
    const deps = { provider, repos: r };
    const queue = createSendJobRouteHandler(queueCampaignThroughServer, { deps });
    const process = createSendJobRouteHandler(processNextBatchThroughServer, { deps });
    const retry = createSendJobRouteHandler(retryEligibleFailureThroughServer, { deps });

    const queuedResponse = await queue(
      trustedRequest({ batchSize: 1, campaignId: campaign.id, confirmation: "QUEUE SIMULATION" })
    );
    const queuedPayload = await queuedResponse.json();
    const jobId = queuedPayload.result.job.id as string;
    await process(trustedRequest({ jobId }));
    const [recipient] = await r.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, jobId);

    const retryResponse = await retry(
      trustedRequest({ jobId, reason: "manual review", recipientId: recipient.id })
    );
    const retryPayload = await retryResponse.json();

    expect(retryResponse.status).toBe(409);
    expect(retryPayload.error.code).toBe("invalid_transition");
  });

  it("rejects Brevo queue requests when real send is not enabled", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider();
    const handler = createSendJobRouteHandler(queueCampaignThroughServer, {
      deps: { provider, repos: r }
    });

    const response = await handler(
      trustedRequest({
        batchSize: 1,
        campaignId: campaign.id,
        confirmation: "QUEUE BREVO",
        deliveryMode: "brevo",
        provider: "brevo"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("unsupported_provider");
    expect(await r.outreachSendJobs.listForCampaign(DEFAULT_TENANT_ID, campaign.id)).toHaveLength(0);
  });

  it("keeps server errors sanitized and does not expose service-role values", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test-value");
    const handler = createSendJobRouteHandler(queueCampaignThroughServer);

    const response = await handler(
      trustedRequest({ campaignId: "campaign_missing", confirmation: "QUEUE SIMULATION" })
    );
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).not.toContain("service-role-test-value");
    expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
