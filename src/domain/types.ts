import type {
  LeadOpsConsentStatus,
  LeadOpsGeneratedMessage,
  LeadOpsProviderState,
  LeadOpsQuality,
  LeadOpsStatus
} from "@/features/leadops/types";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  defaultLocale: "pt-PT" | "en";
};

export type CrmLeadStatus = "new" | "qualified" | "quoted" | "converted";

export type Lead = {
  id: string;
  tenantId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  location: string;
  industry: string;
  crmStatus: CrmLeadStatus;
  outreachStatus: LeadOpsStatus;
  quality: LeadOpsQuality;
  source: string;
  sourceDatabase: string;
  language: string;
  campaignId: string | null;
  consentStatus: LeadOpsConsentStatus;
  providerState: LeadOpsProviderState;
  requestedProductId: string | null;
  quantity: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string | null;
  location?: string;
  industry?: string;
  source?: string;
  sourceDatabase?: string;
  language?: string;
  requestedProductId?: string | null;
  quantity?: number;
  notes?: string;
};

export type UpdateLeadInput = Partial<
  Omit<Lead, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

export type Customer = {
  id: string;
  tenantId: string;
  leadId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityStage =
  | "discovery"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type Opportunity = {
  id: string;
  tenantId: string;
  leadId: string;
  customerId: string | null;
  title: string;
  stage: OpportunityStage;
  estimatedValue: number;
  createdAt: string;
  updatedAt: string;
};

export type CampaignStatus = "active" | "paused" | "completed";

export type Campaign = {
  id: string;
  tenantId: string;
  name: string;
  status: CampaignStatus;
  sentCount: number;
  totalCount: number;
};

export type OutreachMessage = {
  id: string;
  tenantId: string;
  leadId: string;
  campaignId: string | null;
  message: LeadOpsGeneratedMessage | null;
  providerState: LeadOpsProviderState;
  queuedAt: string | null;
  sentAt: string | null;
  metricsUpdated: boolean;
  updatedAt: string;
};

export type QuoteStatus = "draft" | "sent" | "approved";

export type QuoteLine = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  setupCost: number;
  lineTotal: number;
};

export type Quote = {
  id: string;
  tenantId: string;
  quoteNumber: string;
  leadId: string | null;
  customerId: string | null;
  opportunityId: string | null;
  productId: string;
  productName: string;
  quantity: number;
  printColorCount: number;
  status: QuoteStatus;
  lines: QuoteLine[];
  subtotal: number;
  vat: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateQuoteInput = {
  leadId?: string | null;
  customerId?: string | null;
  opportunityId?: string | null;
  productId: string;
  productName: string;
  quantity: number;
  printColorCount: number;
  subtotal: number;
  vat: number;
  total: number;
  setupCost: number;
  unitPrice: number;
};

export type ProductionOrderStatus =
  | "scheduled"
  | "in-progress"
  | "blocked"
  | "completed";

export type ProductionOrder = {
  id: string;
  tenantId: string;
  orderNumber: string;
  quoteId: string;
  customerId: string | null;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  status: ProductionOrderStatus;
  scheduledDate: string;
  artworkStatus: "pending" | "approved";
  screenStatus: "pending" | "ready";
  machineId: string;
  machineName: string;
  progress: number;
  operatorNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityAction =
  | "lead_created"
  | "lead_qualified"
  | "customer_created"
  | "opportunity_created"
  | "outreach_generated"
  | "outreach_approved"
  | "outreach_queued"
  | "outreach_sent_simulated"
  | "quotation_created"
  | "quotation_approved"
  | "production_order_created"
  | "machine_assigned"
  | "inventory_reserved"
  | "production_logged";

export type ActivityEntityType =
  | "lead"
  | "customer"
  | "opportunity"
  | "quote"
  | "production_order"
  | "outreach"
  | "campaign";

export type ActivityEvent = {
  id: string;
  tenantId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  title: string;
  metadata: Record<string, string | number | boolean>;
  occurredAt: string;
};

export type CreateActivityEventInput = {
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  title: string;
  metadata?: Record<string, string | number | boolean>;
};
