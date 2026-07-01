import type { SegmentDefinition } from "@/domain/campaign-types";
import type { LeadContact } from "@/domain/import-types";
import type { Lead } from "@/domain/types";
import {
  buildLeadManagementRows,
  matchesLeadManagementFilters,
  type LeadManagementContext,
  type LeadManagementRow
} from "@/features/leadops/lead-management";
import type { LeadOpsFilters } from "@/features/leadops/types";

export type SegmentCandidate = {
  row: LeadManagementRow;
  lead: Lead;
  contact: LeadContact | null;
};

export type SegmentPreviewCounts = {
  matchingOrganizations: number;
  matchingContacts: number;
  sendableRecipients: number;
  missingEmail: number;
  invalidEmail: number;
  suppressed: number;
  duplicate: number;
  inactive: number;
};

export function resolveSegmentCandidates(
  definition: SegmentDefinition,
  context: LeadManagementContext,
  searchQuery = ""
): SegmentCandidate[] {
  const rows = buildLeadManagementRows(context);
  const leadById = new Map(context.leads.map((lead) => [lead.id, lead]));
  const contactByLead = new Map<string, LeadContact>();
  for (const contact of context.contacts) {
    if (!contact.active) continue;
    const existing = contactByLead.get(contact.leadId);
    if (!existing || contact.isPrimary) contactByLead.set(contact.leadId, contact);
  }

  let candidates: LeadManagementRow[] = rows;

  if (definition.mode === "selected_contacts" && definition.selectedContactIds?.length) {
    const selected = new Set(definition.selectedContactIds);
    candidates = rows.filter((row) => row.contactId && selected.has(row.contactId));
  } else if (definition.mode === "selected_organizations" && definition.selectedLeadIds?.length) {
    const selected = new Set(definition.selectedLeadIds);
    candidates = rows.filter((row) => selected.has(row.leadId));
  } else {
    const filters = definition.filters ?? ({} as LeadOpsFilters);
    const query = definition.searchQuery ?? searchQuery;
    candidates = rows.filter((row) => matchesLeadManagementFilters(row, query, filters));
  }

  return candidates
    .map((row) => ({
      row,
      lead: leadById.get(row.leadId)!,
      contact: row.contactId
        ? context.contacts.find((item) => item.id === row.contactId) ?? contactByLead.get(row.leadId) ?? null
        : contactByLead.get(row.leadId) ?? null
    }))
    .filter((candidate) => Boolean(candidate.lead));
}

export function summarizeSegmentPreview(candidates: SegmentCandidate[]): SegmentPreviewCounts {
  const orgIds = new Set(candidates.map((item) => item.row.leadId));
  let sendableRecipients = 0;
  let missingEmail = 0;
  let invalidEmail = 0;
  let suppressed = 0;
  let duplicate = 0;
  let inactive = 0;

  for (const candidate of candidates) {
    switch (candidate.row.exclusionBucket) {
      case "sendable":
        sendableRecipients += 1;
        break;
      case "missing_email":
        missingEmail += 1;
        break;
      case "invalid_email":
        invalidEmail += 1;
        break;
      case "suppressed":
        suppressed += 1;
        break;
      case "duplicate":
        duplicate += 1;
        break;
      case "inactive":
        inactive += 1;
        break;
      default:
        break;
    }
  }

  return {
    matchingOrganizations: orgIds.size,
    matchingContacts: candidates.length,
    sendableRecipients,
    missingEmail,
    invalidEmail,
    suppressed,
    duplicate,
    inactive
  };
}

export function buildSegmentDefinitionFromFilters(
  filters: LeadOpsFilters,
  searchQuery: string
): SegmentDefinition {
  return {
    version: 1,
    mode: "filters",
    filters,
    searchQuery
  };
}

export function buildSegmentDefinitionFromSelection(
  mode: "selected_contacts" | "selected_organizations",
  ids: string[]
): SegmentDefinition {
  return mode === "selected_contacts"
    ? { version: 1, mode, selectedContactIds: ids }
    : { version: 1, mode, selectedLeadIds: ids };
}
