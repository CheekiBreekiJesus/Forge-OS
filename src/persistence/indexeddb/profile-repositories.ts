import { createRecordId } from "@/domain/ids";
import type {
  CompanyProfile,
  CreateCompanyProfileInput,
  CreateLocalAssetInput,
  CreateSenderIdentityInput,
  CreateUserProfileInput,
  LocalAsset,
  SenderIdentity,
  UpdateCompanyProfileInput,
  UpdateSenderIdentityInput,
  UpdateUserProfileInput,
  UserProfile
} from "@/domain/profile-types";
import type { ForgeOSDatabase } from "../db";
import { PersistenceError, type CompanyProfileRepository, type LocalAssetRepository, type SenderIdentityRepository, type UserProfileRepository } from "../interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export function createCompanyProfileRepository(db: ForgeOSDatabase): CompanyProfileRepository {
  return {
    async getForTenant(tenantId) {
      const rows = await db.companyProfiles.where("tenantId").equals(tenantId).toArray();
      return rows[0] ?? null;
    },
    async getById(tenantId, id) {
      const row = await db.companyProfiles.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input: CreateCompanyProfileInput) {
      const existing = await this.getForTenant(tenantId);
      if (existing) {
        throw new PersistenceError("duplicate", "Company profile already exists for tenant.");
      }
      const timestamp = nowIso();
      const profile: CompanyProfile = {
        ...input,
        id: createRecordId("cprof"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.companyProfiles.put(profile);
      return profile;
    },
    async update(tenantId, id, input: UpdateCompanyProfileInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Company profile not found.");
      const updated: CompanyProfile = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.companyProfiles.put(updated);
      return updated;
    },
    async ensureDefault(tenantId, defaults: CreateCompanyProfileInput) {
      const existing = await this.getForTenant(tenantId);
      if (existing) return existing;
      return this.create(tenantId, defaults);
    }
  };
}

export function createUserProfileRepository(db: ForgeOSDatabase): UserProfileRepository {
  return {
    async list(tenantId) {
      return db.userProfiles.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, id) {
      const row = await db.userProfiles.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getCurrent(tenantId) {
      const rows = await db.userProfiles.where("tenantId").equals(tenantId).toArray();
      return rows.find((r) => r.active && !r.isLocalPreview) ?? rows.find((r) => r.active) ?? rows[0] ?? null;
    },
    async create(tenantId, input: CreateUserProfileInput) {
      const timestamp = nowIso();
      const profile: UserProfile = {
        ...input,
        id: createRecordId("uprof"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.userProfiles.put(profile);
      return profile;
    },
    async update(tenantId, id, input: UpdateUserProfileInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "User profile not found.");
      const updated: UserProfile = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        isLocalPreview: existing.isLocalPreview,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.userProfiles.put(updated);
      return updated;
    },
    async ensureDefault(tenantId, defaults: CreateUserProfileInput) {
      const current = await this.getCurrent(tenantId);
      if (current) return current;
      return this.create(tenantId, defaults);
    }
  };
}

export function createSenderIdentityRepository(db: ForgeOSDatabase): SenderIdentityRepository {
  return {
    async list(tenantId) {
      return db.senderIdentities
        .where("tenantId")
        .equals(tenantId)
        .filter((s) => !s.archivedAt)
        .toArray();
    },
    async listAll(tenantId) {
      return db.senderIdentities.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, id) {
      const row = await db.senderIdentities.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getDefault(tenantId) {
      const all = await this.list(tenantId);
      return all.find((s) => s.isDefault) ?? all[0] ?? null;
    },
    async create(tenantId, input: CreateSenderIdentityInput) {
      const timestamp = nowIso();
      if (input.isDefault) {
        await clearDefaultSender(db, tenantId);
      }
      const identity: SenderIdentity = {
        ...input,
        archivedAt: null,
        id: createRecordId("sender"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.senderIdentities.put(identity);
      return identity;
    },
    async update(tenantId, id, input: UpdateSenderIdentityInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Sender identity not found.");
      if (input.isDefault) {
        await clearDefaultSender(db, tenantId, id);
      }
      const updated: SenderIdentity = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        userProfileId: existing.userProfileId,
        companyProfileId: existing.companyProfileId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.senderIdentities.put(updated);
      return updated;
    },
    async duplicate(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Sender identity not found.");
      return this.create(tenantId, {
        active: true,
        companyProfileId: existing.companyProfileId,
        defaultLanguage: existing.defaultLanguage,
        displayName: `${existing.displayName} (copy)`,
        fromEmail: existing.fromEmail,
        isDefault: false,
        jobTitle: existing.jobTitle,
        phone: existing.phone,
        replyToEmail: existing.replyToEmail,
        signatureHtml: existing.signatureHtml,
        signatureText: existing.signatureText,
        userProfileId: existing.userProfileId
      });
    },
    async archive(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Sender identity not found.");
      const updated: SenderIdentity = {
        ...existing,
        active: false,
        archivedAt: nowIso(),
        isDefault: false,
        updatedAt: nowIso()
      };
      await db.senderIdentities.put(updated);
      return updated;
    },
    async setDefault(tenantId, id) {
      await clearDefaultSender(db, tenantId, id);
      return this.update(tenantId, id, { isDefault: true, active: true });
    },
    async ensureDefault(tenantId, defaults: CreateSenderIdentityInput) {
      const existing = await this.getDefault(tenantId);
      if (existing) return existing;
      return this.create(tenantId, { ...defaults, isDefault: true });
    }
  };
}

async function clearDefaultSender(db: ForgeOSDatabase, tenantId: string, exceptId?: string) {
  const rows = await db.senderIdentities.where("tenantId").equals(tenantId).toArray();
  for (const row of rows) {
    if (row.isDefault && row.id !== exceptId) {
      await db.senderIdentities.put({ ...row, isDefault: false, updatedAt: nowIso() });
    }
  }
}

export function createLocalAssetRepository(db: ForgeOSDatabase): LocalAssetRepository {
  return {
    async getById(tenantId, id) {
      const row = await db.localAssets.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async list(tenantId) {
      return db.localAssets.where("tenantId").equals(tenantId).toArray();
    },
    async create(tenantId, input: CreateLocalAssetInput) {
      const asset: LocalAsset = {
        ...input,
        id: createRecordId("asset"),
        tenantId,
        createdAt: nowIso()
      };
      await db.localAssets.put(asset);
      return asset;
    },
    async delete(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Asset not found.");
      await db.localAssets.delete(id);
    }
  };
}
