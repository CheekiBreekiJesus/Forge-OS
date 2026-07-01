import type { LeadContact } from "@/domain/import-types";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { Lead } from "@/domain/types";
import { normalizeSearchQuery } from "@/features/leadops/filters";
import {
  bucketSendability,
  buildDuplicateEmailIndex,
  evaluateSendability,
  type ExclusionBucket,
  type SendabilityResult
} from "@/features/leadops/sendability";
import { isValidEmailSyntax, normalizeEmail } from "@/features/leadops/import-normalization";
import type { LeadOpsFilters } from "@/features/leadops/types";

export const LEAD_PAGE_SIZE = 25;
export const LEAD_FILTER_STORAGE_KEY = "forgeos:leadops:filter-state";

export type EmailValidityFilter = "" | "valid" | "missing" | "invalid";

export type LeadManagementRow = {
  leadId: string;
  contactId: string | null;
  tenantId: string;
  companyName: string;
  contactName: string;
  email: string;
  category: string;
  region: string;
  website: string;
  country: string;
  language: string;
  quality: string;
  sourceImport: string;
  sourceDatabase: string;
  emailValidity: "valid" | "invalid" | "missing";
  suppressionStatus: "none" | "unsubscribed" | "bounced";
  lastContactedAt: string | null;
  campaignCount: number;
  leadStatus: Lead["outreachStatus"];
  active: boolean;
  sendability: SendabilityResult;
  exclusionBucket: ExclusionBucket;
};

export type LeadManagementContext = {
  leads: Lead[];
  contacts: LeadContact[];
  recipients: CampaignRecipient[];
  outreachSentAtByLeadId: Map<string, string>;
};

export function buildLeadManagementRows(context: LeadManagementContext): LeadManagementRow[] {
  const tenantId =
    context.leads.find((lead) => lead.active)?.tenantId ?? context.leads[0]?.tenantId ?? "";
  const duplicateEmails = buildDuplicateEmailIndex(context.leads, context.contacts, tenantId);
  const campaignCounts = countCampaignsByLead(context.recipients);
  const contactByLead = groupPrimaryContacts(context.contacts);

  return context.leads.map((lead) => {
    const contact = contactByLead.get(lead.id) ?? null;
    const email = normalizeEmail(contact?.email || lead.email);
    const emailValidity: LeadManagementRow["emailValidity"] = !email
      ? "missing"
      : isValidEmailSyntax(email)
        ? "valid"
        : "invalid";
    const suppressionStatus: LeadManagementRow["suppressionStatus"] =
      lead.consentStatus === "unsubscribed"
        ? "unsubscribed"
        : lead.outreachStatus === "bounced"
          ? "bounced"
          : "none";
    const sendability = evaluateSendability({
      tenantId: lead.tenantId,
      lead,
      contact,
      duplicateEmails
    });

    return {
      leadId: lead.id,
      contactId: contact?.id ?? null,
      tenantId: lead.tenantId,
      companyName: lead.companyName,
      contactName: contact?.name ?? lead.contactName,
      email,
      category: lead.industry,
      region: lead.location,
      website: lead.website ?? "",
      country: lead.country,
      language: lead.language,
      quality: lead.quality,
      sourceImport: lead.sourceImportId ?? "",
      sourceDatabase: lead.sourceDatabase,
      emailValidity,
      suppressionStatus,
      lastContactedAt: context.outreachSentAtByLeadId.get(lead.id) ?? null,
      campaignCount: campaignCounts.get(lead.id) ?? 0,
      leadStatus: lead.outreachStatus,
      active: lead.active,
      sendability,
      exclusionBucket: bucketSendability(sendability)
    };
  });
}

function groupPrimaryContacts(contacts: LeadContact[]): Map<string, LeadContact> {
  const map = new Map<string, LeadContact>();
  for (const contact of contacts) {
    if (!contact.active) continue;
    const existing = map.get(contact.leadId);
    if (!existing || contact.isPrimary) map.set(contact.leadId, contact);
  }
  return map;
}

function countCampaignsByLead(recipients: CampaignRecipient[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const recipient of recipients) {
    if (recipient.status !== "included") continue;
    counts.set(recipient.leadId, (counts.get(recipient.leadId) ?? 0) + 1);
  }
  return counts;
}

export function matchesLeadManagementFilters(
  row: LeadManagementRow,
  searchQuery: string,
  filters: LeadOpsFilters
): boolean {
  const query = normalizeSearchQuery(searchQuery);
  if (query) {
    const haystack = [
      row.companyName,
      row.contactName,
      row.email,
      row.region,
      row.country,
      row.sourceDatabase,
      row.category
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filters.industry && row.category !== filters.industry) return false;
  if (filters.status && row.leadStatus !== filters.status) return false;
  if (filters.sourceDatabase && row.sourceDatabase !== filters.sourceDatabase) return false;
  if (filters.language && filters.language.length > 0) {
    // language lives on lead; row doesn't expose it — handled upstream by attaching lead lookup
  }
  if (filters.region && row.region !== filters.region) return false;
  if (filters.country && row.country !== filters.country) return false;
  if (filters.emailValidity && row.emailValidity !== filters.emailValidity) return false;
  if (filters.suppressionStatus && row.suppressionStatus !== filters.suppressionStatus) return false;
  if (filters.sourceImportId && row.sourceImport !== filters.sourceImportId) return false;
  if (filters.campaignAssignment === "unassigned" && row.campaignCount > 0) return false;
  if (filters.campaignAssignment === "assigned" && row.campaignCount === 0) return false;
  if (filters.quality && row.quality !== filters.quality) return false;
  if (filters.language && row.language !== filters.language) return false;
  if (filters.neverContacted === "true" && row.lastContactedAt) return false;
  if (filters.contactedWithinDays) {
    const days = Number(filters.contactedWithinDays);
    if (!row.lastContactedAt || !isWithinDays(row.lastContactedAt, days)) return false;
  }
  if (filters.notContactedWithinDays) {
    const days = Number(filters.notContactedWithinDays);
    if (row.lastContactedAt && isWithinDays(row.lastContactedAt, days)) return false;
  }

  return true;
}

function isWithinDays(isoDate: string, days: number): boolean {
  const then = new Date(isoDate).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return then >= cutoff;
}

export function paginateRows<T>(rows: T[], page: number, pageSize = LEAD_PAGE_SIZE): T[] {
  const start = Math.max(0, (page - 1) * pageSize);
  return rows.slice(start, start + pageSize);
}

export function totalPages(count: number, pageSize = LEAD_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

export function loadPersistedFilters(): Partial<LeadOpsFilters> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LEAD_FILTER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<LeadOpsFilters>) : {};
  } catch {
    return {};
  }
}

export function persistFilters(filters: LeadOpsFilters): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEAD_FILTER_STORAGE_KEY, JSON.stringify(filters));
}
