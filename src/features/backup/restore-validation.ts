import type { EmailSuppression } from "@/domain/suppression-types";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { ImportBatch, ImportRow, LeadContact } from "@/domain/import-types";
import type { ForgeOSBackup } from "@/features/backup/service";

export type BackupRestoreReport = {
  valid: boolean;
  orphanedCampaignRecipients: number;
  orphanedSuppressions: number;
  orphanedLeadContacts: number;
  warnings: string[];
};

export function validateBackupRestoreIntegrity(backup: ForgeOSBackup): BackupRestoreReport {
  const warnings: string[] = [];
  const leadIds = new Set(backup.tables.leads.map((row) => row.id));
  const campaignIds = new Set(backup.tables.campaigns.map((row) => row.id));
  const recipients = backup.tables.campaignRecipients ?? [];
  const suppressions = backup.tables.emailSuppressions ?? [];
  const contacts = backup.tables.leadContacts ?? [];

  const orphanedCampaignRecipients = recipients.filter(
    (row) => !leadIds.has(row.leadId) || !campaignIds.has(row.campaignId)
  ).length;
  const orphanedSuppressions = suppressions.filter(
    (row) => row.leadId != null && !leadIds.has(row.leadId)
  ).length;
  const orphanedLeadContacts = contacts.filter((row) => !leadIds.has(row.leadId)).length;

  if (orphanedCampaignRecipients > 0) {
    warnings.push(`${orphanedCampaignRecipients} campaign recipient snapshot(s) reference missing lead or campaign records.`);
  }
  if (orphanedSuppressions > 0) {
    warnings.push(`${orphanedSuppressions} suppression record(s) reference missing lead records.`);
  }
  if (orphanedLeadContacts > 0) {
    warnings.push(`${orphanedLeadContacts} lead contact record(s) reference missing lead records.`);
  }

  const sentRecipients = recipients.filter((row: CampaignRecipient) => row.draftStatus === "SENT_MANUALLY");
  const missingIdempotency = sentRecipients.filter((row) => !row.sendIdempotencyKey).length;
  if (missingIdempotency > 0) {
    warnings.push(`${missingIdempotency} manually sent recipient(s) are missing idempotency keys.`);
  }

  return {
    valid: warnings.length === 0,
    orphanedCampaignRecipients,
    orphanedSuppressions,
    orphanedLeadContacts,
    warnings
  };
}

export function normalizeBackupTables(backup: ForgeOSBackup): ForgeOSBackup {
  return {
    ...backup,
    tables: {
      ...backup.tables,
      importBatches: backup.tables.importBatches ?? [],
      importRows: backup.tables.importRows ?? [],
      leadContacts: backup.tables.leadContacts ?? [],
      campaignRecipients: backup.tables.campaignRecipients ?? [],
      emailSuppressions: backup.tables.emailSuppressions ?? []
    }
  };
}

export type { ImportBatch, ImportRow, LeadContact, CampaignRecipient, EmailSuppression };
