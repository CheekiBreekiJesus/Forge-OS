import { createRecordId } from "@/domain/ids";
import type {
  AdvertisingAccount,
  AdvertisingCampaignMapping,
  BrandKit,
  CampaignContentVariant,
  MarketingAsset,
  MarketingAudience,
  MarketingCampaign,
  VideoProject
} from "@/domain/marketing-types";
import { recordActivity } from "@/features/crud/activity-recorder";
import {
  DEFAULT_ARCHIVABLE,
  createArchivePatch,
  createRestorePatch,
  filterByArchive,
  type ArchiveInput,
  type ListOptions
} from "@/persistence/archive-utils";
import type { ForgeOSDatabase } from "../db";
import {
  PersistenceError,
  type ActivityRepository,
  type AdvertisingAccountRepository,
  type AdvertisingCampaignMappingRepository,
  type BrandKitRepository,
  type CampaignContentVariantRepository,
  type MarketingAssetRepository,
  type MarketingAudienceRepository,
  type MarketingCampaignRepository,
  type VideoProjectRepository
} from "../interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export function createBrandKitRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): BrandKitRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.brandKits.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
    },
    async getById(tenantId, id) {
      const row = await db.brandKits.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getDefault(tenantId) {
      const rows = await this.list(tenantId);
      return rows.find((row) => row.active) ?? rows[0] ?? null;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const kit: BrandKit = {
        ...input,
        ...DEFAULT_ARCHIVABLE,
        id: createRecordId("brand"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.brandKits.put(kit);
      if (kit.active) await setOnlyActiveBrandKit(db, tenantId, kit.id);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "brand_kit.created",
          entityId: kit.id,
          entityType: "brand_kit",
          title: `Brand kit created: ${kit.name}`
        });
      }
      return kit;
    },
    async update(tenantId, id, input) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Brand kit not found.");
      const updated: BrandKit = {
        ...existing,
        ...input,
        id,
        tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.brandKits.put(updated);
      if (updated.active) await setOnlyActiveBrandKit(db, tenantId, updated.id);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "brand_kit.updated",
          entityId: updated.id,
          entityType: "brand_kit",
          title: `Brand kit updated: ${updated.name}`
        });
      }
      return updated;
    },
    async duplicate(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Brand kit not found.");
      return this.create(tenantId, {
        ...existing,
        active: false,
        name: `${existing.name} copy`
      });
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Brand kit not found.");
      const updated = { ...existing, ...createArchivePatch(input), active: false, updatedAt: nowIso() };
      await db.brandKits.put(updated);
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Brand kit not found.");
      const updated = { ...existing, ...createRestorePatch(), updatedAt: nowIso() };
      await db.brandKits.put(updated);
      return updated;
    },
    async setDefault(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Brand kit not found.");
      const updated = { ...existing, active: true, updatedAt: nowIso() };
      await db.brandKits.put(updated);
      await setOnlyActiveBrandKit(db, tenantId, id);
      return updated;
    }
  };
}

async function setOnlyActiveBrandKit(db: ForgeOSDatabase, tenantId: string, id: string) {
  const rows = await db.brandKits.where("tenantId").equals(tenantId).toArray();
  for (const row of rows) {
    if (row.id !== id && row.active) {
      await db.brandKits.put({ ...row, active: false, updatedAt: nowIso() });
    }
  }
}

export function createMarketingAssetRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): MarketingAssetRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.marketingAssets.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
    },
    async getById(tenantId, id) {
      const row = await db.marketingAssets.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async listForProduct(tenantId, productId) {
      const rows = await this.list(tenantId);
      return rows.filter((row) => row.productId === productId);
    },
    async listForCampaign(tenantId, campaignId) {
      const rows = await this.list(tenantId);
      return rows.filter((row) => row.campaignId === campaignId);
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const asset: MarketingAsset = {
        ...input,
        ...DEFAULT_ARCHIVABLE,
        approvedAt: input.approvedAt ?? null,
        approvedBy: input.approvedBy ?? null,
        id: createRecordId("masset"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.marketingAssets.put(asset);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: input.generationProvider ? "marketing_asset.generated" : "marketing_asset.uploaded",
          entityId: asset.id,
          entityType: "marketing_asset",
          title: `Marketing asset saved: ${asset.title}`
        });
      }
      return asset;
    },
    async update(tenantId, id, input) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing asset not found.");
      const approvalPatch =
        existing.approvalStatus === "approved"
          ? { approvalStatus: "pending_review" as const, approvedAt: null, approvedBy: null }
          : {};
      const updated: MarketingAsset = {
        ...existing,
        ...input,
        ...approvalPatch,
        id,
        tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.marketingAssets.put(updated);
      return updated;
    },
    async duplicateMetadata(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing asset not found.");
      return this.create(tenantId, {
        ...existing,
        active: true,
        approvalStatus: "draft",
        approvedAt: null,
        approvedBy: null,
        title: `${existing.title} copy`
      });
    },
    async approve(tenantId, id, approvedBy) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing asset not found.");
      const updated = {
        ...existing,
        approvalStatus: "approved" as const,
        approvedAt: nowIso(),
        approvedBy,
        updatedAt: nowIso()
      };
      await db.marketingAssets.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "marketing_asset.approved",
          entityId: id,
          entityType: "marketing_asset",
          title: `Marketing asset approved: ${existing.title}`
        });
      }
      return updated;
    },
    async reject(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing asset not found.");
      const updated = {
        ...existing,
        approvalStatus: "rejected" as const,
        approvedAt: null,
        approvedBy: null,
        updatedAt: nowIso()
      };
      await db.marketingAssets.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "marketing_asset.rejected",
          entityId: id,
          entityType: "marketing_asset",
          title: `Marketing asset rejected: ${existing.title}`
        });
      }
      return updated;
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing asset not found.");
      const updated = { ...existing, ...createArchivePatch(input), updatedAt: nowIso() };
      await db.marketingAssets.put(updated);
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing asset not found.");
      const updated = { ...existing, ...createRestorePatch(), updatedAt: nowIso() };
      await db.marketingAssets.put(updated);
      return updated;
    }
  };
}

export function createMarketingCampaignRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): MarketingCampaignRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.marketingCampaigns.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
    },
    async getById(tenantId, id) {
      const row = await db.marketingCampaigns.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const campaign: MarketingCampaign = {
        ...input,
        ...DEFAULT_ARCHIVABLE,
        approvedAt: input.approvedAt ?? null,
        approvedBy: input.approvedBy ?? null,
        id: createRecordId("mcamp"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.marketingCampaigns.put(campaign);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "marketing_campaign.created",
          entityId: campaign.id,
          entityType: "marketing_campaign",
          title: `Marketing campaign created: ${campaign.name}`
        });
      }
      return campaign;
    },
    async update(tenantId, id, input) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing campaign not found.");
      const invalidatesApproval =
        existing.approvalStatus === "approved" &&
        Object.keys(input).some((key) => !["status", "active"].includes(key));
      const updated: MarketingCampaign = {
        ...existing,
        ...input,
        ...(invalidatesApproval
          ? { approvalStatus: "pending_review" as const, approvedAt: null, approvedBy: null, status: "ready_for_review" as const }
          : {}),
        id,
        tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.marketingCampaigns.put(updated);
      return updated;
    },
    async duplicate(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing campaign not found.");
      return this.create(tenantId, {
        ...existing,
        approvalStatus: "draft",
        approvedAt: null,
        approvedBy: null,
        name: `${existing.name} copy`,
        status: "draft"
      });
    },
    async approve(tenantId, id, approvedBy) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing campaign not found.");
      const updated = {
        ...existing,
        approvalStatus: "approved" as const,
        approvedAt: nowIso(),
        approvedBy,
        status: "approved" as const,
        updatedAt: nowIso()
      };
      await db.marketingCampaigns.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "marketing_campaign.approved",
          entityId: id,
          entityType: "marketing_campaign",
          title: `Marketing campaign approved: ${existing.name}`
        });
      }
      return updated;
    },
    async markExported(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing campaign not found.");
      const updated = { ...existing, status: "export_ready" as const, updatedAt: nowIso() };
      await db.marketingCampaigns.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "marketing_campaign.exported",
          entityId: id,
          entityType: "marketing_campaign",
          title: `Marketing campaign exported: ${existing.name}`
        });
      }
      return updated;
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing campaign not found.");
      const updated = { ...existing, ...createArchivePatch(input), status: "archived" as const, updatedAt: nowIso() };
      await db.marketingCampaigns.put(updated);
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing campaign not found.");
      const updated = { ...existing, ...createRestorePatch(), status: "draft" as const, updatedAt: nowIso() };
      await db.marketingCampaigns.put(updated);
      return updated;
    }
  };
}

export function createCampaignContentVariantRepository(
  db: ForgeOSDatabase
): CampaignContentVariantRepository {
  return {
    async listForCampaign(tenantId, campaignId) {
      const rows = await db.campaignContentVariants
        .where("[tenantId+campaignId]")
        .equals([tenantId, campaignId])
        .toArray();
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getById(tenantId, id) {
      const row = await db.campaignContentVariants.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const variant: CampaignContentVariant = {
        ...input,
        id: createRecordId("mcopy"),
        tenantId,
        generatedAt: input.generatedAt ?? timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.campaignContentVariants.put(variant);
      return variant;
    },
    async update(tenantId, id, input) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Campaign content variant not found.");
      const updated = {
        ...existing,
        ...input,
        approvalStatus:
          existing.approvalStatus === "approved" ? ("pending_review" as const) : input.approvalStatus ?? existing.approvalStatus,
        userEdited: input.userEdited ?? true,
        updatedAt: nowIso()
      };
      await db.campaignContentVariants.put(updated);
      return updated;
    },
    async approve(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Campaign content variant not found.");
      const updated = { ...existing, approvalStatus: "approved" as const, updatedAt: nowIso() };
      await db.campaignContentVariants.put(updated);
      return updated;
    },
    async reject(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Campaign content variant not found.");
      const updated = { ...existing, approvalStatus: "rejected" as const, selected: false, updatedAt: nowIso() };
      await db.campaignContentVariants.put(updated);
      return updated;
    },
    async select(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Campaign content variant not found.");
      const rows = await this.listForCampaign(tenantId, existing.campaignId);
      for (const row of rows) {
        await db.campaignContentVariants.put({
          ...row,
          selected: row.id === id,
          updatedAt: nowIso()
        });
      }
      return { ...existing, selected: true, updatedAt: nowIso() };
    }
  };
}

export function createMarketingAudienceRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): MarketingAudienceRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.marketingAudiences.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
    },
    async getById(tenantId, id) {
      const row = await db.marketingAudiences.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const audience: MarketingAudience = {
        ...input,
        ...DEFAULT_ARCHIVABLE,
        id: createRecordId("maud"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.marketingAudiences.put(audience);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "marketing_audience.created",
          entityId: audience.id,
          entityType: "marketing_audience",
          title: `Marketing audience created: ${audience.name}`
        });
      }
      return audience;
    },
    async update(tenantId, id, input) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing audience not found.");
      const updated = { ...existing, ...input, id, tenantId, createdAt: existing.createdAt, updatedAt: nowIso() };
      await db.marketingAudiences.put(updated);
      return updated;
    },
    async duplicate(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing audience not found.");
      return this.create(tenantId, { ...existing, active: true, name: `${existing.name} copy` });
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing audience not found.");
      const updated = { ...existing, ...createArchivePatch(input), updatedAt: nowIso() };
      await db.marketingAudiences.put(updated);
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Marketing audience not found.");
      const updated = { ...existing, ...createRestorePatch(), updatedAt: nowIso() };
      await db.marketingAudiences.put(updated);
      return updated;
    }
  };
}

export function createAdvertisingAccountRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): AdvertisingAccountRepository {
  return {
    async list(tenantId) {
      return db.advertisingAccounts.where("tenantId").equals(tenantId).toArray();
    },
    async getByProvider(tenantId, provider) {
      const rows = await db.advertisingAccounts
        .where("[tenantId+provider]")
        .equals([tenantId, provider])
        .toArray();
      return rows[0] ?? null;
    },
    async upsert(tenantId, input) {
      const existing = await this.getByProvider(tenantId, input.provider);
      if (existing) return this.update(tenantId, existing.id, input);
      const timestamp = nowIso();
      const account: AdvertisingAccount = {
        ...input,
        id: createRecordId("adacct"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.advertisingAccounts.put(account);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "advertising_account.configured",
          entityId: account.id,
          entityType: "advertising_account",
          title: `Advertising account status saved: ${account.provider}`
        });
      }
      return account;
    },
    async update(tenantId, id, input) {
      const existing = await db.advertisingAccounts.get(id);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Advertising account not found.");
      }
      const updated = { ...existing, ...input, id, tenantId, createdAt: existing.createdAt, updatedAt: nowIso() };
      await db.advertisingAccounts.put(updated);
      return updated;
    }
  };
}

export function createAdvertisingCampaignMappingRepository(
  db: ForgeOSDatabase
): AdvertisingCampaignMappingRepository {
  return {
    async list(tenantId) {
      return db.advertisingCampaignMappings.where("tenantId").equals(tenantId).toArray();
    },
    async listForCampaign(tenantId, campaignId) {
      const rows = await db.advertisingCampaignMappings
        .where("[tenantId+marketingCampaignId]")
        .equals([tenantId, campaignId])
        .toArray();
      return rows;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const mapping: AdvertisingCampaignMapping = {
        ...input,
        id: createRecordId("admap"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.advertisingCampaignMappings.put(mapping);
      return mapping;
    }
  };
}

export function createVideoProjectRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): VideoProjectRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.videoProjects.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
    },
    async getById(tenantId, id) {
      const row = await db.videoProjects.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const project: VideoProject = {
        ...input,
        ...DEFAULT_ARCHIVABLE,
        id: createRecordId("video"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.videoProjects.put(project);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "video_project.created",
          entityId: project.id,
          entityType: "video_project",
          title: `Video project created: ${project.title}`
        });
      }
      return project;
    },
    async update(tenantId, id, input) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Video project not found.");
      const updated = { ...existing, ...input, id, tenantId, createdAt: existing.createdAt, updatedAt: nowIso() };
      await db.videoProjects.put(updated);
      if (activities && input.storyboard) {
        await recordActivity(activities, tenantId, {
          action: "video_storyboard.generated",
          entityId: id,
          entityType: "video_project",
          title: `Video storyboard updated: ${updated.title}`
        });
      }
      return updated;
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Video project not found.");
      const updated = { ...existing, ...createArchivePatch(input), status: "archived" as const, updatedAt: nowIso() };
      await db.videoProjects.put(updated);
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Video project not found.");
      const updated = { ...existing, ...createRestorePatch(), status: "storyboard" as const, updatedAt: nowIso() };
      await db.videoProjects.put(updated);
      return updated;
    }
  };
}
