import { createRecordId } from "@/domain/ids";
import type {
  CampaignRecipient,
  CreateCampaignRecipientInput,
  CreateOutreachCampaignInput,
  OutreachCampaign,
  RecipientRefreshDiff,
  UpdateCampaignRecipientDraftInput
} from "@/domain/campaign-types";
import { buildDefaultCampaignTemplate } from "@/features/leadops/default-templates";
import { createEmptyRecipientDraftFields } from "@/features/leadops/recipient-draft-defaults";
import type { ForgeOSDatabase } from "@/persistence/db";
import { PersistenceError } from "@/persistence/interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export interface CampaignRecipientRepository {
  listForCampaign(tenantId: string, campaignId: string): Promise<CampaignRecipient[]>;
  listForTenant(tenantId: string): Promise<CampaignRecipient[]>;
  getById(tenantId: string, recipientId: string): Promise<CampaignRecipient | null>;
  updateDraft(
    tenantId: string,
    recipientId: string,
    patch: UpdateCampaignRecipientDraftInput
  ): Promise<CampaignRecipient>;
  replaceForCampaign(
    tenantId: string,
    campaignId: string,
    recipients: CreateCampaignRecipientInput[]
  ): Promise<{ recipients: CampaignRecipient[]; diff: RecipientRefreshDiff }>;
}

export interface OutreachCampaignRepository {
  list(tenantId: string): Promise<OutreachCampaign[]>;
  getById(tenantId: string, campaignId: string): Promise<OutreachCampaign | null>;
  create(tenantId: string, input: CreateOutreachCampaignInput): Promise<OutreachCampaign>;
  update(tenantId: string, campaignId: string, patch: Partial<OutreachCampaign>): Promise<OutreachCampaign>;
}

function defaultTemplateForLanguage(language: string) {
  return buildDefaultCampaignTemplate(language);
}

export function createOutreachCampaignRepository(db: ForgeOSDatabase): OutreachCampaignRepository {
  return {
    async list(tenantId) {
      return db.campaigns.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, campaignId) {
      const row = await db.campaigns.get(campaignId);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const language = input.language ?? "pt-PT";
      const templateDefaults = defaultTemplateForLanguage(language);
      const campaign: OutreachCampaign = {
        id: createRecordId("cmp"),
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        language,
        status: "draft",
        segmentDefinition: input.segmentDefinition,
        recipientSnapshotCreatedAt: null,
        recipientSnapshotCount: 0,
        subjectTemplate: templateDefaults.subjectTemplate,
        plainTextTemplate: templateDefaults.plainTextTemplate,
        htmlTemplate: templateDefaults.htmlTemplate,
        templateVersion: templateDefaults.templateVersion,
        templateUpdatedAt: timestamp,
        fromName: input.fromName?.trim() ?? "",
        senderProfileId: input.senderProfileId ?? null,
        replyTo: input.replyTo?.trim() ?? "",
        deliveryMode: input.deliveryMode ?? "simulation",
        createdBy: input.createdBy?.trim() ?? "local-user",
        sentCount: 0,
        totalCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.campaigns.put(campaign);
      return campaign;
    },
    async update(tenantId, campaignId, patch) {
      const existing = await this.getById(tenantId, campaignId);
      if (!existing) throw new PersistenceError("not_found", "Campaign not found.");
      const updated = {
        ...existing,
        ...patch,
        id: existing.id,
        tenantId: existing.tenantId,
        updatedAt: nowIso()
      };
      await db.campaigns.put(updated);
      return updated;
    }
  };
}

export function createCampaignRecipientRepository(db: ForgeOSDatabase): CampaignRecipientRepository {
  return {
    async listForCampaign(tenantId, campaignId) {
      return db.campaignRecipients
        .where("[tenantId+campaignId]")
        .equals([tenantId, campaignId])
        .toArray();
    },
    async listForTenant(tenantId) {
      return db.campaignRecipients.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, recipientId) {
      const row = await db.campaignRecipients.get(recipientId);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async updateDraft(tenantId, recipientId, patch) {
      const existing = await this.getById(tenantId, recipientId);
      if (!existing) throw new PersistenceError("not_found", "Recipient not found.");
      const updated: CampaignRecipient = {
        ...existing,
        ...patch,
        id: existing.id,
        tenantId: existing.tenantId,
        campaignId: existing.campaignId
      };
      await db.campaignRecipients.put(updated);
      return updated;
    },
    async replaceForCampaign(tenantId, campaignId, recipients) {
      const existing = await this.listForCampaign(tenantId, campaignId);
      const existingByLead = new Map(existing.map((row) => [row.leadId, row]));
      const nextByLead = new Map(recipients.map((row) => [row.leadId, row]));
      const timestamp = nowIso();

      let added = 0;
      let removed = 0;
      let newlySuppressed = 0;
      let newlyInvalid = 0;

      for (const row of existing) {
        if (!nextByLead.has(row.leadId)) removed += 1;
      }
      for (const input of recipients) {
        if (!existingByLead.has(input.leadId)) added += 1;
        const previous = existingByLead.get(input.leadId);
        if (previous && previous.snapshotEmail !== input.snapshotEmail && !input.snapshotEmail) {
          newlyInvalid += 1;
        }
        if (
          previous &&
          previous.status === "included" &&
          input.status === "excluded" &&
          input.inclusionReason.includes("suppressed")
        ) {
          newlySuppressed += 1;
        }
      }

      await db.campaignRecipients
        .where("[tenantId+campaignId]")
        .equals([tenantId, campaignId])
        .delete();

      const stored: CampaignRecipient[] = recipients.map((input) => {
        const previous = existingByLead.get(input.leadId);
        const draftDefaults = createEmptyRecipientDraftFields();
        return {
          ...draftDefaults,
          ...input,
          snapshotWebsite: input.snapshotWebsite ?? draftDefaults.snapshotWebsite,
          ...(previous
            ? {
                personalizedSubject: previous.personalizedSubject,
                personalizedPlainText: previous.personalizedPlainText,
                personalizedHtml: previous.personalizedHtml,
                draftStatus: previous.draftStatus,
                generatedAt: previous.generatedAt,
                generationMethod: previous.generationMethod,
                templateVersion: previous.templateVersion,
                userEdited: previous.userEdited,
                draftUpdatedAt: previous.draftUpdatedAt,
                approvedAt: previous.approvedAt,
                approvedBy: previous.approvedBy,
                approvalContentHash: previous.approvalContentHash,
                approvalInvalidatedAt: previous.approvalInvalidatedAt,
                approvalInvalidationReason: previous.approvalInvalidationReason,
                greetingOverride: previous.greetingOverride,
                organizationDisplayNameOverride: previous.organizationDisplayNameOverride,
                contactSalutation: previous.contactSalutation,
                openedExternallyAt: previous.openedExternallyAt,
                externalClient: previous.externalClient,
                sentAt: previous.sentAt,
                sentBy: previous.sentBy,
                recipientDeliveryMode: previous.recipientDeliveryMode,
                operatorNote: previous.operatorNote,
                simulatedAt: previous.simulatedAt,
                sendIdempotencyKey: previous.sendIdempotencyKey
              }
            : {}),
          id: previous?.id ?? createRecordId("cmr"),
          tenantId,
          campaignId,
          createdAt: previous?.createdAt ?? timestamp
        };
      });
      if (stored.length > 0) await db.campaignRecipients.bulkPut(stored);

      return {
        recipients: stored,
        diff: { added, removed, newlySuppressed, newlyInvalid }
      };
    }
  };
}

export function campaignFromSeed(
  seed: {
    id: string;
    tenantId: string;
    name: string;
    status: OutreachCampaign["status"];
    sentCount: number;
    totalCount: number;
  },
  timestamp: string
): OutreachCampaign {
  const templateDefaults = defaultTemplateForLanguage("pt-PT");
  return {
    id: seed.id,
    tenantId: seed.tenantId,
    name: seed.name,
    description: "",
    language: "pt-PT",
    status: seed.status,
    segmentDefinition: null,
    recipientSnapshotCreatedAt: null,
    recipientSnapshotCount: seed.totalCount,
    subjectTemplate: templateDefaults.subjectTemplate,
    plainTextTemplate: templateDefaults.plainTextTemplate,
    htmlTemplate: templateDefaults.htmlTemplate,
    templateVersion: templateDefaults.templateVersion,
    templateUpdatedAt: timestamp,
    fromName: "JH Gomes",
    senderProfileId: null,
    replyTo: "",
    deliveryMode: "simulation",
    createdBy: "seed",
    sentCount: seed.sentCount,
    totalCount: seed.totalCount,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
