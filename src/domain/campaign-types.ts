import type { LeadOpsFilters } from "@/features/leadops/types";

export type CampaignStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "in_progress"
  | "completed"
  | "paused"
  | "cancelled"
  | "active";

export type CampaignDeliveryMode = "simulation" | "provider_handoff";

export type CampaignRecipientDeliveryMode = "manual_external" | "simulation";

export type CampaignExternalClient = "gmail" | "outlook" | "default";

export type SegmentDefinitionMode = "filters" | "selected_contacts" | "selected_organizations";

export type SegmentDefinition = {
  version: 1;
  mode: SegmentDefinitionMode;
  searchQuery?: string;
  filters?: LeadOpsFilters;
  selectedLeadIds?: string[];
  selectedContactIds?: string[];
};

export type CampaignDraftStatus =
  | "PENDING"
  | "DRAFTED"
  | "NEEDS_REVIEW"
  | "APPROVED"
  | "EXCLUDED"
  | "OPENED_EXTERNALLY"
  | "SENT_MANUALLY"
  | "DELIVERED"
  | "SOFT_BOUNCED"
  | "HARD_BOUNCED"
  | "COMPLAINED"
  | "UNSUBSCRIBED"
  | "DELIVERY_FAILED"
  | "DEFERRED"
  | "SKIPPED"
  | "SUPPRESSED";

export type CampaignDraftGenerationMethod =
  | "deterministic_template"
  | "ai_assisted"
  | "manual";

export type OutreachCampaign = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  language: string;
  status: CampaignStatus;
  segmentDefinition: SegmentDefinition | null;
  recipientSnapshotCreatedAt: string | null;
  recipientSnapshotCount: number;
  subjectTemplate: string;
  plainTextTemplate: string;
  htmlTemplate: string;
  templateVersion: number;
  templateUpdatedAt: string | null;
  fromName: string;
  senderProfileId: string | null;
  replyTo: string;
  deliveryMode: CampaignDeliveryMode;
  createdBy: string;
  sentCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateOutreachCampaignInput = {
  name: string;
  description?: string;
  language?: string;
  segmentDefinition: SegmentDefinition;
  fromName?: string;
  senderProfileId?: string | null;
  replyTo?: string;
  deliveryMode?: CampaignDeliveryMode;
  createdBy?: string;
};

export type UpdateCampaignTemplateInput = {
  subjectTemplate: string;
  plainTextTemplate: string;
  htmlTemplate?: string;
  language?: string;
};

export type CampaignRecipientStatus = "included" | "excluded";

export type CampaignRecipient = {
  id: string;
  tenantId: string;
  campaignId: string;
  leadId: string;
  contactId: string | null;
  snapshotEmail: string;
  snapshotCompanyName: string;
  snapshotContactName: string;
  snapshotCategory: string;
  snapshotRegion: string;
  snapshotWebsite: string;
  inclusionReason: string;
  status: CampaignRecipientStatus;
  personalizedSubject: string;
  personalizedPlainText: string;
  personalizedHtml: string;
  draftStatus: CampaignDraftStatus;
  generatedAt: string | null;
  generationMethod: CampaignDraftGenerationMethod | null;
  templateVersion: number | null;
  userEdited: boolean;
  draftUpdatedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvalContentHash: string | null;
  approvalInvalidatedAt: string | null;
  approvalInvalidationReason: string | null;
  openedExternallyAt: string | null;
  externalClient: CampaignExternalClient | null;
  sentAt: string | null;
  sentBy: string | null;
  recipientDeliveryMode: CampaignRecipientDeliveryMode | null;
  operatorNote: string;
  simulatedAt: string | null;
  sendIdempotencyKey: string | null;
  createdAt: string;
};

export type CreateCampaignRecipientInput = {
  campaignId: string;
  leadId: string;
  contactId: string | null;
  snapshotEmail: string;
  snapshotCompanyName: string;
  snapshotContactName: string;
  snapshotCategory: string;
  snapshotRegion: string;
  snapshotWebsite?: string;
  inclusionReason: string;
  status: CampaignRecipientStatus;
};

export type UpdateCampaignRecipientDraftInput = {
  snapshotEmail?: string;
  snapshotCompanyName?: string;
  snapshotContactName?: string;
  personalizedSubject?: string;
  personalizedPlainText?: string;
  personalizedHtml?: string;
  draftStatus?: CampaignDraftStatus;
  generationMethod?: CampaignDraftGenerationMethod;
  templateVersion?: number | null;
  userEdited?: boolean;
  generatedAt?: string | null;
  draftUpdatedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalContentHash?: string | null;
  approvalInvalidatedAt?: string | null;
  approvalInvalidationReason?: string | null;
  openedExternallyAt?: string | null;
  externalClient?: CampaignExternalClient | null;
  sentAt?: string | null;
  sentBy?: string | null;
  recipientDeliveryMode?: CampaignRecipientDeliveryMode | null;
  operatorNote?: string;
  simulatedAt?: string | null;
  sendIdempotencyKey?: string | null;
  status?: CampaignRecipientStatus;
};

export type RecipientRefreshDiff = {
  added: number;
  removed: number;
  newlySuppressed: number;
  newlyInvalid: number;
};

export type CampaignProgressCounts = {
  total: number;
  drafted: number;
  needsReview: number;
  approved: number;
  openedExternally: number;
  manuallySent: number;
  excluded: number;
  suppressed: number;
  skipped: number;
  pending: number;
};
