import { describe, expect, it } from "vitest";
import {
  buildSegmentDefinitionFromFilters,
  resolveSegmentCandidates,
  summarizeSegmentPreview
} from "@/features/leadops/segmentation";
import { EMPTY_LEADOPS_FILTERS } from "@/features/leadops/types";
import type { LeadManagementContext } from "@/features/leadops/lead-management";
import type { LeadContact } from "@/domain/import-types";
import type { Lead } from "@/domain/types";

const tenantId = "tenant_test";

function lead(id: string, overrides: Partial<Lead> = {}): Lead {
  return {
    id,
    tenantId,
    companyName: `Company ${id}`,
    normalizedCompanyName: id,
    contactName: "Contact",
    email: `${id}@example.invalid`,
    phone: "",
    normalizedPhone: "",
    website: null,
    websiteDomain: null,
    facebookUrl: null,
    location: "Lisbon",
    country: "Portugal",
    industry: "Events",
    crmStatus: "new",
    outreachStatus: "ready",
    quality: "high",
    source: "Import",
    sourceDatabase: "TEST",
    sourceImportId: null,
    contactSource: "TEST",
    language: "pt-PT",
    campaignId: null,
    consentStatus: "subscribed",
    providerState: "not_ready",
    requestedProductId: null,
    quantity: 1,
    notes: "",
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function contact(leadId: string, overrides: Partial<LeadContact> = {}): LeadContact {
  return {
    id: `contact_${leadId}`,
    tenantId,
    leadId,
    name: "Contact",
    normalizedEmail: `${leadId}@example.invalid`,
    email: `${leadId}@example.invalid`,
    phone: "",
    role: "",
    isPrimary: true,
    emailStatus: "valid_syntax",
    lastContactedAt: null,
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("segmentation filters and counts", () => {
  const context: LeadManagementContext = {
    leads: [
      lead("a", { industry: "Hospitality" }),
      lead("b", { industry: "Events", email: "" }),
      lead("c", { industry: "Events", consentStatus: "unsubscribed" })
    ],
    contacts: [contact("a"), contact("b", { email: "" }), contact("c")],
    recipients: [],
    outreachSentAtByLeadId: new Map(),
    suppressedEmails: new Set()
  };

  it("filters by category and valid email", () => {
    const definition = buildSegmentDefinitionFromFilters(
      { ...EMPTY_LEADOPS_FILTERS, industry: "Events", emailValidity: "valid" },
      ""
    );
    const candidates = resolveSegmentCandidates(definition, context);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.row.leadId).toBe("c");
  });

  it("summarizes exclusion buckets", () => {
    const definition = buildSegmentDefinitionFromFilters(
      { ...EMPTY_LEADOPS_FILTERS, industry: "Events" },
      ""
    );
    const candidates = resolveSegmentCandidates(definition, context);
    const counts = summarizeSegmentPreview(candidates);
    expect(counts.matchingOrganizations).toBe(2);
    expect(counts.sendableRecipients).toBe(0);
    expect(counts.missingEmail).toBe(1);
    expect(counts.suppressed).toBe(1);
  });
});
