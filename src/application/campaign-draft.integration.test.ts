import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateCampaignDrafts,
  previewCampaignDrafts,
  regenerateRecipientDraft,
  saveCampaignTemplate,
  updateRecipientDraftContent
} from "@/application/campaign-draft-service";
import {
  createCampaignWithSnapshot
} from "@/application/campaign-segmentation-service";
import { confirmLeadImport, buildImportPreview } from "@/application/lead-import-service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import {
  createLocalRepositoryBundle,
  seedDatabase
} from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:campaign-drafts";

function csvFile(content: string): File {
  return new File([content], "draft-leads.csv", { type: "text/csv" });
}

describe("campaign draft integration", () => {
  beforeEach(async () => {
    vi.unstubAllEnvs();
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("persists template edits, generated drafts, and manual recipient edits across reload", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry,website",
      "Draft Co One,One User,one@example.invalid,Lisbon,Hospitality,https://one.example",
      "Draft Co Two,Two User,two@example.invalid,Porto,Events,https://two.example"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });

    const leads = await repos.leads.list(DEFAULT_TENANT_ID);
    const lead = leads.find((row) => row.companyName === "Draft Co One");
    expect(lead).toBeTruthy();

    const definition = buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id]);
    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Draft Template Campaign",
      segmentDefinition: definition
    });

    const updatedTemplate = await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Custom subject for {{companyName}}",
      plainTextTemplate: "Hello {{contactName}} from {{senderName}} at {{companySenderName}}."
    });
    expect(updatedTemplate.templateVersion).toBe(campaign.templateVersion + 1);

    const generated = await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    expect(generated.generated).toBeGreaterThanOrEqual(1);

    const recipients = await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id);
    const included = recipients.filter((row) => row.status === "included");
    const target = included[0];
    expect(target?.draftStatus).toBe("DRAFTED");
    expect(target?.personalizedSubject).toContain("Draft Co One");

    const editedSubject = "Manual subject override";
    const editedBody = "Manual body with exact persistence marker XYZ-123.";
    await updateRecipientDraftContent(repos, DEFAULT_TENANT_ID, target!.id, {
      personalizedSubject: editedSubject,
      personalizedPlainText: editedBody
    });

    const reloaded = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, target!.id);
    expect(reloaded?.personalizedSubject).toBe(editedSubject);
    expect(reloaded?.personalizedPlainText).toBe(editedBody);
    expect(reloaded?.userEdited).toBe(true);
    expect(reloaded?.generationMethod).toBe("manual");

    const bulkAgain = await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id, {
      skipEdited: true
    });
    expect(bulkAgain.skippedEdited).toBeGreaterThanOrEqual(1);

    const preserved = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, target!.id);
    expect(preserved?.personalizedPlainText).toBe(editedBody);

    await expect(
      regenerateRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, target!.id, false)
    ).rejects.toThrow(/Confirm regeneration/i);

    await regenerateRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, target!.id, true);
    const regenerated = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, target!.id);
    expect(regenerated?.userEdited).toBe(false);
    expect(regenerated?.generationMethod).toBe("deterministic_template");

    const previewCounts = await previewCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    expect(previewCounts.counts.includedRecipients).toBeGreaterThanOrEqual(1);
  });

  it("marks drafts with unresolved variables as NEEDS_REVIEW", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry",
      "Unresolved Co,User,unresolved@example.invalid,Lisbon,Hospitality"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find(
      (row) => row.companyName === "Unresolved Co"
    );
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Unresolved Draft Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });

    await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Hello {{companyName}}",
      plainTextTemplate: "Body with {{unknownVariable}}"
    });

    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id)).find(
      (row) => row.status === "included"
    );
    expect(recipient?.draftStatus).toBe("NEEDS_REVIEW");
  });

  it("stores snapshotWebsite on recipients for template rendering", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry,website",
      "Website Co,Site User,site@example.invalid,Lisbon,Hospitality,https://website.example"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find((row) => row.companyName === "Website Co");
    expect(lead?.website).toBe("https://website.example");

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Website Snapshot Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });

    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    expect(recipient?.snapshotWebsite).toBe("https://website.example");
  });

  it("preserves portfolio image HTML block after manual draft edits", async () => {
    vi.stubEnv("FORGEOS_PUBLIC_BASE_URL", "https://forgeos.example");
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry",
      "Portfolio Co,Site User,portfolio@example.invalid,Lisbon,Hospitality"
    ].join("\n");

    const preview = await buildImportPreview(repos, DEFAULT_TENANT_ID, csvFile(csv));
    await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, { allowRepeatImport: true });
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID)).find(
      (row) => row.companyName === "Portfolio Co"
    );
    expect(lead).toBeTruthy();

    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Portfolio Draft Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead!.id])
    });

    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (
      await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id)
    ).find((row) => row.status === "included");
    expect(recipient?.personalizedHtml).toContain("custom-cups-banner.png");

    await updateRecipientDraftContent(repos, DEFAULT_TENANT_ID, recipient!.id, {
      personalizedSubject: recipient!.personalizedSubject,
      personalizedPlainText:
        "Corpo atualizado com instrução de remoção: responda com o assunto Remover."
    });

    const reloaded = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, recipient!.id);
    expect(reloaded?.personalizedHtml).toContain("custom-cups-banner.png");
    expect(reloaded?.personalizedHtml).toContain("Remover");
  });
});
