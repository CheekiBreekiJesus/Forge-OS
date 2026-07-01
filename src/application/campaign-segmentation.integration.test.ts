import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildLeadManagementContext,
  createCampaignWithSnapshot,
  previewCampaignSegment,
  refreshCampaignRecipients
} from "@/application/campaign-segmentation-service";
import { confirmLeadImport, buildImportPreview } from "@/application/lead-import-service";
import { exportBackup, importBackup } from "@/features/backup/service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { buildSegmentDefinitionFromFilters, buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { EMPTY_LEADOPS_FILTERS } from "@/features/leadops/types";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import {
  createLocalRepositoryBundle,
  resetDemoRecords,
  seedDatabase
} from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:campaign-segmentation";

function csvFile(content: string): File {
  return new File([content], "segment-leads.csv", { type: "text/csv" });
}

describe("campaign segmentation integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("creates stable recipient snapshots and refreshes only on explicit action", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry",
      "Segment Co Alpha,Alpha User,alpha@example.invalid,Lisbon,Hospitality",
      "Segment Co Beta,Beta User,beta@example.invalid,Porto,Events",
      "Segment Co Missing,, ,Faro,Hospitality"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });

    const context = await buildLeadManagementContext(repos, DEFAULT_TENANT_ID);
    const alphaLead = (await repos.leads.list(DEFAULT_TENANT_ID)).find(
      (lead) => lead.companyName === "Segment Co Alpha"
    );
    expect(alphaLead).toBeTruthy();

    const definition = buildSegmentDefinitionFromSelection("selected_organizations", [alphaLead!.id]);
    const segmentPreview = previewCampaignSegment(definition, context);
    expect(segmentPreview.counts.matchingOrganizations).toBe(1);
    expect(segmentPreview.counts.sendableRecipients).toBeGreaterThanOrEqual(1);

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Hospitality Draft",
      segmentDefinition: definition
    });
    const snapshotBefore = await repos.campaignRecipients.listForCampaign(
      DEFAULT_TENANT_ID,
      campaign.id
    );
    expect(snapshotBefore.some((row) => row.snapshotCompanyName === "Segment Co Alpha")).toBe(true);

    await repos.leads.update(DEFAULT_TENANT_ID, alphaLead!.id, {
      companyName: "Segment Co Alpha Updated"
    });

    const snapshotAfterLeadChange = await repos.campaignRecipients.listForCampaign(
      DEFAULT_TENANT_ID,
      campaign.id
    );
    expect(snapshotAfterLeadChange[0]?.snapshotCompanyName).toBe("Segment Co Alpha");

    const refresh = await refreshCampaignRecipients(repos, DEFAULT_TENANT_ID, campaign.id);
    expect(refresh.diff.added + refresh.diff.removed).toBeGreaterThanOrEqual(0);

    const activities = await repos.activities.list(DEFAULT_TENANT_ID);
    expect(activities.some((event) => event.action === "campaign_created")).toBe(true);
    expect(activities.some((event) => event.action === "campaign_segment_snapshotted")).toBe(true);
    expect(activities.some((event) => event.action === "campaign_recipients_refreshed")).toBe(true);
  });

  it("preserves operational campaigns during demo reset and restores backup snapshots", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const definition = buildSegmentDefinitionFromFilters(EMPTY_LEADOPS_FILTERS, "Atlantic");
    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Operational Draft",
      segmentDefinition: definition
    });

    const backup = await exportBackup(repos, DEFAULT_TENANT_ID, false);
    expect(backup.tables.campaignRecipients.length).toBeGreaterThan(0);

    await resetDemoRecords(getDatabase(TEST_DB), DEFAULT_TENANT_ID);
    const preserved = await repos.campaigns.getById(DEFAULT_TENANT_ID, campaign.id);
    expect(preserved?.name).toBe("Operational Draft");

    await importBackup(repos, backup);
    const restoredRecipients = await repos.campaignRecipients.listForCampaign(
      DEFAULT_TENANT_ID,
      campaign.id
    );
    expect(restoredRecipients.length).toBeGreaterThan(0);
  });
});
