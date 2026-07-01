export const LEADOPS_DEMO_TENANT_ID = "tenant_jh_gomes" as const;

export type LeadOpsStatus =
  | "ready"
  | "queued"
  | "contacted"
  | "replied"
  | "positive_reply"
  | "bounced";

export type LeadOpsQuality = "high" | "medium" | "low";

export type LeadOpsCampaignStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "in_progress"
  | "completed"
  | "paused"
  | "cancelled"
  | "active";

export type LeadOpsConsentStatus = "unknown" | "subscribed" | "unsubscribed";

export type LeadOpsProviderState =
  | "not_ready"
  | "draft"
  | "approved"
  | "queued"
  | "sent"
  | "blocked";

export type LeadOpsTone = "professional" | "friendly" | "direct";

export type LeadOpsLead = {
  id: string;
  tenantId: string;
  companyName: string;
  contactName: string;
  email: string;
  website: string | null;
  location: string;
  industry: string;
  status: LeadOpsStatus;
  quality: LeadOpsQuality;
  source: string;
  sourceDatabase: string;
  language: string;
  campaignId: string | null;
  consentStatus?: LeadOpsConsentStatus;
  providerState?: LeadOpsProviderState;
};

export type LeadOpsCampaign = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  language?: string;
  status: LeadOpsCampaignStatus;
  sentCount: number;
  totalCount: number;
  recipientSnapshotCount?: number;
  deliveryMode?: "simulation" | "provider_handoff";
  createdAt?: string;
};

export type LeadOpsActivityKind =
  | "lead-imported"
  | "campaign-started"
  | "reply-received"
  | "bounce-detected"
  | "lead-qualified"
  | "message-generated"
  | "message-edited"
  | "message-approved"
  | "campaign-assigned"
  | "message-queued"
  | "message-sent"
  | "metrics-updated";

export type LeadOpsActivity = {
  id: string;
  tenantId: string;
  kind: LeadOpsActivityKind;
  companyName: string;
  occurredAt: string;
};

export type LeadOpsFilters = {
  industry: string;
  status: string;
  quality: string;
  sourceDatabase: string;
  language: string;
  region: string;
  country: string;
  emailValidity: "" | "valid" | "missing" | "invalid";
  suppressionStatus: "" | "none" | "unsubscribed" | "bounced";
  sourceImportId: string;
  campaignAssignment: "" | "unassigned" | "assigned";
  neverContacted: "" | "true";
  contactedWithinDays: "" | "7" | "30" | "90";
  notContactedWithinDays: "" | "7" | "30" | "90";
};

export const EMPTY_LEADOPS_FILTERS: LeadOpsFilters = {
  industry: "",
  status: "",
  quality: "",
  sourceDatabase: "",
  language: "",
  region: "",
  country: "",
  emailValidity: "",
  suppressionStatus: "",
  sourceImportId: "",
  campaignAssignment: "",
  neverContacted: "",
  contactedWithinDays: "",
  notContactedWithinDays: ""
};

export type LeadOpsKpis = {
  totalLeads: number;
  ready: number;
  queued: number;
  contactedSent: number;
  replies: number;
  positiveReplies: number;
  bounceRate: number | null;
  activeCampaigns: number;
};

export type LeadListViewState = "results" | "empty" | "no-results";

export type LeadListViewModel = {
  state: LeadListViewState;
  visibleLeads: LeadOpsLead[];
  resultCount: number;
};

export type LeadOpsProductKey =
  | "customized-plastic-cups"
  | "customized-paper-cups"
  | "paper-cups"
  | "biodegradable-cutlery"
  | "disposable-food-service"
  | "packaging-products";

export type LeadOpsProductRecommendation = {
  key: LeadOpsProductKey;
  label: string;
  reason: string;
};

export type LeadOpsCompanyContext = {
  hasWebsiteContext: boolean;
  summary: string;
  personalizationNotes: string[];
};

export type LeadOpsGeneratedMessage = {
  subject: string;
  body: string;
  generationMethod: "deterministic-template" | "abacus" | "openai" | "deterministic-fallback";
  approved: boolean;
  edited: boolean;
  providerNotice?: string;
  composition?: import("@/features/email-composition/types").EmailComposition | null;
  senderIdentityId?: string | null;
  variantIndex?: number;
};

export type LeadOpsSequenceStep = {
  id: string;
  title: string;
  delay: string;
  preview: string;
};

export type LeadOpsQueueValidation = {
  ok: boolean;
  reason:
    | "ok"
    | "missing-email"
    | "missing-campaign"
    | "missing-message"
    | "unapproved"
    | "unsubscribed"
    | "bounced"
    | "already-sent";
  message: string;
};

export type LeadOpsWorkflowState = {
  lead: LeadOpsLead;
  campaign: LeadOpsCampaign | null;
  message: LeadOpsGeneratedMessage | null;
  providerState: LeadOpsProviderState;
  queuedAt: string | null;
  sentAt: string | null;
  metricsUpdated: boolean;
  activities: LeadOpsActivity[];
};
