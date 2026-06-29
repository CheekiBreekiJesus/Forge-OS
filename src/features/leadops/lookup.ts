import type { LeadOpsLead } from "./types";

export function findLeadById(
  tenantId: string,
  leadId: string,
  leads: LeadOpsLead[]
): LeadOpsLead | null {
  return leads.find((lead) => lead.tenantId === tenantId && lead.id === leadId) ?? null;
}

export function getLocalizedLeadDetailHref(locale: string, leadId: string): string {
  return `/${locale}/leadops/${leadId}`;
}

export function getLocalizedLeadOpsHref(locale: string): string {
  return `/${locale}/leadops`;
}
