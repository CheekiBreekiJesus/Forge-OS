import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  generateCampaignDrafts,
  refreshCampaignSenderData,
  regenerateRecipientDraft
} from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import {
  approveRecipientDraft,
  markRecipientManuallySent
} from "@/application/campaign-approval-service";
import { confirmLeadImport, buildImportPreview } from "@/application/lead-import-service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:draft-personalization";

function csvFile(content: string): File {
  return new File([content], "municipality.csv", { type: "text/csv" });
}

describe("draft personalization integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("persists sender profile, generates municipality draft, and keeps approved snapshot immutable", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const company = await repos.companyProfiles.getForTenant(DEFAULT_TENANT_ID);
    const sender = await repos.senderIdentities.getDefault(DEFAULT_TENANT_ID);
    expect(company).toBeTruthy();
    expect(sender).toBeTruthy();

    await repos.senderIdentities.update(DEFAULT_TENANT_ID, sender!.id, {
      displayName: "Operador Sintético",
      fromEmail: "operador@synthetic.example",
      replyToEmail: "operador@synthetic.example",
      phone: "+351 244 333 444"
    });
    await repos.companyProfiles.update(DEFAULT_TENANT_ID, company!.id, {
      tradingName: "Empresa Sintética"
    });

    const reloadedRepos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const reloadedSender = await reloadedRepos.senderIdentities.getDefault(DEFAULT_TENANT_ID);
    expect(reloadedSender?.displayName).toBe("Operador Sintético");

    const csv = [
      "company,contact,email,region,industry,website",
      "Tábua,,geral@example.invalid,Coimbra,Municipality,https://tabua.example"
    ].join("\n");
    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });

    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find((row) => row.companyName === "Tábua");
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Municipality Draft Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });
    expect(campaign.senderProfileId).toBe(reloadedSender?.id);

    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id)).find(
      (row) => row.status === "included"
    );
    expect(recipient?.personalizedPlainText).toContain("Exmos. Senhores,");
    expect(recipient?.personalizedPlainText).toContain("Município de Tábua");
    expect(recipient?.personalizedPlainText).not.toContain("Municipality");
    expect(recipient?.personalizedPlainText).not.toMatch(/Pode encontrar mais informação em/i);
    expect(recipient?.personalizedPlainText).toContain("operador@synthetic.example");
    expect(recipient?.personalizedPlainText).toContain("+351 244 333 444");

    const approvedBody = recipient!.personalizedPlainText;
    const approvedSubject = recipient!.personalizedSubject;
    await approveRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, recipient!.id, "tester");

    await repos.senderIdentities.update(DEFAULT_TENANT_ID, sender!.id, {
      displayName: "Outro Nome",
      phone: "+351 999 999 999"
    });

    const afterSenderChange = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, recipient!.id);
    expect(afterSenderChange?.personalizedPlainText).toBe(approvedBody);
    expect(afterSenderChange?.personalizedSubject).toBe(approvedSubject);
    expect(afterSenderChange?.draftStatus).toBe("APPROVED");
  });

  it("keeps sent drafts immutable and skips approved drafts on sender refresh", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const sender = await repos.senderIdentities.getDefault(DEFAULT_TENANT_ID);
    expect(sender).toBeTruthy();

    await repos.senderIdentities.update(DEFAULT_TENANT_ID, sender!.id, {
      displayName: "Sender Refresh Test",
      fromEmail: "refresh@synthetic.example",
      replyToEmail: "refresh@synthetic.example",
      phone: "+351 244 777 888"
    });

    const csv = [
      "company,contact,email,region,industry",
      "Sent Co,User,sent@example.invalid,Lisbon,Hospitality"
    ].join("\n");
    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find((row) => row.companyName === "Sent Co");
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Sent Draft Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    expect(recipient).toBeTruthy();

    const sentBody = recipient!.personalizedPlainText;
    await approveRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, recipient!.id, "tester");
    const sent = await markRecipientManuallySent(repos, DEFAULT_TENANT_ID, campaign.id, recipient!.id);
    expect(sent.draftStatus).toBe("SENT_MANUALLY");

    await repos.senderIdentities.update(DEFAULT_TENANT_ID, sender!.id, {
      displayName: "Changed After Send",
      phone: "+351 999 888 777"
    });

    const afterSenderChange = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, recipient!.id);
    expect(afterSenderChange?.personalizedPlainText).toBe(sentBody);
    expect(afterSenderChange?.draftStatus).toBe("SENT_MANUALLY");

    const csvApproved = [
      "company,contact,email,region,industry",
      "Approved Co,User,approved@example.invalid,Lisbon,Hospitality",
      "Draft Co,User,draft@example.invalid,Porto,Hospitality"
    ].join("\n");
    const approvedPreview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csvApproved));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, approvedPreview.batchId, {
      allowRepeatImport: true
    });
    const approvedLeads = (await repos.leads.list(DEFAULT_TENANT_ID)).filter((row) =>
      ["Approved Co", "Draft Co"].includes(row.companyName)
    );
    const { campaign: approvedCampaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Approved Refresh Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection(
        "selected_organizations",
        approvedLeads.map((row) => row.id)
      )
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, approvedCampaign.id);
    const approvedRecipients = await repos.campaignRecipients.listForCampaign(
      DEFAULT_TENANT_ID,
      approvedCampaign.id
    );
    const approvedRecipient = approvedRecipients.find(
      (row) => row.snapshotCompanyName === "Approved Co"
    );
    expect(approvedRecipient).toBeTruthy();
    const approvedBody = approvedRecipient!.personalizedPlainText;
    await approveRecipientDraft(
      repos,
      DEFAULT_TENANT_ID,
      approvedCampaign.id,
      approvedRecipient!.id,
      "tester"
    );

    const refresh = await refreshCampaignSenderData(repos, DEFAULT_TENANT_ID, approvedCampaign.id);
    expect(refresh.regenerated).toBe(1);
    const stillApproved = await repos.campaignRecipients.getById(
      DEFAULT_TENANT_ID,
      approvedRecipient!.id
    );
    expect(stillApproved?.personalizedPlainText).toBe(approvedBody);
    expect(stillApproved?.draftStatus).toBe("APPROVED");

    const regenerated = await regenerateRecipientDraft(
      repos,
      DEFAULT_TENANT_ID,
      approvedCampaign.id,
      approvedRecipient!.id,
      false
    );
    expect(regenerated.draftStatus).not.toBe("APPROVED");
    expect(regenerated.approvalInvalidatedAt).toBeTruthy();
  });
});
