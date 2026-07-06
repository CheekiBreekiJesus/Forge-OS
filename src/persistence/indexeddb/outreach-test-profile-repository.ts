import { createRecordId } from "@/domain/ids";
import type {
  OutreachTestProfile,
  UpsertOutreachTestProfileInput
} from "@/domain/outreach-test-profile-types";
import type { ForgeOSDatabase } from "@/persistence/db";

function nowIso(): string {
  return new Date().toISOString();
}

export interface OutreachTestProfileRepository {
  getForTenant(tenantId: string): Promise<OutreachTestProfile | null>;
  upsert(tenantId: string, input: UpsertOutreachTestProfileInput): Promise<OutreachTestProfile>;
  reset(tenantId: string): Promise<void>;
}

export function createOutreachTestProfileRepository(
  db: ForgeOSDatabase
): OutreachTestProfileRepository {
  return {
    async getForTenant(tenantId) {
      const rows = await db.outreachTestProfiles.where("tenantId").equals(tenantId).toArray();
      return rows[0] ?? null;
    },
    async upsert(tenantId, input) {
      const existing = await this.getForTenant(tenantId);
      const timestamp = nowIso();
      const profile: OutreachTestProfile = {
        campaignLanguage: input.campaignLanguage,
        companyName: input.companyName.trim(),
        companyWebsite: input.companyWebsite.trim(),
        createdAt: existing?.createdAt ?? timestamp,
        defaultOptOutLine: input.defaultOptOutLine.trim(),
        defaultProductFocus: input.defaultProductFocus.trim(),
        defaultSignature: input.defaultSignature.trim(),
        defaultTestRecipient: input.defaultTestRecipient.trim().toLowerCase(),
        id: existing?.id ?? createRecordId("otprof"),
        lastEmailTestResult: input.lastEmailTestResult ?? existing?.lastEmailTestResult ?? null,
        replyToEmail: input.replyToEmail.trim().toLowerCase(),
        senderDisplayName: input.senderDisplayName.trim(),
        senderEmail: input.senderEmail.trim().toLowerCase(),
        tenantId,
        updatedAt: timestamp
      };
      await db.outreachTestProfiles.put(profile);
      return profile;
    },
    async reset(tenantId) {
      await db.outreachTestProfiles.where("tenantId").equals(tenantId).delete();
    }
  };
}
