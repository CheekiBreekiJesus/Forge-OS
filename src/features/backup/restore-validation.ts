import type { EmailSuppression } from "@/domain/suppression-types";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { OutreachProviderEvent, OutreachSendAttempt } from "@/domain/email-delivery-types";
import type { ImportBatch, ImportRow, LeadContact } from "@/domain/import-types";
import type { ForgeOSBackup } from "@/features/backup/service";

export type BackupRestoreReport = {
  valid: boolean;
  orphanedCampaignRecipients: number;
  orphanedSuppressions: number;
  orphanedLeadContacts: number;
  orphanedSendAttempts: number;
  orphanedProviderEvents: number;
  warnings: string[];
};

export function validateBackupRestoreIntegrity(backup: ForgeOSBackup): BackupRestoreReport {
  const warnings: string[] = [];
  const leadIds = new Set(backup.tables.leads.map((row) => row.id));
  const campaignIds = new Set(backup.tables.campaigns.map((row) => row.id));
  const recipients = backup.tables.campaignRecipients ?? [];
  const suppressions = backup.tables.emailSuppressions ?? [];
  const contacts = backup.tables.leadContacts ?? [];
  const attempts = backup.tables.outreachSendAttempts ?? [];
  const events = backup.tables.outreachProviderEvents ?? [];

  const orphanedCampaignRecipients = recipients.filter(
    (row) => !leadIds.has(row.leadId) || !campaignIds.has(row.campaignId)
  ).length;
  const orphanedSuppressions = suppressions.filter(
    (row) => row.leadId != null && !leadIds.has(row.leadId)
  ).length;
  const orphanedLeadContacts = contacts.filter((row) => !leadIds.has(row.leadId)).length;
  const recipientIds = new Set(recipients.map((row) => row.id));
  const orphanedSendAttempts = attempts.filter(
    (row) => !leadIds.has(row.leadId) || !campaignIds.has(row.campaignId) || !recipientIds.has(row.campaignRecipientId)
  ).length;
  const attemptIds = new Set(attempts.map((row) => row.id));
  const orphanedProviderEvents = events.filter(
    (row) =>
      (row.leadId != null && !leadIds.has(row.leadId)) ||
      (row.campaignId != null && !campaignIds.has(row.campaignId)) ||
      (row.campaignRecipientId != null && !recipientIds.has(row.campaignRecipientId)) ||
      (row.sendAttemptId != null && !attemptIds.has(row.sendAttemptId))
  ).length;

  if (orphanedCampaignRecipients > 0) {
    warnings.push(`${orphanedCampaignRecipients} campaign recipient snapshot(s) reference missing lead or campaign records.`);
  }
  if (orphanedSuppressions > 0) {
    warnings.push(`${orphanedSuppressions} suppression record(s) reference missing lead records.`);
  }
  if (orphanedLeadContacts > 0) {
    warnings.push(`${orphanedLeadContacts} lead contact record(s) reference missing lead records.`);
  }
  if (orphanedSendAttempts > 0) {
    warnings.push(`${orphanedSendAttempts} outreach send attempt(s) reference missing lead, campaign, or recipient records.`);
  }
  if (orphanedProviderEvents > 0) {
    warnings.push(`${orphanedProviderEvents} provider event(s) reference missing outreach records.`);
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
    orphanedSendAttempts,
    orphanedProviderEvents,
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
      emailSuppressions: backup.tables.emailSuppressions ?? [],
      outreachSendAttempts: backup.tables.outreachSendAttempts ?? [],
      outreachProviderEvents: backup.tables.outreachProviderEvents ?? []
    }
  };
}

export type {
  ImportBatch,
  ImportRow,
  LeadContact,
  CampaignRecipient,
  EmailSuppression,
  OutreachProviderEvent,
  OutreachSendAttempt
};
