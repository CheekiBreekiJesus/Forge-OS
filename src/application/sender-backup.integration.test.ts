import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { generateCampaignDrafts } from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import { confirmLeadImport, buildImportPreview } from "@/application/lead-import-service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { exportBackup, importBackup } from "@/features/backup/service";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:sender-backup";

function csvFile(content: string): File {
  return new File([content], "sender-backup.csv", { type: "text/csv" });
}

describe("sender backup integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("round-trips sender profiles, campaign sender snapshots, and tenant scope", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const company = await repos.companyProfiles.getForTenant(DEFAULT_TENANT_ID);
    const sender = await repos.senderIdentities.getDefault(DEFAULT_TENANT_ID);
    expect(company).toBeTruthy();
    expect(sender).toBeTruthy();

    await repos.senderIdentities.update(DEFAULT_TENANT_ID, sender!.id, {
      displayName: "Backup Sender",
      fromEmail: "backup.sender@synthetic.example",
      replyToEmail: "backup.sender@synthetic.example",
      phone: "+351 244 555 666",
      isDefault: true
    });

    const csv = [
      "company,contact,email,region,industry",
      "Backup Municipality,,geral@example.invalid,Coimbra,Municipality"
    ].join("\n");
    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find(
      (row) => row.companyName === "Backup Municipality"
    );
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Sender Backup Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });
    expect(campaign.senderProfileId).toBe(sender!.id);

    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    expect(recipient?.personalizedPlainText).toContain("backup.sender@synthetic.example");

    const backup = await exportBackup(repos, DEFAULT_TENANT_ID, false);
    expect(backup.tables.senderIdentities.length).toBeGreaterThan(0);
    expect(backup.tables.senderIdentities.some((row) => row.displayName === "Backup Sender")).toBe(
      true
    );
    expect(backup.tables.companyProfiles[0]?.id).toBe(company!.id);
    expect(backup.tables.senderIdentities.every((row) => row.tenantId === DEFAULT_TENANT_ID)).toBe(
      true
    );
    expect(backup.tables.senderIdentities.every((row) => row.companyProfileId === company!.id)).toBe(
      true
    );

    await repos.reset();
    await importBackup(repos, backup);

    const restoredSender = await repos.senderIdentities.getDefault(DEFAULT_TENANT_ID);
    expect(restoredSender?.displayName).toBe("Backup Sender");
    expect(restoredSender?.fromEmail).toBe("backup.sender@synthetic.example");
    expect(restoredSender?.isDefault).toBe(true);

    const restoredCampaign = await repos.campaigns.getById(DEFAULT_TENANT_ID, campaign.id);
    expect(restoredCampaign?.senderProfileId).toBe(sender!.id);

    const restoredRecipient = (
      await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id)
    )[0];
    expect(restoredRecipient?.personalizedPlainText).toContain("backup.sender@synthetic.example");
    expect(restoredRecipient?.personalizedPlainText).toContain("Município de Backup Municipality");

    const foreignSenders = (await repos.senderIdentities.listAll(DEFAULT_TENANT_ID)).filter(
      (row) => row.tenantId !== DEFAULT_TENANT_ID
    );
    expect(foreignSenders).toHaveLength(0);
  });
});
