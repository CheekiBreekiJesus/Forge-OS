import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { approveRecipientDraft } from "@/application/campaign-approval-service";
import { generateCampaignDrafts, saveCampaignTemplate } from "@/application/campaign-draft-service";
import { createCampaignWithSnapshot } from "@/application/campaign-segmentation-service";
import {
  createEmailSuppression,
  removeEmailSuppression,
  requiresElevatedRemoval
} from "@/application/suppression-service";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { buildSegmentDefinitionFromSelection } from "@/features/leadops/segmentation";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { PersistenceError } from "@/persistence/interfaces";

const TEST_DB = "forgeos:test:suppression";

describe("suppression service", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("blocks approved recipients immediately after suppression", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const lead = (await repos.leads.list(DEFAULT_TENANT_ID))[0];
    const { campaign } = await createCampaignWithSnapshot(repos, DEFAULT_TENANT_ID, {
      name: "Suppression Campaign",
      segmentDefinition: buildSegmentDefinitionFromSelection("selected_organizations", [lead.id])
    });
    await saveCampaignTemplate(repos, DEFAULT_TENANT_ID, campaign.id, {
      subjectTemplate: "Hi {{companyName}}",
      plainTextTemplate:
        'Hello {{contactName}}.\n\nSe preferir não receber contactos comerciais, responda com o assunto "Remover".'
    });
    await generateCampaignDrafts(repos, DEFAULT_TENANT_ID, campaign.id);
    const recipient = (await repos.campaignRecipients.listForCampaign(DEFAULT_TENANT_ID, campaign.id))[0];
    await approveRecipientDraft(repos, DEFAULT_TENANT_ID, campaign.id, recipient.id);

    await createEmailSuppression(repos, DEFAULT_TENANT_ID, {
      email: recipient.snapshotEmail,
      reason: "manual",
      leadId: lead.id
    });

    const updated = await repos.campaignRecipients.getById(DEFAULT_TENANT_ID, recipient.id);
    expect(updated?.draftStatus).toBe("SUPPRESSED");
  });

  it("requires elevated confirmation for unsubscribe removal", async () => {
    expect(requiresElevatedRemoval("unsubscribe")).toBe(true);
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const created = await createEmailSuppression(repos, DEFAULT_TENANT_ID, {
      email: "blocked@example.invalid",
      reason: "unsubscribe"
    });
    await expect(
      removeEmailSuppression(repos, DEFAULT_TENANT_ID, created.id, {
        removalReason: "accident",
        elevatedConfirmed: false
      })
    ).rejects.toBeInstanceOf(PersistenceError);
  });

  it("enforces tenant isolation on suppression lookup", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    await createEmailSuppression(repos, DEFAULT_TENANT_ID, {
      email: "tenant-a@example.invalid",
      reason: "manual"
    });
    const otherTenantRow = await repos.emailSuppressions.getActiveByEmail(
      "tenant_other",
      "tenant-a@example.invalid"
    );
    expect(otherTenantRow).toBeNull();
  });
});
