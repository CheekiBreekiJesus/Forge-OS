import { LEADOPS_DEMO_TENANT_ID, type LeadOpsActivity, type LeadOpsCampaign, type LeadOpsLead } from "./types";

export { LEADOPS_DEMO_TENANT_ID };

export const leadOpsLeads: LeadOpsLead[] = [
  {
    id: "leadops_001",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Atlantic Catering Group",
    contactName: "Rita Ferreira",
    email: "rita.ferreira@atlantic-catering.example",
    website: "https://atlantic-catering.example",
    location: "Porto, Portugal",
    industry: "Hospitality",
    status: "ready",
    quality: "high",
    source: "Trade fair",
    sourceDatabase: "PT-Hospitality-2025",
    language: "pt-PT",
    campaignId: null,
    consentStatus: "subscribed",
    providerState: "not_ready"
  },
  {
    id: "leadops_002",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Nordic Events Supply",
    contactName: "Erik Lindstrom",
    email: "e.lindstrom@nordicevents.example",
    website: "https://nordicevents.example",
    location: "Gothenburg, Sweden",
    industry: "Events",
    status: "queued",
    quality: "medium",
    source: "Web form",
    sourceDatabase: "EU-Events-Q1",
    language: "en",
    campaignId: "campaign_001",
    consentStatus: "subscribed",
    providerState: "queued"
  },
  {
    id: "leadops_003",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Lisbon Coffee Roasters",
    contactName: "Joao Almeida",
    email: "joao@lisboncoffee.example",
    website: "https://lisboncoffee.example",
    location: "Lisbon, Portugal",
    industry: "Food & Beverage",
    status: "contacted",
    quality: "high",
    source: "Partner referral",
    sourceDatabase: "PT-FB-2025",
    language: "pt-PT",
    campaignId: "campaign_001",
    consentStatus: "subscribed",
    providerState: "sent"
  },
  {
    id: "leadops_004",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Summit Conference Services",
    contactName: "Claire Dubois",
    email: "claire@summitconf.example",
    website: "https://summitconf.example",
    location: "Lyon, France",
    industry: "Events",
    status: "replied",
    quality: "high",
    source: "Outbound list",
    sourceDatabase: "EU-Events-Q1",
    language: "en",
    campaignId: "campaign_002",
    consentStatus: "subscribed",
    providerState: "sent"
  },
  {
    id: "leadops_005",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "GreenPack Solutions",
    contactName: "Miguel Santos",
    email: "miguel@greenpack.example",
    website: "https://greenpack.example",
    location: "Braga, Portugal",
    industry: "Packaging",
    status: "positive_reply",
    quality: "high",
    source: "Industry directory",
    sourceDatabase: "PT-Packaging-2025",
    language: "pt-PT",
    campaignId: "campaign_002",
    consentStatus: "subscribed",
    providerState: "sent"
  },
  {
    id: "leadops_006",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Metro Stadium Services",
    contactName: "Helena Costa",
    email: "helena.costa@metro-stadium.invalid",
    website: null,
    location: "Madrid, Spain",
    industry: "Sports venues",
    status: "bounced",
    quality: "low",
    source: "Purchased list",
    sourceDatabase: "ES-Sports-2024",
    language: "es",
    campaignId: "campaign_001",
    consentStatus: "unsubscribed",
    providerState: "blocked"
  },
  {
    id: "leadops_007",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Coastal Hotel Collective",
    contactName: "Ana Martins",
    email: "procurement@coastalhotels.example",
    website: "https://coastalhotels.example",
    location: "Faro, Portugal",
    industry: "Hospitality",
    status: "ready",
    quality: "medium",
    source: "Web form",
    sourceDatabase: "PT-Hospitality-2025",
    language: "pt-PT",
    campaignId: null,
    consentStatus: "subscribed",
    providerState: "not_ready"
  },
  {
    id: "leadops_008",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Urban Bistro Chain",
    contactName: "Tom Walsh",
    email: "tom@urbanbistro.example",
    website: "https://urbanbistro.example",
    location: "Dublin, Ireland",
    industry: "Food & Beverage",
    status: "queued",
    quality: "medium",
    source: "Trade fair",
    sourceDatabase: "EU-FB-2025",
    language: "en",
    campaignId: "campaign_003",
    consentStatus: "subscribed",
    providerState: "queued"
  },
  {
    id: "leadops_009",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Festival Logistics Iberia",
    contactName: "Sofia Ribeiro",
    email: "sofia@festival-logistics.example",
    website: "https://festival-logistics.example",
    location: "Coimbra, Portugal",
    industry: "Events",
    status: "contacted",
    quality: "high",
    source: "Outbound list",
    sourceDatabase: "EU-Events-Q1",
    language: "pt-PT",
    campaignId: "campaign_003",
    consentStatus: "subscribed",
    providerState: "sent"
  },
  {
    id: "leadops_010",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    companyName: "Alpine Resort Supplies",
    contactName: "Marco Bianchi",
    email: "marco@alpineresort.example",
    website: "https://alpineresort.example",
    location: "Turin, Italy",
    industry: "Hospitality",
    status: "replied",
    quality: "medium",
    source: "Partner referral",
    sourceDatabase: "EU-Hospitality-2025",
    language: "en",
    campaignId: "campaign_002",
    consentStatus: "subscribed",
    providerState: "sent"
  },
  {
    id: "leadops_011",
    tenantId: "tenant_other_demo",
    companyName: "Other Tenant Lead",
    contactName: "External Contact",
    email: "external@othertenant.example",
    website: "https://othertenant.example",
    location: "Berlin, Germany",
    industry: "Packaging",
    status: "ready",
    quality: "low",
    source: "Test import",
    sourceDatabase: "DE-Packaging-2025",
    language: "en",
    campaignId: null,
    consentStatus: "subscribed",
    providerState: "not_ready"
  }
];

export const leadOpsCampaigns: LeadOpsCampaign[] = [
  {
    id: "campaign_001",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    name: "Q2 Hospitality Outreach",
    status: "active",
    sentCount: 48,
    totalCount: 120
  },
  {
    id: "campaign_002",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    name: "Events Spring Sequence",
    status: "active",
    sentCount: 72,
    totalCount: 90
  },
  {
    id: "campaign_003",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    name: "Food Service Pilot",
    status: "paused",
    sentCount: 15,
    totalCount: 60
  },
  {
    id: "campaign_004",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    name: "Packaging Reactivation",
    status: "completed",
    sentCount: 40,
    totalCount: 40
  }
];

export const leadOpsActivities: LeadOpsActivity[] = [
  {
    id: "activity_001",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    kind: "lead-imported",
    companyName: "Coastal Hotel Collective",
    occurredAt: "2026-06-28T08:15:00.000Z"
  },
  {
    id: "activity_002",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    kind: "campaign-started",
    companyName: "Food Service Pilot",
    occurredAt: "2026-06-28T09:00:00.000Z"
  },
  {
    id: "activity_003",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    kind: "reply-received",
    companyName: "GreenPack Solutions",
    occurredAt: "2026-06-28T10:22:00.000Z"
  },
  {
    id: "activity_004",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    kind: "bounce-detected",
    companyName: "Metro Stadium Services",
    occurredAt: "2026-06-28T11:05:00.000Z"
  },
  {
    id: "activity_005",
    tenantId: LEADOPS_DEMO_TENANT_ID,
    kind: "lead-qualified",
    companyName: "Summit Conference Services",
    occurredAt: "2026-06-28T12:40:00.000Z"
  }
];

export function getTenantLeads(tenantId: string, leads: LeadOpsLead[] = leadOpsLeads): LeadOpsLead[] {
  return leads.filter((lead) => lead.tenantId === tenantId);
}

export function getTenantCampaigns(
  tenantId: string,
  campaigns: LeadOpsCampaign[] = leadOpsCampaigns
): LeadOpsCampaign[] {
  return campaigns.filter((campaign) => campaign.tenantId === tenantId);
}

export function getTenantActivities(
  tenantId: string,
  activities: LeadOpsActivity[] = leadOpsActivities
): LeadOpsActivity[] {
  return activities
    .filter((activity) => activity.tenantId === tenantId)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export function getFilterOptions(leads: LeadOpsLead[]) {
  return {
    industries: [...new Set(leads.map((lead) => lead.industry))].sort(),
    statuses: [...new Set(leads.map((lead) => lead.status))].sort(),
    qualities: [...new Set(leads.map((lead) => lead.quality))].sort(),
    sourceDatabases: [...new Set(leads.map((lead) => lead.sourceDatabase))].sort(),
    languages: [...new Set(leads.map((lead) => lead.language))].sort()
  };
}
