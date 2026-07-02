import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { approveRecipientDraft } from "@/application/campaign-approval-service";
import {
  cancelSendJob,
  evaluateCampaignQueueEligibility,
  pauseSendJob,
  processNextCampaignBatch,
  queueCampaignSendJob,
  resumeSendJob
} from "@/application/campaign-send-job-service";
import {
  generateCampaignDrafts,
  saveCampaignTemplate
} from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import { createEmailSuppression } from "@/application/suppression-service";
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

const TEST_DB = "forgeos:test:send-jobs";

class ScriptedProvider implements SendJobDeliveryProvider {
  calls: EmailDeliveryRequest[] = [];

  constructor(public readonly outcomes: Record<string, EmailDeliveryResponse> = {}) {}

  diagnostic(): Pick<EmailProviderDiagnostic, "configured" | "realSendEnabled"> {
    return { configured: true, realSendEnabled: true };
  }

  async send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse> {
    this.calls.push(request);
    return (
      this.outcomes[request.toEmail] ?? {
        errorCode: null,
        errorMessage: null,
        mode: request.mode,
        provider: "simulation",
        providerMessageId: `msg-${request.idempotencyKey}`,
        retryable: false,
        status: "accepted"
      }
    );
  }
}

function repos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

async function prepareApprovedCampaign(count: number) {
  const r = repos();
  const leadIds: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const lead = await r.leads.create(DEFAULT_TENANT_ID, {
      companyName: `Send Job Co ${index}`,
      contactName: `Contact ${index}`,
      email: `sendjob.${index}@example.invalid`,
      source: "test"
    });
    leadIds.push(lead.id);
  }
  const { campaign } = await createCampaignWithSnapshot(r, DEFAULT_TENANT_ID, {
    name: "Send Job Campaign",
    segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", leadIds)
  });
  await saveCampaignTemplate(r, DEFAULT_TENANT_ID, campaign.id, {
    subjectTemplate: "Ola {{companyName}}",
    plainTextTemplate:
      'Ola {{contactName}}.\n\nMensagem.\n\nSe preferir nao receber contactos comerciais, responda com o assunto "Remover".'
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

describe("campaign send job service", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("queues an approved campaign idempotently and snapshots eligible recipients", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(3);
    expect(campaign.status).toBe("approved");

    const eligibility = await evaluateCampaignQueueEligibility(r, {
      campaignId: campaign.id,
      deliveryMode: "simulation",
      provider: "simulation",
      tenantId: DEFAULT_TENANT_ID
    });
    expect(eligibility.canQueue).toBe(true);
    expect(eligibility.eligibleRecipients).toHaveLength(3);

    const first = await queueCampaignSendJob(r, {
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    const second = await queueCampaignSendJob(r, {
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    expect(first.alreadyQueued).toBe(false);
    expect(second.alreadyQueued).toBe(true);
    expect(second.job.id).toBe(first.job.id);
    const jobRecipients = await r.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, first.job.id);
    expect(jobRecipients).toHaveLength(3);
    expect(new Set(jobRecipients.map((row) => row.idempotencyKey)).size).toBe(3);
  });

  it("processes one bounded simulation batch and avoids duplicate provider calls", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(12);
    const provider = new ScriptedProvider();
    const { job } = await queueCampaignSendJob(r, {
      batchSize: 5,
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });

    const first = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    const second = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(first.processed).toBe(5);
    expect(second.processed).toBe(5);
    expect(provider.calls).toHaveLength(10);

    await pauseSendJob(r, DEFAULT_TENANT_ID, job.id, "tester", "checkpoint");
    const paused = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(paused.stopReason).toBe("paused");

    await resumeSendJob(r, DEFAULT_TENANT_ID, job.id, "tester");
    const final = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(final.processed).toBe(2);
    const again = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(again.stopReason).toBe("completed");
    expect(provider.calls).toHaveLength(12);
  });

  it("does not send recipients suppressed after queueing", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(2);
    const provider = new ScriptedProvider();
    const { job } = await queueCampaignSendJob(r, {
      batchSize: 2,
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    const recipients = await r.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, job.id);
    await createEmailSuppression(r, DEFAULT_TENANT_ID, {
      email: recipients[0].normalizedEmail,
      reason: "unsubscribe",
      source: "public_unsubscribe"
    });

    const result = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(result.suppressed).toBe(1);
    expect(provider.calls).toHaveLength(1);
  });

  it("retries transient failures and never retries permanent rejection", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(2);
    const provider = new ScriptedProvider({
      "sendjob.0@example.invalid": {
        errorCode: "provider_unavailable",
        errorMessage: "Temporary failure.",
        mode: "simulation",
        provider: "simulation",
        providerMessageId: null,
        retryable: true,
        status: "failed"
      },
      "sendjob.1@example.invalid": {
        errorCode: "provider_rejected",
        errorMessage: "Permanent rejection.",
        mode: "simulation",
        provider: "simulation",
        providerMessageId: null,
        retryable: false,
        status: "failed"
      }
    });
    const { job } = await queueCampaignSendJob(r, {
      batchSize: 2,
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      maxRetries: 1,
      tenantId: DEFAULT_TENANT_ID
    });
    const result = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(result.retryPending).toBe(1);
    expect(result.failed).toBe(1);

    const jobRecipients = await r.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, job.id);
    const retry = jobRecipients.find((row) => row.status === "RETRY_PENDING")!;
    await r.outreachSendJobRecipients.update(DEFAULT_TENANT_ID, retry.id, {
      nextAttemptAt: new Date(Date.now() - 1000).toISOString()
    });
    provider.outcomes["sendjob.0@example.invalid"] = {
      errorCode: null,
      errorMessage: null,
      mode: "simulation",
      provider: "simulation",
      providerMessageId: "retry-ok",
      retryable: false,
      status: "accepted"
    };
    const retryResult = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(retryResult.sent).toBe(1);
    expect(provider.calls.filter((call) => call.toEmail === "sendjob.1@example.invalid")).toHaveLength(1);
  });

  it("prevents concurrent live locks and lets stale locks recover", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const { job } = await queueCampaignSendJob(r, {
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    const first = await r.outreachSendJobs.acquireLock(
      DEFAULT_TENANT_ID,
      job.id,
      "owner-a",
      new Date(Date.now() + 60_000).toISOString()
    );
    const second = await r.outreachSendJobs.acquireLock(
      DEFAULT_TENANT_ID,
      job.id,
      "owner-b",
      new Date(Date.now() + 60_000).toISOString()
    );
    expect(first?.lockOwner).toBe("owner-a");
    expect(second).toBeNull();

    await r.outreachSendJobs.update(DEFAULT_TENANT_ID, job.id, {
      lockExpiresAt: new Date(Date.now() - 1000).toISOString()
    });
    const recovered = await r.outreachSendJobs.acquireLock(
      DEFAULT_TENANT_ID,
      job.id,
      "owner-b",
      new Date(Date.now() + 60_000).toISOString()
    );
    expect(recovered?.lockOwner).toBe("owner-b");
  });

  it("cancels unsent recipients while preserving sent history", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(2);
    const provider = new ScriptedProvider();
    const { job } = await queueCampaignSendJob(r, {
      batchSize: 1,
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    await cancelSendJob(r, DEFAULT_TENANT_ID, job.id, "tester", "stop");
    const recipients = await r.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, job.id);
    expect(recipients.filter((row) => row.status === "SENT")).toHaveLength(1);
    expect(recipients.filter((row) => row.status === "CANCELLED")).toHaveLength(1);
  });

  it("does not consume real-send daily allowance in simulation mode", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider();
    const { job } = await queueCampaignSendJob(r, {
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    const usage = await r.outreachSendJobDailyUsage.get(DEFAULT_TENANT_ID, "brevo", new Date().toISOString().slice(0, 10));
    expect(usage).toBeNull();
  });

  it("does not process completed jobs again or duplicate accepted attempts", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider();
    const { job } = await queueCampaignSendJob(r, {
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(provider.calls).toHaveLength(1);

    const completed = await processNextCampaignBatch(r, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(completed.stopReason).toBe("completed");
    expect(completed.processed).toBe(0);
    expect(provider.calls).toHaveLength(1);
  });

  it("enforces maximum retry count for transient failures", async () => {
    const { campaign, repos: r } = await prepareApprovedCampaign(1);
    const provider = new ScriptedProvider({
      "sendjob.0@example.invalid": {
        errorCode: "provider_unavailable",
        errorMessage: "Temporary failure.",
        mode: "simulation",
        provider: "simulation",
        providerMessageId: null,
        retryable: true,
        status: "failed"
      }
    });
    const { job } = await queueCampaignSendJob(r, {
      batchSize: 1,
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      maxRetries: 1,
      tenantId: DEFAULT_TENANT_ID
    });

    await processNextCampaignBatch(r, provider, { sendJobId: job.id, tenantId: DEFAULT_TENANT_ID });
    let recipient = (await r.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, job.id))[0];
    expect(recipient.status).toBe("RETRY_PENDING");
    await r.outreachSendJobRecipients.update(DEFAULT_TENANT_ID, recipient.id, {
      nextAttemptAt: new Date(Date.now() - 1000).toISOString()
    });

    await processNextCampaignBatch(r, provider, { sendJobId: job.id, tenantId: DEFAULT_TENANT_ID });
    recipient = (await r.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, job.id))[0];
    expect(recipient.status).toBe("FAILED");
    expect(provider.calls).toHaveLength(2);
  });
});
