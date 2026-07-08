import type { ImportDuplicateMatch, ImportRowAction, ImportRowStatus } from "@/domain/import-types";
import type { Lead } from "@/domain/types";
import type { LeadContact } from "@/domain/import-types";
import {
  extractWebsiteDomain,
  isValidEmailSyntax,
  normalizeEmail,
  normalizeOrganizationComparisonKey,
  normalizePhone,
  organizationNamesSimilar,
  trimValue
} from "@/features/leadops/import-normalization";

export type ParsedImportRowInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  region: string;
  country: string;
  industry: string;
  notes: string;
  sourceDatabase: string;
  status: string;
  language: string;
};

export type ExistingLeadIndex = {
  leads: Lead[];
  contacts: LeadContact[];
};

export type RowDuplicateAnalysis = {
  status: ImportRowStatus;
  validationErrors: string[];
  warnings: string[];
  duplicateMatches: ImportDuplicateMatch[];
  proposedAction: ImportRowAction;
};

export function analyzeImportRow(
  row: ParsedImportRowInput,
  existing: ExistingLeadIndex,
  fileDuplicateEmails: Set<string>
): RowDuplicateAnalysis {
  const validationErrors: string[] = [];
  const warnings: string[] = [];
  const duplicateMatches: ImportDuplicateMatch[] = [];

  const companyName = trimValue(row.companyName);
  if (!companyName) {
    validationErrors.push("Organization name is required.");
  }

  const email = normalizeEmail(row.email);
  const hasEmail = email.length > 0;
  if (hasEmail && !isValidEmailSyntax(email)) {
    validationErrors.push("Email syntax is invalid.");
  }

  if (validationErrors.length > 0) {
    return {
      status: "invalid",
      validationErrors,
      warnings,
      duplicateMatches,
      proposedAction: "skip_invalid"
    };
  }

  const normalizedName = normalizeOrganizationComparisonKey(companyName);
  const domain = extractWebsiteDomain(row.website);
  const { normalized: normalizedPhone } = normalizePhone(row.phone);

  if (hasEmail) {
    const existingContact = existing.contacts.find(
      (contact) => contact.active && contact.normalizedEmail === email
    );
    const existingLeadByEmail = existing.leads.find(
      (lead) => lead.active && normalizeEmail(lead.email) === email
    );
    if (existingContact || existingLeadByEmail) {
      duplicateMatches.push({
        kind: "contact_email",
        existingLeadId: existingContact?.leadId ?? existingLeadByEmail!.id,
        existingContactId: existingContact?.id,
        reason: "Exact normalized email already exists."
      });
    }
    if (fileDuplicateEmails.has(email)) {
      warnings.push("Duplicate email within import file.");
    }
  }

  for (const lead of existing.leads) {
    if (!lead.active) continue;
    const leadDomain = lead.websiteDomain ?? extractWebsiteDomain(lead.website ?? "");
    const leadNormalizedName = lead.normalizedCompanyName ?? normalizeOrganizationComparisonKey(lead.companyName);
    const leadPhone = lead.normalizedPhone ?? normalizePhone(lead.phone).normalized;

    const nameAndDomain =
      normalizedName &&
      domain &&
      leadNormalizedName === normalizedName &&
      leadDomain &&
      leadDomain === domain;
    const nameAndPhone =
      normalizedName &&
      normalizedPhone &&
      leadNormalizedName === normalizedName &&
      leadPhone &&
      leadPhone === normalizedPhone;

    if (nameAndDomain || nameAndPhone) {
      duplicateMatches.push({
        kind: "organization_strong",
        existingLeadId: lead.id,
        reason: nameAndDomain
          ? "Same organization name and website domain."
          : "Same organization name and phone."
      });
    } else if (domain && leadDomain && domain === leadDomain && normalizedName !== leadNormalizedName) {
      duplicateMatches.push({
        kind: "organization_possible",
        existingLeadId: lead.id,
        reason: "Same website domain with different organization name."
      });
    } else if (
      normalizedPhone &&
      leadPhone &&
      normalizedPhone === leadPhone &&
      normalizedName !== leadNormalizedName
    ) {
      duplicateMatches.push({
        kind: "organization_possible",
        existingLeadId: lead.id,
        reason: "Same phone with different organization name."
      });
    } else if (organizationNamesSimilar(companyName, lead.companyName)) {
      duplicateMatches.push({
        kind: "organization_possible",
        existingLeadId: lead.id,
        reason: "Highly similar organization name."
      });
    }
  }

  const strongContactDup = duplicateMatches.some((match) => match.kind === "contact_email");
  if (strongContactDup) {
    return {
      status: "duplicate",
      validationErrors,
      warnings,
      duplicateMatches,
      proposedAction: "skip_duplicate"
    };
  }

  const strongOrgDup = duplicateMatches.find((match) => match.kind === "organization_strong");
  if (strongOrgDup) {
    return {
      status: "duplicate",
      validationErrors,
      warnings: [...warnings, "Strong organization match — attach new data after confirmation."],
      duplicateMatches,
      proposedAction: "attach_to_existing"
    };
  }

  const possibleDup = duplicateMatches.some((match) => match.kind === "organization_possible");
  if (possibleDup) {
    return {
      status: "possible_duplicate",
      validationErrors,
      warnings: [...warnings, "Possible duplicate requires review."],
      duplicateMatches,
      proposedAction: "review"
    };
  }

  if (!hasEmail) {
    return {
      status: "missing_email",
      validationErrors,
      warnings: [...warnings, "No email — organization will import without contact email."],
      duplicateMatches,
      proposedAction: "create_organization"
    };
  }

  return {
    status: "valid",
    validationErrors,
    warnings,
    duplicateMatches,
    proposedAction: "create_contact"
  };
}

export async function computeFileFingerprint(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function findFileDuplicateEmails(rows: ParsedImportRowInput[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email || !isValidEmailSyntax(email)) continue;
    if (seen.has(email)) duplicates.add(email);
    seen.add(email);
  }
  return duplicates;
}
