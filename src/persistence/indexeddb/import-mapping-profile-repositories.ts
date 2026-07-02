import { createRecordId } from "@/domain/ids";
import type {
  CreateImportMappingProfileInput,
  ImportMappingProfile
} from "@/domain/import-types";
import type { ForgeOSDatabase } from "@/persistence/db";
import { PersistenceError } from "@/persistence/interfaces";
import {
  BUILTIN_IMPORT_MAPPING_PROFILES,
  DEFAULT_NORMALIZATION_OPTIONS
} from "@/features/leadops/import-mapping-profiles";

function nowIso(): string {
  return new Date().toISOString();
}

export interface ImportMappingProfileRepository {
  list(tenantId: string): Promise<ImportMappingProfile[]>;
  getById(tenantId: string, profileId: string): Promise<ImportMappingProfile | null>;
  create(tenantId: string, input: CreateImportMappingProfileInput): Promise<ImportMappingProfile>;
  update(
    tenantId: string,
    profileId: string,
    patch: Partial<CreateImportMappingProfileInput>
  ): Promise<ImportMappingProfile>;
  delete(tenantId: string, profileId: string): Promise<void>;
  ensureBuiltins(tenantId: string): Promise<void>;
}

export function createImportMappingProfileRepository(
  db: ForgeOSDatabase
): ImportMappingProfileRepository {
  return {
    async list(tenantId) {
      return db.importMappingProfiles.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, profileId) {
      const profile = await db.importMappingProfiles.get(profileId);
      if (!profile || profile.tenantId !== tenantId) return null;
      return profile;
    },
    async create(tenantId, input) {
      const timestamp = nowIso();
      const profile: ImportMappingProfile = {
        id: createRecordId("imp"),
        tenantId,
        ...input,
        normalizationOptions: input.normalizationOptions ?? DEFAULT_NORMALIZATION_OPTIONS,
        ignoredColumns: input.ignoredColumns ?? [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.importMappingProfiles.put(profile);
      return profile;
    },
    async update(tenantId, profileId, patch) {
      const existing = await db.importMappingProfiles.get(profileId);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Import mapping profile not found.");
      }
      const updated: ImportMappingProfile = {
        ...existing,
        ...patch,
        id: existing.id,
        tenantId: existing.tenantId,
        updatedAt: nowIso()
      };
      await db.importMappingProfiles.put(updated);
      return updated;
    },
    async delete(tenantId, profileId) {
      const existing = await db.importMappingProfiles.get(profileId);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Import mapping profile not found.");
      }
      await db.importMappingProfiles.delete(profileId);
    },
    async ensureBuiltins(tenantId) {
      const existing = await db.importMappingProfiles.where("tenantId").equals(tenantId).toArray();
      const labels = new Set(existing.map((profile) => profile.label));
      for (const builtin of BUILTIN_IMPORT_MAPPING_PROFILES) {
        if (labels.has(builtin.label)) continue;
        await this.create(tenantId, {
          label: builtin.label,
          sourceLabel: builtin.sourceLabel,
          headerMappings: builtin.headerMappings,
          ignoredColumns: builtin.ignoredColumns ?? [],
          defaultCategory: builtin.defaultCategory,
          defaultCountry: builtin.defaultCountry,
          defaultSource: builtin.defaultSource,
          normalizationOptions: DEFAULT_NORMALIZATION_OPTIONS
        });
      }
    }
  };
}

export async function listPendingDuplicateReviewRows(
  db: ForgeOSDatabase,
  tenantId: string
): Promise<Array<{ batchId: string; filename: string; row: import("@/domain/import-types").ImportRow }>> {
  const batches = await db.importBatches.where("tenantId").equals(tenantId).toArray();
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const rows = await db.importRows
    .where("tenantId")
    .equals(tenantId)
    .filter((row) => row.status === "possible_duplicate" && row.proposedAction === "review")
    .toArray();
  return rows
    .map((row) => ({
      batchId: row.importBatchId,
      filename: batchById.get(row.importBatchId)?.filename ?? "unknown",
      row
    }))
    .sort((a, b) => b.row.createdAt.localeCompare(a.row.createdAt));
}
