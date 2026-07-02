import { createRecordId } from "@/domain/ids";
import type {
  CreateOutreachProviderEventInput,
  OutreachProviderEvent
} from "@/domain/email-delivery-types";
import type { ForgeOSDatabase } from "@/persistence/db";

export interface OutreachProviderEventRepository {
  listForTenant(tenantId: string): Promise<OutreachProviderEvent[]>;
  listRecent(tenantId: string, limit?: number): Promise<OutreachProviderEvent[]>;
  getByFingerprint(tenantId: string, eventFingerprint: string): Promise<OutreachProviderEvent | null>;
  create(input: CreateOutreachProviderEventInput): Promise<OutreachProviderEvent>;
}

export function createOutreachProviderEventRepository(
  db: ForgeOSDatabase
): OutreachProviderEventRepository {
  return {
    async listForTenant(tenantId) {
      return db.outreachProviderEvents
        .where("tenantId")
        .equals(tenantId)
        .reverse()
        .sortBy("receivedAt");
    },
    async listRecent(tenantId, limit = 50) {
      const rows = await this.listForTenant(tenantId);
      return rows.slice(0, limit);
    },
    async getByFingerprint(tenantId, eventFingerprint) {
      const rows = await db.outreachProviderEvents
        .where("[tenantId+eventFingerprint]")
        .equals([tenantId, eventFingerprint])
        .toArray();
      return rows[0] ?? null;
    },
    async create(input) {
      const row: OutreachProviderEvent = {
        ...input,
        id: createRecordId("ope")
      };
      await db.outreachProviderEvents.put(row);
      return row;
    }
  };
}
