import type { LeadOpsCampaign, LeadOpsLead } from "@/features/leadops/types";
import type { Campaign, Customer, Lead, Opportunity, ProductionOrder, Quote } from "./types";

export function toLeadOpsLead(lead: Lead): LeadOpsLead {
  return {
    id: lead.id,
    tenantId: lead.tenantId,
    companyName: lead.companyName,
    contactName: lead.contactName,
    email: lead.email,
    website: lead.website,
    location: lead.location,
    industry: lead.industry,
    status: lead.outreachStatus,
    quality: lead.quality,
    source: lead.source,
    sourceDatabase: lead.sourceDatabase,
    language: lead.language,
    campaignId: lead.campaignId,
    consentStatus: lead.consentStatus,
    providerState: lead.providerState
  };
}

export function toLeadOpsCampaign(campaign: Campaign): LeadOpsCampaign {
  return {
    id: campaign.id,
    tenantId: campaign.tenantId,
    name: campaign.name,
    status: campaign.status,
    sentCount: campaign.sentCount,
    totalCount: campaign.totalCount
  };
}

export function leadFromLeadOpsSeed(seed: LeadOpsLead, overrides?: Partial<Lead>): Lead {
  const now = new Date().toISOString();
  return {
    id: seed.id,
    tenantId: seed.tenantId,
    companyName: seed.companyName,
    contactName: seed.contactName,
    email: seed.email,
    phone: "",
    website: seed.website,
    location: seed.location,
    industry: seed.industry,
    crmStatus:
      seed.status === "positive_reply" || seed.status === "replied"
        ? "converted"
        : seed.status === "contacted" || seed.status === "queued"
          ? "quoted"
          : "new",
    outreachStatus: seed.status,
    quality: seed.quality,
    source: seed.source,
    sourceDatabase: seed.sourceDatabase,
    language: seed.language,
    campaignId: seed.campaignId,
    consentStatus: seed.consentStatus ?? "subscribed",
    providerState: seed.providerState ?? "not_ready",
    requestedProductId: null,
    quantity: 0,
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function toDemoProductionOrder(order: ProductionOrder) {
  return {
    id: order.id,
    tenantId: order.tenantId,
    quoteId: order.quoteId,
    productId: order.productId,
    customerName: order.customerName,
    quantity: order.quantity,
    status: order.status,
    scheduledDate: order.scheduledDate,
    artworkStatus: order.artworkStatus,
    screenStatus: order.screenStatus,
    machineId: order.machineId,
    progress: order.progress,
    operatorNotes: order.operatorNotes
  };
}

export function formatQuoteNumber(sequence: number): string {
  return `QT-${String(sequence).padStart(5, "0")}`;
}

export function formatProductionOrderNumber(sequence: number): string {
  return `PO-${String(sequence).padStart(5, "0")}`;
}

export function customerOpportunityCount(
  customerId: string,
  opportunities: { customerId: string | null }[]
): number {
  return opportunities.filter((o) => o.customerId === customerId).length;
}

export type CustomerSummary = Customer & {
  opportunityCount: number;
  sourceLeadCompany: string;
};

export function toCustomerSummary(
  customer: Customer,
  opportunities: Opportunity[],
  leads: Lead[]
): CustomerSummary {
  const sourceLead = leads.find((l) => l.id === customer.leadId);
  return {
    ...customer,
    opportunityCount: customerOpportunityCount(customer.id, opportunities),
    sourceLeadCompany: sourceLead?.companyName ?? "-"
  };
}

export type QuoteSummary = Quote & {
  customerName: string;
};

export function toQuoteSummary(quote: Quote, customers: Customer[]): QuoteSummary {
  const customer = customers.find((c) => c.id === quote.customerId);
  return {
    ...quote,
    customerName: customer?.companyName ?? "-"
  };
}
