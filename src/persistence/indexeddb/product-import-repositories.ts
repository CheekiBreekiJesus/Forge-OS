import { createRecordId } from "@/domain/ids";
import type {
  ProductImportBatch,
  ProductImportRow,
  ProductMappingProfile,
  ProductSourceReference
} from "@/domain/product-import-types";
import type { ForgeOSDatabase } from "@/persistence/db";
import { PersistenceError } from "@/persistence/interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export type CreateProductImportBatchInput = Omit<
  ProductImportBatch,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export type CreateProductImportRowInput = Omit<
  ProductImportRow,
  "id" | "tenantId" | "createdAt" | "updatedAt"
> & { id?: string };

export type CreateProductMappingProfileInput = Omit<
  ProductMappingProfile,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export type CreateProductSourceReferenceInput = Omit<
  ProductSourceReference,
  "id" | "tenantId" | "createdAt"
>;

export function createProductImportBatchRepository(db: ForgeOSDatabase) {
  return {
    async list(tenantId: string): Promise<ProductImportBatch[]> {
      const rows = await db.productImportBatches.where("tenantId").equals(tenantId).toArray();
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getById(tenantId: string, id: string): Promise<ProductImportBatch | null> {
      const row = await db.productImportBatches.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getByFingerprint(tenantId: string, fingerprint: string): Promise<ProductImportBatch | null> {
      const rows = await db.productImportBatches
        .where("[tenantId+fileFingerprint]")
        .equals([tenantId, fingerprint])
        .toArray();
      return rows[0] ?? null;
    },
    async create(tenantId: string, input: CreateProductImportBatchInput): Promise<ProductImportBatch> {
      const timestamp = nowIso();
      const batch: ProductImportBatch = {
        ...input,
        createdAt: timestamp,
        id: createRecordId("pimpbat"),
        tenantId,
        updatedAt: timestamp
      };
      await db.productImportBatches.put(batch);
      return batch;
    },
    async update(
      tenantId: string,
      id: string,
      patch: Partial<ProductImportBatch>
    ): Promise<ProductImportBatch> {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Import batch not found.");
      const updated: ProductImportBatch = { ...existing, ...patch, updatedAt: nowIso() };
      await db.productImportBatches.put(updated);
      return updated;
    }
  };
}

export function createProductImportRowRepository(db: ForgeOSDatabase) {
  return {
    async listByBatch(tenantId: string, batchId: string): Promise<ProductImportRow[]> {
      const rows = await db.productImportRows
        .where("[tenantId+batchId]")
        .equals([tenantId, batchId])
        .toArray();
      return rows.sort((a, b) => a.sourceRowNumber - b.sourceRowNumber);
    },
    async getById(tenantId: string, id: string): Promise<ProductImportRow | null> {
      const row = await db.productImportRows.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async createMany(tenantId: string, inputs: CreateProductImportRowInput[]): Promise<ProductImportRow[]> {
      const timestamp = nowIso();
      const rows: ProductImportRow[] = inputs.map((input) => ({
        ...input,
        createdAt: timestamp,
        id: input.id ?? createRecordId("pimprow"),
        tenantId,
        updatedAt: timestamp
      }));
      await db.productImportRows.bulkPut(rows);
      return rows;
    },
    async update(tenantId: string, id: string, patch: Partial<ProductImportRow>): Promise<ProductImportRow> {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Import row not found.");
      const updated: ProductImportRow = { ...existing, ...patch, updatedAt: nowIso() };
      await db.productImportRows.put(updated);
      return updated;
    },
    async deleteByBatch(tenantId: string, batchId: string): Promise<void> {
      await db.productImportRows.where("[tenantId+batchId]").equals([tenantId, batchId]).delete();
    }
  };
}

export function createProductMappingProfileRepository(db: ForgeOSDatabase) {
  return {
    async list(tenantId: string): Promise<ProductMappingProfile[]> {
      return db.productMappingProfiles.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId: string, id: string): Promise<ProductMappingProfile | null> {
      const row = await db.productMappingProfiles.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(
      tenantId: string,
      input: CreateProductMappingProfileInput
    ): Promise<ProductMappingProfile> {
      const timestamp = nowIso();
      const profile: ProductMappingProfile = {
        ...input,
        createdAt: timestamp,
        id: createRecordId("pimpmap"),
        tenantId,
        updatedAt: timestamp
      };
      await db.productMappingProfiles.put(profile);
      return profile;
    },
    async update(
      tenantId: string,
      id: string,
      patch: Partial<ProductMappingProfile>
    ): Promise<ProductMappingProfile> {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Mapping profile not found.");
      const updated: ProductMappingProfile = { ...existing, ...patch, updatedAt: nowIso() };
      await db.productMappingProfiles.put(updated);
      return updated;
    }
  };
}

export function createProductSourceReferenceRepository(db: ForgeOSDatabase) {
  return {
    async listByProduct(tenantId: string, productId: string): Promise<ProductSourceReference[]> {
      return db.productSourceReferences
        .where("[tenantId+productId]")
        .equals([tenantId, productId])
        .toArray();
    },
    async listByBatch(tenantId: string, batchId: string): Promise<ProductSourceReference[]> {
      return db.productSourceReferences
        .where("[tenantId+importBatchId]")
        .equals([tenantId, batchId])
        .toArray();
    },
    async create(
      tenantId: string,
      input: CreateProductSourceReferenceInput
    ): Promise<ProductSourceReference> {
      const timestamp = nowIso();
      const reference: ProductSourceReference = {
        ...input,
        createdAt: timestamp,
        id: createRecordId("pimpsrc"),
        tenantId
      };
      await db.productSourceReferences.put(reference);
      return reference;
    }
  };
}

export type ProductImportRepositoryBundle = {
  batches: ReturnType<typeof createProductImportBatchRepository>;
  rows: ReturnType<typeof createProductImportRowRepository>;
  mappingProfiles: ReturnType<typeof createProductMappingProfileRepository>;
  sourceReferences: ReturnType<typeof createProductSourceReferenceRepository>;
};

export function createProductImportRepositoryBundle(db: ForgeOSDatabase): ProductImportRepositoryBundle {
  return {
    batches: createProductImportBatchRepository(db),
    mappingProfiles: createProductMappingProfileRepository(db),
    rows: createProductImportRowRepository(db),
    sourceReferences: createProductSourceReferenceRepository(db)
  };
}
