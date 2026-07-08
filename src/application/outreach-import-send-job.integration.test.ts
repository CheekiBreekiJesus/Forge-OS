import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { approveRecipientDraft } from "@/application/campaign-approval-service";
import {
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
import { buildImportPreview, confirmLeadImport } from "@/application/lead-import-service";
import { createEmailSuppression } from "@/application/suppression-service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import type {
  EmailDeliveryRequest,
  EmailDeliveryResponse,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import type { SendJobDeliveryProvider } from "@/domain/send-job-types";
import { evaluateSendability } from "@/features/leadops/sendability";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:outreach-integration";

class NoOpSimulationProvider implements SendJobDeliveryProvider {
  calls: EmailDeliveryRequest[] = [];

  diagnostic(): Pick<EmailProviderDiagnostic, "configured" | "realSendEnabled"> {
    return { configured: true, realSendEnabled: false };
  }

  async send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse> {
    this.calls.push(request);
    return {
      errorCode: null,
      errorMessage: null,
      mode: "simulation",
      provider: "simulation",
      providerMessageId: `sim-${request.idempotencyKey}`,
      retryable: false,
      status: "accepted"
    };
  }
}

function buildMultiSheetWorkbook(): File {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["company", "contact", "email", "region", "industry"],
      ["Integration Cafe", "Maria", "integration.cafe@example.invalid", "Lisbon", "Hospitality"]
    ]),
    "Hospitality"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Name", "Email", "Ciudad", "Tipo"],
      ["Integration Municipality", "integration.mun@example.invalid", "Porto", "Public"]
    ]),
    "Municipalities"
  );
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([buffer], "integration-multi-sheet.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

describe("outreach import-to-simulation integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("imports multi-sheet XLSX, campaigns sendable leads, simulates bounded send job, and respects suppression", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    await repos.importMappingProfiles.ensureBuiltins(DEFAULT_TENANT_ID);
    const profile = (await repos.importMappingProfiles.list(DEFAULT_TENANT_ID)).find(
      (entry) => entry.label === "Municipalities"
    );
    expect(profile).toBeDefined();

    const file = buildMultiSheetWorkbook();
    const hospitalityPreview = await buildImportPreview(repos, DEFAULT_TENANT_ID, file, {
      sheetName: "Hospitality"
    });
    expect(hospitalityPreview.counts.validRows).toBe(1);
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, hospitalityPreview.batchId, {
      allowRepeatImport: true
    });

    const municipalitiesPreview = await buildImportPreview(repos, DEFAULT_TENANT_ID, file, {
      sheetName: "Municipalities",
      mappingProfileId: profile!.id,
      mappingOverride: { ...profile!.headerMappings }
    });
    expect(municipalitiesPreview.counts.validRows).toBe(1);
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, municipalitiesPreview.batchId, {
      allowRepeatImport: true
    });

    const leads = await repos.leads.list(DEFAULT_TENANT_ID);
    const imported = leads.filter((lead) =>
      ["Integration Cafe", "Integration Municipality"].includes(lead.companyName)
    );
    expect(imported).toHaveLength(2);

    const suppressions = await repos.emailSuppressions.list(DEFAULT_TENANT_ID);
    const suppressedEmails = new Set(suppressions.map((row) => row.normalizedEmail));
    const sendable = imported.filter((lead) =>
      evaluateSendability({
        lead,
        suppressedEmails,
        tenantId: DEFAULT_TENANT_ID
      }).sendable
    );
    expect(sendable).toHaveLength(2);

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Integration Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection(
        "selected_organizations",
        sendable.map((lead) => lead.id)
      )
    });
    await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Ola {{companyName}}",
      plainTextTemplate:
        'Ola {{contactName}}.\n\nMensagem.\n\nSe preferir nao receber contactos comerciais, responda com o assunto "Remover".'
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipients = await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id);
    expect(recipients).toHaveLength(2);
    for (const recipient of recipients) {
      await approveRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, recipient.id);
    }

    const approvedCampaign = (await repos.campaigns.getById(DEFAULT_TENANT_ID, campaign.id))!;
    expect(approvedCampaign.status).toBe("approved");

    const eligibility = await evaluateCampaignQueueEligibility(repos, {
      campaignId: campaign.id,
      deliveryMode: "simulation",
      provider: "simulation",
      tenantId: DEFAULT_TENANT_ID
    });
    expect(eligibility.canQueue).toBe(true);
    expect(eligibility.eligibleRecipients).toHaveLength(2);

    const provider = new NoOpSimulationProvider();
    const { job } = await queueCampaignSendJob(repos, {
      batchSize: 1,
      campaignId: campaign.id,
      confirmation: "QUEUE SIMULATION",
      tenantId: DEFAULT_TENANT_ID
    });
    const jobRecipients = await repos.outreachSendJobRecipients.listForJob(DEFAULT_TENANT_ID, job.id);
    expect(jobRecipients).toHaveLength(2);

    const firstBatch = await processNextCampaignBatch(repos, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(firstBatch.processed).toBe(1);
    expect(provider.calls).toHaveLength(1);

    await pauseSendJob(repos, DEFAULT_TENANT_ID, job.id, "integration-test", "checkpoint");
    const pausedBatch = await processNextCampaignBatch(repos, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(pausedBatch.stopReason).toBe("paused");

    const pendingRecipient = jobRecipients.find(
      (row) => row.normalizedEmail !== provider.calls[0]?.toEmail
    );
    expect(pendingRecipient).toBeDefined();
    await createEmailSuppression(repos, DEFAULT_TENANT_ID, {
      email: pendingRecipient!.normalizedEmail,
      reason: "manual",
      leadId: pendingRecipient!.leadId
    });

    await resumeSendJob(repos, DEFAULT_TENANT_ID, job.id, "integration-test");
    const secondBatch = await processNextCampaignBatch(repos, provider, {
      sendJobId: job.id,
      tenantId: DEFAULT_TENANT_ID
    });
    expect(secondBatch.suppressed).toBeGreaterThanOrEqual(1);
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls.every((call) => call.mode === "simulation")).toBe(true);
  });
});
