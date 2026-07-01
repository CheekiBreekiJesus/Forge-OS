import type { LeadOpsFilters } from "@/features/leadops/types";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type CampaignDeliveryMode = "simulation" | "provider_handoff";

export type SegmentDefinitionMode = "filters" | "selected_contacts" | "selected_organizations";

export type SegmentDefinition = {
  version: 1;
  mode: SegmentDefinitionMode;
  searchQuery?: string;
  filters?: LeadOpsFilters;
  selectedLeadIds?: string[];
  selectedContactIds?: string[];
};

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
  inclusionReason: string;
  status: CampaignRecipientStatus;
  createdAt: string;
};

export type CreateCampaignRecipientInput = Omit<
  CampaignRecipient,
  "id" | "tenantId" | "createdAt"
>;

export type RecipientRefreshDiff = {
  added: number;
  removed: number;
  newlySuppressed: number;
  newlyInvalid: number;
};
