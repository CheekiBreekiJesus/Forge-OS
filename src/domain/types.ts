import type {
  LeadOpsConsentStatus,
  LeadOpsGeneratedMessage,
  LeadOpsProviderState,
  LeadOpsQuality,
  LeadOpsStatus
} from "@/features/leadops/types";
import type { CustomerStatus } from "@/domain/operations-types";

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
  facebookUrl: string | null;
  location: string;
  industry: string;
  crmStatus: CrmLeadStatus;
  outreachStatus: LeadOpsStatus;
  quality: LeadOpsQuality;
  source: string;
  sourceDatabase: string;
  contactSource: string;
  language: string;
  campaignId: string | null;
  consentStatus: LeadOpsConsentStatus;
  providerState: LeadOpsProviderState;
  requestedProductId: string | null;
  quantity: number;
  notes: string;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string | null;
  facebookUrl?: string | null;
  location?: string;
  industry?: string;
  source?: string;
  sourceDatabase?: string;
  contactSource?: string;
  language?: string;
  requestedProductId?: string | null;
  quantity?: number;
  notes?: string;
  quality?: LeadOpsQuality;
  outreachStatus?: LeadOpsStatus;
  consentStatus?: LeadOpsConsentStatus;
};

export type UpdateLeadInput = Partial<
  Omit<Lead, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

export type Customer = {
  id: string;
  tenantId: string;
  leadId: string | null;
  legalName: string;
  tradingName: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  vatNumber: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  website: string | null;
  customerStatus: CustomerStatus;
  notes: string;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerInput = {
  leadId?: string | null;
  legalName: string;
  tradingName?: string;
  companyName?: string;
  contactName: string;
  email: string;
  phone?: string;
  vatNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  website?: string | null;
  customerStatus?: CustomerStatus;
  notes?: string;
};

export type UpdateCustomerInput = Partial<
  Omit<Customer, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

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

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected";

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
  discount: number;
  validityDate: string | null;
  notes: string;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
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
  discount?: number;
  validityDate?: string | null;
  notes?: string;
};

export type UpdateQuoteInput = Partial<
  Omit<Quote, "id" | "tenantId" | "quoteNumber" | "createdAt" | "updatedAt">
>;

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
  completedQuantity: number;
  rejectedQuantity: number;
  status: ProductionOrderStatus;
  scheduledDate: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  artworkStatus: "pending" | "approved";
  screenStatus: "pending" | "ready";
  machineId: string;
  machineName: string;
  progress: number;
  operatorNotes: string;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
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
  | "quotation_rejected"
  | "production_order_created"
  | "machine_assigned"
  | "inventory_reserved"
  | "production_logged"
  | "entity_created"
  | "entity_updated"
  | "entity_archived"
  | "entity_restored"
  | "stock_received"
  | "stock_consumed"
  | "stock_adjusted"
  | "production_status_changed";

export type ActivityEntityType =
  | "lead"
  | "customer"
  | "opportunity"
  | "quote"
  | "production_order"
  | "outreach"
  | "campaign"
  | "product"
  | "machine"
  | "inventory";

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
