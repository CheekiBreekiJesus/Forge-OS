import { createRecordId } from "@/domain/ids";
import type {
  CreateOutreachSendAttemptInput,
  OutreachSendAttempt
} from "@/domain/email-delivery-types";
import type { ForgeOSDatabase } from "@/persistence/db";
import type { DeliveryClaimResult } from "@/persistence/supabase/outreach-repositories";

export interface OutreachSendAttemptRepository {
  listForTenant(tenantId: string): Promise<OutreachSendAttempt[]>;
  listForRecipient(tenantId: string, campaignRecipientId: string): Promise<OutreachSendAttempt[]>;
  getByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<OutreachSendAttempt | null>;
  create(input: CreateOutreachSendAttemptInput): Promise<OutreachSendAttempt>;
  claim?(input: {
    tenantId: string;
    campaignId: string;
    recipientId: string;
    leadId: string;
    messageVersion: string;
    idempotencyKey: string;
    requestFingerprint: string;
    initiatedBy: string;
    destinationEmail: string;
  }): Promise<DeliveryClaimResult>;
  complete?(input: {
    tenantId: string;
    attemptId: string;
    status: OutreachSendAttempt["status"];
    providerMessageId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    recipientId: string;
    sentBy: string;
    idempotencyKey: string;
  }): Promise<void>;
}

export function createOutreachSendAttemptRepository(
  db: ForgeOSDatabase
): OutreachSendAttemptRepository {
  return {
    async listForTenant(tenantId) {
      return db.outreachSendAttempts.where("tenantId").equals(tenantId).toArray();
    },
    async listForRecipient(tenantId, campaignRecipientId) {
      return db.outreachSendAttempts
        .where("[tenantId+campaignRecipientId]")
        .equals([tenantId, campaignRecipientId])
        .toArray();
    },
    async getByIdempotencyKey(tenantId, idempotencyKey) {
      const rows = await db.outreachSendAttempts
        .where("[tenantId+idempotencyKey]")
        .equals([tenantId, idempotencyKey])
        .toArray();
      return rows[0] ?? null;
    },
    async create(input) {
      const row: OutreachSendAttempt = {
        ...input,
        id: createRecordId("osa")
      };
      await db.outreachSendAttempts.put(row);
      return row;
    }
  };
}
