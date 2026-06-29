import { describe, expect, it } from "vitest";
import {
  clearLeadOpsFilters,
  filterLeads,
  hasActiveFilters,
  matchesLeadSearch,
  normalizeSearchQuery
} from "./filters";
import { calculateBounceRate, calculateLeadOpsKpis } from "./kpis";
import {
  findLeadById,
  getLocalizedLeadDetailHref,
  getLocalizedLeadOpsHref
} from "./lookup";
import {
  getTenantLeads,
  LEADOPS_DEMO_TENANT_ID,
  leadOpsCampaigns,
  leadOpsLeads
} from "./seed";
import {
  areAllVisibleSelected,
  toggleLeadSelection,
  toggleSelectAllVisible
} from "./selection";
import { EMPTY_LEADOPS_FILTERS } from "./types";
import { buildLeadListViewModel } from "./view-models";

describe("LeadOps domain", () => {
  const tenantLeads = getTenantLeads(LEADOPS_DEMO_TENANT_ID, leadOpsLeads);
  const tenantCampaigns = leadOpsCampaigns.filter(
    (campaign) => campaign.tenantId === LEADOPS_DEMO_TENANT_ID
  );

  it("calculates outreach KPIs for the demo tenant", () => {
    const kpis = calculateLeadOpsKpis(tenantLeads, tenantCampaigns);

    expect(kpis.totalLeads).toBe(10);
    expect(kpis.ready).toBe(2);
    expect(kpis.queued).toBe(2);
    expect(kpis.contactedSent).toBe(2);
    expect(kpis.replies).toBe(3);
    expect(kpis.positiveReplies).toBe(1);
    expect(kpis.activeCampaigns).toBe(2);
  });

  it("returns null bounce rate when no contacted leads exist", () => {
    expect(calculateBounceRate(0, 0)).toBeNull();
  });

  it("calculates bounce rate with zero-denominator protection", () => {
    const kpis = calculateLeadOpsKpis(tenantLeads, tenantCampaigns);

    expect(kpis.bounceRate).toBeCloseTo(16.7, 1);
    expect(calculateBounceRate(2, 0)).toBeNull();
  });

  it("normalizes search queries and matches company, contact, email, location, source, and website", () => {
    const lead = tenantLeads[0];

    expect(normalizeSearchQuery("  Atlantic  ")).toBe("atlantic");
    expect(matchesLeadSearch(lead, "atlantic")).toBe(true);
    expect(matchesLeadSearch(lead, "rita.ferreira")).toBe(true);
    expect(matchesLeadSearch(lead, "porto")).toBe(true);
    expect(matchesLeadSearch(lead, "trade fair")).toBe(true);
    expect(matchesLeadSearch(lead, "atlantic-catering.example")).toBe(true);
    expect(matchesLeadSearch(lead, "unknown term")).toBe(false);
  });

  it("applies combined search and filter constraints", () => {
    const filtered = filterLeads(tenantLeads, "summit", {
      ...EMPTY_LEADOPS_FILTERS,
      industry: "Events",
      status: "replied"
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.companyName).toBe("Summit Conference Services");
  });

  it("clears active filters back to the empty filter state", () => {
    const activeFilters = {
      industry: "Events",
      status: "queued",
      quality: "high",
      sourceDatabase: "EU-Events-Q1",
      language: "en"
    };

    expect(hasActiveFilters(activeFilters)).toBe(true);
    expect(clearLeadOpsFilters()).toEqual(EMPTY_LEADOPS_FILTERS);
    expect(hasActiveFilters(clearLeadOpsFilters())).toBe(false);
  });

  it("toggles visible row selection and select-all-visible behavior", () => {
    const visibleLeadIds = tenantLeads.slice(0, 3).map((lead) => lead.id);

    const firstSelection = toggleLeadSelection([], visibleLeadIds[0]!);
    expect(firstSelection).toEqual([visibleLeadIds[0]]);

    const allSelected = toggleSelectAllVisible(firstSelection, visibleLeadIds);
    expect(areAllVisibleSelected(allSelected, visibleLeadIds)).toBe(true);

    const cleared = toggleSelectAllVisible(allSelected, visibleLeadIds);
    expect(areAllVisibleSelected(cleared, visibleLeadIds)).toBe(false);
  });

  it("isolates tenant-scoped lead lookup", () => {
    const foreignLead = findLeadById("tenant_other", "leadops_011", leadOpsLeads);
    const tenantLead = findLeadById(LEADOPS_DEMO_TENANT_ID, "leadops_001", leadOpsLeads);

    expect(foreignLead).toBeNull();
    expect(tenantLead?.companyName).toBe("Atlantic Catering Group");
    expect(getTenantLeads(LEADOPS_DEMO_TENANT_ID, leadOpsLeads)).toHaveLength(10);
  });

  it("builds localized detail routes that preserve locale", () => {
    expect(getLocalizedLeadOpsHref("pt-PT")).toBe("/pt-PT/leadops");
    expect(getLocalizedLeadDetailHref("en", "leadops_003")).toBe("/en/leadops/leadops_003");
  });

  it("returns empty and no-results view models", () => {
    expect(buildLeadListViewModel([], "", EMPTY_LEADOPS_FILTERS).state).toBe("empty");

    const noResults = buildLeadListViewModel(tenantLeads, "zzzz-not-found", EMPTY_LEADOPS_FILTERS);
    expect(noResults.state).toBe("no-results");
    expect(noResults.resultCount).toBe(0);

    const results = buildLeadListViewModel(tenantLeads, "", EMPTY_LEADOPS_FILTERS);
    expect(results.state).toBe("results");
    expect(results.resultCount).toBe(10);
  });
});
