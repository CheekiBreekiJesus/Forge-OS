import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  approveRecipientDraft,
  evaluateDuplicateSend,
  markRecipientManuallySent,
  markRecipientOpenedExternally
} from "@/application/campaign-approval-service";
import {
  generateCampaignDrafts,
  saveCampaignTemplate,
  updateRecipientDraftContent
} from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import { confirmLeadImport, buildImportPreview } from "@/application/lead-import-service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import {
  createLocalRepositoryBundle,
  seedDatabase
} from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:campaign-approval";

function csvFile(content: string): File {
  return new File([content], "approval-leads.csv", { type: "text/csv" });
}

describe("campaign approval integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("approves, opens externally without sending, then marks manual send and blocks duplicate", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry",
      "Approval Co,Approver,approval@example.invalid,Lisbon,Hospitality"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find(
      (row) => row.companyName === "Approval Co"
    );
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Approval Flow Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });

    await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Olá {{companyName}}",
      plainTextTemplate:
        'Exmo(a). Sr(a). {{contactName}},\n\nMensagem de teste.\n\nSe preferir não receber contactos comerciais, responda com o assunto "Remover".'
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id)).find(
      (row) => row.status === "included"
    );
    expect(recipient).toBeTruthy();

    const approved = await approveRecipientDraft(
      repos,
      DEFAULT_TENANT_ID,
      campaign.id,
      recipient!.id
    );
    expect(approved.draftStatus).toBe("APPROVED");

    const opened = await markRecipientOpenedExternally(
      repos,
      DEFAULT_TENANT_ID,
      campaign.id,
      recipient!.id,
      "gmail"
    );
    expect(opened.draftStatus).toBe("OPENED_EXTERNALLY");
    expect(opened.sentAt).toBeNull();

    const sent = await markRecipientManuallySent(repos, DEFAULT_TENANT_ID, campaign.id, recipient!.id, {
      operatorNote: "Sent via Gmail manually"
    });
    expect(sent.draftStatus).toBe("SENT_MANUALLY");
    expect(sent.sentAt).toBeTruthy();

    const messages = await repos.outreachMessages.listForLead(DEFAULT_TENANT_ID, lead!.id);
    expect(messages.some((row) => row.sentAt)).toBe(true);

    const duplicate = await evaluateDuplicateSend(
      repos,
      DEFAULT_TENANT_ID,
      campaign,
      sent
    );
    expect(duplicate.blocked).toBe(true);
  });

  it("invalidates approval after manual draft edit", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry",
      "Invalidate Co,User,invalidate@example.invalid,Lisbon,Hospitality"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find(
      (row) => row.companyName === "Invalidate Co"
    );
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Invalidate Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });

    await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Subject {{companyName}}",
      plainTextTemplate:
        'Body {{contactName}}.\n\nSe preferir não receber contactos comerciais, responda com o assunto "Remover".'
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    await approveRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, recipient.id);

    await updateRecipientDraftContent(repos, DEFAULT_TENANT_ID, recipient.id, {
      personalizedSubject: "Edited subject",
      personalizedPlainText:
        'Edited body.\n\nSe preferir não receber contactos comerciais, responda com o assunto "Remover".'
    });

    const updated = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, recipient.id);
    expect(updated?.draftStatus).not.toBe("APPROVED");
    expect(updated?.approvalInvalidationReason).toContain("manual_draft_edit");
  });
});
