import type { CampaignRecipient } from "@/domain/campaign-types";

export function buildTestSendIdempotencyKey(
  campaignId: string,
  recipient: Pick<CampaignRecipient, "id" | "approvalContentHash">,
  testRecipientEmail: string
): string {
  return [
    "test",
    campaignId,
    recipient.id,
    recipient.approvalContentHash ?? "unapproved",
    testRecipientEmail.trim().toLowerCase()
  ].join(":");
}

export const PROTECTED_TEST_SEND_CONFIRMATION = "SEND TEST" as const;
