import { EMPTY_LEADOPS_FILTERS, type LeadOpsFilters, type LeadOpsLead } from "./types";

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesLeadSearch(lead: LeadOpsLead, rawQuery: string): boolean {
  const query = normalizeSearchQuery(rawQuery);

  if (!query) {
    return true;
  }

  const haystack = [
    lead.companyName,
    lead.contactName,
    lead.email,
    lead.location,
    lead.source,
    lead.website ?? ""
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function matchesLeadFilters(lead: LeadOpsLead, filters: LeadOpsFilters): boolean {
  if (filters.industry && lead.industry !== filters.industry) {
    return false;
  }

  if (filters.status && lead.status !== filters.status) {
    return false;
  }

  if (filters.quality && lead.quality !== filters.quality) {
    return false;
  }

  if (filters.sourceDatabase && lead.sourceDatabase !== filters.sourceDatabase) {
    return false;
  }

  if (filters.language && lead.language !== filters.language) {
    return false;
  }

  return true;
}

export function filterLeads(
  leads: LeadOpsLead[],
  searchQuery: string,
  filters: LeadOpsFilters
): LeadOpsLead[] {
  return leads.filter(
    (lead) => matchesLeadSearch(lead, searchQuery) && matchesLeadFilters(lead, filters)
  );
}

export function hasActiveFilters(filters: LeadOpsFilters): boolean {
  return Object.values(filters).some((value) => value.length > 0);
}

export function clearLeadOpsFilters(): LeadOpsFilters {
  return { ...EMPTY_LEADOPS_FILTERS };
}
