import { describe, expect, it } from "vitest";
import {
  areAllVisibleSelected,
  isLeadSelected,
  toggleLeadSelection
} from "@/features/leadops/selection";
import { matchesLeadManagementFilters } from "@/features/leadops/lead-management";
import { EMPTY_LEADOPS_FILTERS } from "@/features/leadops/types";
import type { LeadManagementRow } from "@/features/leadops/lead-management";

function syntheticRow(id: number, companyName: string): LeadManagementRow {
  return {
    leadId: `lead-${id}`,
    contactId: null,
    tenantId: "tenant-1",
    companyName,
    contactName: `Contact ${id}`,
    email: `lead${id}@example.test`,
    category: "municipality",
    region: "North",
    website: "",
    country: "PT",
    language: "pt-PT",
    quality: "standard",
    sourceImport: "",
    sourceDatabase: "synthetic",
    emailValidity: "valid",
    suppressionStatus: "none",
    lastContactedAt: null,
    campaignCount: 0,
    leadStatus: "ready",
    active: true,
    sendability: { sendable: true, reasons: [] },
    exclusionBucket: "sendable"
  };
}

describe("LeadOps table density selection and filters", () => {
  const rows = Array.from({ length: 271 }, (_, index) =>
    syntheticRow(index + 1, `Municipality ${index + 1}`)
  );

  it("keeps selected rows when visible slice changes", () => {
    let selected = toggleLeadSelection([], "lead-3");
    selected = toggleLeadSelection(selected, "lead-15");
    expect(isLeadSelected(selected, "lead-3")).toBe(true);
    expect(isLeadSelected(selected, "lead-15")).toBe(true);
  });

  it("preserves filters across row slices", () => {
    const filtered = rows.filter((row) =>
      matchesLeadManagementFilters(row, "Municipality 2", EMPTY_LEADOPS_FILTERS)
    );
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((row) => row.companyName.includes("Municipality 2"))).toBe(true);
  });

  it("supports select-all-visible for compact slices", () => {
    const visibleIds = rows.slice(0, 10).map((row) => row.leadId);
    const selected = visibleIds;
    expect(areAllVisibleSelected(selected, visibleIds)).toBe(true);
  });
});
