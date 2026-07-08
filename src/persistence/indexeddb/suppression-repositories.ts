import type {
  CreateEmailSuppressionInput,
  EmailSuppression,
  RemoveEmailSuppressionInput
} from "@/domain/suppression-types";
import type { ForgeOSDatabase } from "@/persistence/db";
import { normalizeEmail } from "@/features/leadops/import-normalization";

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function createEmailSuppressionRepository(db: ForgeOSDatabase) {
  return {
    async list(tenantId: string): Promise<EmailSuppression[]> {
      return db.emailSuppressions.where("tenantId").equals(tenantId).toArray();
    },

    async listActive(tenantId: string): Promise<EmailSuppression[]> {
      return db.emailSuppressions
        .where("tenantId")
        .equals(tenantId)
        .filter((row) => row.active)
        .toArray();
    },

    async getById(tenantId: string, id: string): Promise<EmailSuppression | null> {
      const row = await db.emailSuppressions.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },

    async getActiveByEmail(tenantId: string, email: string): Promise<EmailSuppression | null> {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) return null;
      const rows = await db.emailSuppressions
        .where("[tenantId+normalizedEmail]")
        .equals([tenantId, normalizedEmail])
        .toArray();
      return rows.find((row) => row.active) ?? null;
    },

    async create(
      tenantId: string,
      input: CreateEmailSuppressionInput
    ): Promise<EmailSuppression> {
      const normalizedEmail = normalizeEmail(input.email);
      if (!normalizedEmail) {
        throw new Error("Cannot suppress without a valid email address.");
      }

      const existing = await this.getActiveByEmail(tenantId, normalizedEmail);
      if (existing) {
        return existing;
      }

      const timestamp = new Date().toISOString();
      const row: EmailSuppression = {
        id: createId("sup"),
        tenantId,
        normalizedEmail,
        reason: input.reason,
        source: input.source ?? "operator",
        campaignId: input.campaignId ?? null,
        leadId: input.leadId ?? null,
        contactId: input.contactId ?? null,
        notes: input.notes?.trim() ?? "",
        createdBy: input.createdBy ?? "local-user",
        createdAt: timestamp,
        removedBy: null,
        removedAt: null,
        removalReason: null,
        active: true
      };
      await db.emailSuppressions.put(row);
      return row;
    },

    async remove(
      tenantId: string,
      id: string,
      input: RemoveEmailSuppressionInput
    ): Promise<EmailSuppression> {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new Error("Suppression record not found.");
      if (!existing.active) return existing;

      const updated: EmailSuppression = {
        ...existing,
        active: false,
        removedBy: input.removedBy ?? "local-user",
        removedAt: new Date().toISOString(),
        removalReason: input.removalReason.trim()
      };
      await db.emailSuppressions.put(updated);
      return updated;
    }
  };
}

export type EmailSuppressionRepository = ReturnType<typeof createEmailSuppressionRepository>;
