import { createRecordId } from "@/domain/ids";
import type {
  OutreachTestProfile,
  UpsertOutreachTestProfileInput
} from "@/domain/outreach-test-profile-types";
import {
  DEFAULT_OUTREACH_LOGO_PATH,
  DEFAULT_OUTREACH_SHOWCASE_PATH
} from "@/features/email-composition/outreach-branding-config";
import type { ForgeOSDatabase } from "@/persistence/db";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeOutreachTestProfile(row: OutreachTestProfile): OutreachTestProfile {
  return {
    ...row,
    companyLogoReference: row.companyLogoReference || DEFAULT_OUTREACH_LOGO_PATH,
    footerCtaLabel: row.footerCtaLabel || "",
    footerCtaUrl: row.footerCtaUrl || row.companyWebsite || "",
    showcaseImageReference: row.showcaseImageReference || DEFAULT_OUTREACH_SHOWCASE_PATH
  };
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
      const row = rows[0];
      return row ? normalizeOutreachTestProfile(row) : null;
    },
    async upsert(tenantId, input) {
      const existing = await this.getForTenant(tenantId);
      const timestamp = nowIso();
      const profile: OutreachTestProfile = {
        campaignLanguage: input.campaignLanguage,
        companyLogoReference: (input.companyLogoReference ?? existing?.companyLogoReference ?? DEFAULT_OUTREACH_LOGO_PATH).trim(),
        companyName: input.companyName.trim(),
        companyWebsite: input.companyWebsite.trim(),
        createdAt: existing?.createdAt ?? timestamp,
        defaultOptOutLine: input.defaultOptOutLine.trim(),
        defaultProductFocus: input.defaultProductFocus.trim(),
        defaultSignature: input.defaultSignature.trim(),
        defaultTestRecipient: input.defaultTestRecipient.trim().toLowerCase(),
        footerCtaLabel: (input.footerCtaLabel ?? existing?.footerCtaLabel ?? "").trim(),
        footerCtaUrl: (input.footerCtaUrl ?? existing?.footerCtaUrl ?? input.companyWebsite).trim(),
        id: existing?.id ?? createRecordId("otprof"),
        lastEmailTestResult: input.lastEmailTestResult ?? existing?.lastEmailTestResult ?? null,
        replyToEmail: input.replyToEmail.trim().toLowerCase(),
        senderDisplayName: input.senderDisplayName.trim(),
        senderEmail: input.senderEmail.trim().toLowerCase(),
        showcaseImageReference:
          (input.showcaseImageReference ?? existing?.showcaseImageReference ?? DEFAULT_OUTREACH_SHOWCASE_PATH).trim(),
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
