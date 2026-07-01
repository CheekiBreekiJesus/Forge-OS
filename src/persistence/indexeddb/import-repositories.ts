import { createRecordId } from "@/domain/ids";
import type {
  CreateImportBatchInput,
  CreateLeadContactInput,
  ImportBatch,
  ImportRow,
  LeadContact
} from "@/domain/import-types";
import type { ForgeOSDatabase } from "@/persistence/db";
import { DEFAULT_ARCHIVABLE, isActiveRecord } from "@/persistence/archive-utils";
import { PersistenceError } from "@/persistence/interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export interface ImportBatchRepository {
  create(tenantId: string, input: CreateImportBatchInput): Promise<ImportBatch>;
  update(tenantId: string, batchId: string, patch: Partial<ImportBatch>): Promise<ImportBatch>;
  getById(tenantId: string, batchId: string): Promise<ImportBatch | null>;
  list(tenantId: string): Promise<ImportBatch[]>;
  findCompletedByFingerprint(tenantId: string, fingerprint: string): Promise<ImportBatch | null>;
}

export interface ImportRowRepository {
  createMany(tenantId: string, rows: Omit<ImportRow, "id" | "tenantId" | "createdAt">[]): Promise<ImportRow[]>;
  listForBatch(tenantId: string, batchId: string): Promise<ImportRow[]>;
  update(tenantId: string, rowId: string, patch: Partial<ImportRow>): Promise<ImportRow>;
}

export interface LeadContactRepository {
  listForLead(tenantId: string, leadId: string): Promise<LeadContact[]>;
  list(tenantId: string): Promise<LeadContact[]>;
  getByNormalizedEmail(tenantId: string, normalizedEmail: string): Promise<LeadContact | null>;
  create(tenantId: string, input: CreateLeadContactInput): Promise<LeadContact>;
  update(
    tenantId: string,
    contactId: string,
    patch: Partial<Pick<LeadContact, "email" | "normalizedEmail" | "name" | "phone">>
  ): Promise<LeadContact>;
}

export function createImportBatchRepository(db: ForgeOSDatabase): ImportBatchRepository {
  return {
    async create(tenantId, input) {
      const timestamp = nowIso();
      const batch: ImportBatch = {
        id: createRecordId("imp"),
        tenantId,
        ...input,
        status: input.status ?? "preview",
        createdAt: timestamp,
        completedAt: null
      };
      await db.importBatches.put(batch);
      return batch;
    },
    async update(tenantId, batchId, patch) {
      const existing = await db.importBatches.get(batchId);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Import batch not found.");
      }
      const updated = { ...existing, ...patch, id: existing.id, tenantId: existing.tenantId };
      await db.importBatches.put(updated);
      return updated;
    },
    async getById(tenantId, batchId) {
      const batch = await db.importBatches.get(batchId);
      if (!batch || batch.tenantId !== tenantId) return null;
      return batch;
    },
    async list(tenantId) {
      return db.importBatches.where("tenantId").equals(tenantId).toArray();
    },
    async findCompletedByFingerprint(tenantId, fingerprint) {
      const matches = await db.importBatches
        .where("[tenantId+fileFingerprint]")
        .equals([tenantId, fingerprint])
        .toArray();
      return matches.find((batch) => batch.status === "completed") ?? null;
    }
  };
}

export function createImportRowRepository(db: ForgeOSDatabase): ImportRowRepository {
  return {
    async createMany(tenantId, rows) {
      const timestamp = nowIso();
      const records: ImportRow[] = rows.map((row) => ({
        ...row,
        id: createRecordId("imr"),
        tenantId,
        createdAt: timestamp
      }));
      await db.importRows.bulkPut(records);
      return records;
    },
    async listForBatch(tenantId, batchId) {
      const rows = await db.importRows
        .where("[tenantId+importBatchId]")
        .equals([tenantId, batchId])
        .toArray();
      return rows.sort((a, b) => a.rowIndex - b.rowIndex);
    },
    async update(tenantId, rowId, patch) {
      const existing = await db.importRows.get(rowId);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Import row not found.");
      }
      const updated = { ...existing, ...patch, id: existing.id, tenantId: existing.tenantId };
      await db.importRows.put(updated);
      return updated;
    }
  };
}

export function createLeadContactRepository(db: ForgeOSDatabase): LeadContactRepository {
  return {
    async listForLead(tenantId, leadId) {
      return db.leadContacts
        .where("[tenantId+leadId]")
        .equals([tenantId, leadId])
        .filter((contact) => isActiveRecord(contact))
        .toArray();
    },
    async list(tenantId) {
      return db.leadContacts.where("tenantId").equals(tenantId).filter((c) => isActiveRecord(c)).toArray();
    },
    async getByNormalizedEmail(tenantId, normalizedEmail) {
      if (!normalizedEmail) return null;
      const matches = await db.leadContacts
        .where("[tenantId+normalizedEmail]")
        .equals([tenantId, normalizedEmail])
        .toArray();
      return matches.find((contact) => isActiveRecord(contact)) ?? null;
    },
    async create(tenantId, input) {
      if (input.normalizedEmail) {
        const existing = await this.getByNormalizedEmail(tenantId, input.normalizedEmail);
        if (existing) {
          throw new PersistenceError("duplicate", "A contact with this email already exists.");
        }
      }
      const timestamp = nowIso();
      const contact: LeadContact = {
        id: createRecordId("lct"),
        tenantId,
        ...input,
        ...DEFAULT_ARCHIVABLE,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.leadContacts.put(contact);
      return contact;
    },
    async update(tenantId, contactId, patch) {
      const existing = await db.leadContacts.get(contactId);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Lead contact not found.");
      }
      const updated: LeadContact = {
        ...existing,
        ...patch,
        updatedAt: nowIso()
      };
      await db.leadContacts.put(updated);
      return updated;
    }
  };
}
