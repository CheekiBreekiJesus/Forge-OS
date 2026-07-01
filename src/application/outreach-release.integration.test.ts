import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { approveRecipientDraft } from "@/application/campaign-approval-service";
import {
  generateCampaignDrafts,
  saveCampaignTemplate,
  updateRecipientDraftContent
} from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import { confirmLeadImport, buildImportPreview } from "@/application/lead-import-service";
import {
  createEmailSuppression,
  removeEmailSuppression
} from "@/application/suppression-service";
import { exportBackup, importBackup } from "@/features/backup/service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { evaluateRecipientApproval } from "@/application/campaign-approval-service";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import {
  createLocalRepositoryBundle,
  resetDemoRecords,
  seedDatabase
} from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:outreach-release";

function csvFile(content: string): File {
  return new File([content], "release-leads.csv", { type: "text/csv" });
}

describe("outreach release integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("runs import through suppression and backup restore", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry",
      "Release Co,Operator,release@example.invalid,Lisbon,Hospitality"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find((row) => row.companyName === "Release Co");
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Release Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });

    await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Olá {{companyName}}",
      plainTextTemplate:
        'Exmo(a). Sr(a). {{contactName}},\n\nMensagem.\n\nSe preferir não receber contactos comerciais, responda com o assunto "Remover".'
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    expect(recipient).toBeTruthy();

    const approved = await approveRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, recipient!.id);
    expect(approved.draftStatus).toBe("APPROVED");

    await createEmailSuppression(repos, DEFAULT_TENANT_ID, {
      email: recipient!.snapshotEmail,
      reason: "manual",
      leadId: lead!.id
    });

    const blocked = await evaluateRecipientApproval(
      repos,
      DEFAULT_TENANT_ID,
      campaign,
      (await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, recipient!.id))!
    );
    expect(blocked.canApprove).toBe(false);
    expect(blocked.reasons).toContain("suppressed");

    const backup = await exportBackup(repos, DEFAULT_TENANT_ID, false);
    expect(backup.tables.emailSuppressions.length).toBeGreaterThan(0);

    await resetDemoRecords(getDatabase(TEST_DB), DEFAULT_TENANT_ID);
    const report = await importBackup(repos, backup);
    expect(report.orphanedCampaignRecipients).toBe(0);

    const restoredSuppression = await repos.emailSuppressions.getActiveByEmail(
      DEFAULT_TENANT_ID,
      "release@example.invalid"
    );
    expect(restoredSuppression?.active).toBe(true);

    const restoredRecipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    expect(restoredRecipient?.draftStatus).toBe("SUPPRESSED");

    await removeEmailSuppression(
      repos,
      DEFAULT_TENANT_ID,
      restoredSuppression!.id,
      { removalReason: "test cleanup", elevatedConfirmed: false },
      "admin"
    );
  });

  it("invalidates approval after contact correction on subject edit", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID))[0];
    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Edit Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead.id])
    });
    await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Olá {{companyName}}",
      plainTextTemplate:
        'Olá {{contactName}}.\n\nSe preferir não receber contactos comerciais, responda com o assunto "Remover".'
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    await approveRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, recipient.id);
    await updateRecipientDraftContent(repos, DEFAULT_TENANT_ID, recipient.id, {
      personalizedSubject: "Changed subject",
      personalizedPlainText: recipient.personalizedPlainText
    });
    const updated = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, recipient.id);
    expect(updated?.draftStatus).not.toBe("APPROVED");
  });
});
