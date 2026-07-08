import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { generateCampaignDrafts } from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import { approveRecipientDraft } from "@/application/campaign-approval-service";
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

    const reloadedSender = await repos.senderIdentities.getDefault(DEFAULT_TENANT_ID);
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
});
