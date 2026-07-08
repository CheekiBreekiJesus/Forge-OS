import { filterLeads } from "./filters";
import type { LeadListViewModel, LeadOpsFilters, LeadOpsLead } from "./types";

export function buildLeadListViewModel(
  allLeads: LeadOpsLead[],
  searchQuery: string,
  filters: LeadOpsFilters
): LeadListViewModel {
  if (allLeads.length === 0) {
    return {
      state: "empty",
      visibleLeads: [],
      resultCount: 0
    };
  }

  const visibleLeads = filterLeads(allLeads, searchQuery, filters);

  if (visibleLeads.length === 0) {
    return {
      state: "no-results",
      visibleLeads: [],
      resultCount: 0
    };
  }

  return {
    state: "results",
    visibleLeads,
    resultCount: visibleLeads.length
  };
}
