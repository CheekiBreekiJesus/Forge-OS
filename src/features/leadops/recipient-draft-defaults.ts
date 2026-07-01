import type { CampaignRecipient } from "@/domain/campaign-types";

export function createEmptyRecipientDraftFields(): Pick<
  CampaignRecipient,
  | "personalizedSubject"
  | "personalizedPlainText"
  | "personalizedHtml"
  | "draftStatus"
  | "generatedAt"
  | "generationMethod"
  | "templateVersion"
  | "userEdited"
  | "draftUpdatedAt"
  | "snapshotWebsite"
  | "approvedAt"
  | "approvedBy"
  | "approvalContentHash"
  | "approvalInvalidatedAt"
  | "approvalInvalidationReason"
  | "openedExternallyAt"
  | "externalClient"
  | "sentAt"
  | "sentBy"
  | "recipientDeliveryMode"
  | "operatorNote"
  | "simulatedAt"
  | "sendIdempotencyKey"
> {
  return {
    personalizedSubject: "",
    personalizedPlainText: "",
    personalizedHtml: "",
    draftStatus: "PENDING",
    generatedAt: null,
    generationMethod: null,
    templateVersion: null,
    userEdited: false,
    draftUpdatedAt: null,
    snapshotWebsite: "",
    approvedAt: null,
    approvedBy: null,
    approvalContentHash: null,
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    openedExternallyAt: null,
    externalClient: null,
    sentAt: null,
    sentBy: null,
    recipientDeliveryMode: null,
    operatorNote: "",
    simulatedAt: null,
    sendIdempotencyKey: null
  };
}

export function createEmptyApprovalFields(): Pick<
  CampaignRecipient,
  | "approvedAt"
  | "approvedBy"
  | "approvalContentHash"
  | "approvalInvalidatedAt"
  | "approvalInvalidationReason"
  | "openedExternallyAt"
  | "externalClient"
  | "sentAt"
  | "sentBy"
  | "recipientDeliveryMode"
  | "operatorNote"
  | "simulatedAt"
  | "sendIdempotencyKey"
> {
  return {
    approvedAt: null,
    approvedBy: null,
    approvalContentHash: null,
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    openedExternallyAt: null,
    externalClient: null,
    sentAt: null,
    sentBy: null,
    recipientDeliveryMode: null,
    operatorNote: "",
    simulatedAt: null,
    sendIdempotencyKey: null
  };
}
