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
    snapshotWebsite: ""
  };
}
