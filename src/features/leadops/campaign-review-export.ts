import type { CampaignRecipient } from "@/domain/campaign-types";
import { buildCsvRow } from "@/features/export/csv-export-safety";

export function buildCampaignReviewExportCsv(recipients: CampaignRecipient[]): string {
  const header = buildCsvRow([
    "campaignId",
    "recipientId",
    "companyName",
    "contactName",
    "email",
    "draftStatus",
    "approvedAt",
    "openedExternallyAt",
    "sentAt",
    "deliveryMode"
  ]);
  const rows = recipients.map((recipient) =>
    buildCsvRow([
      recipient.campaignId,
      recipient.id,
      recipient.snapshotCompanyName,
      recipient.snapshotContactName,
      recipient.snapshotEmail,
      recipient.draftStatus,
      recipient.approvedAt,
      recipient.openedExternallyAt,
      recipient.sentAt,
      recipient.recipientDeliveryMode
    ])
  );
  return [header, ...rows].join("\n");
}
