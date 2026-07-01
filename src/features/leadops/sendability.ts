import type { LeadContact } from "@/domain/import-types";
import type { Lead } from "@/domain/types";
import { isValidEmailSyntax, normalizeEmail } from "@/features/leadops/import-normalization";

export type SendabilityReason =
  | "missing_email"
  | "invalid_email"
  | "suppressed"
  | "inactive"
  | "duplicate_contact"
  | "wrong_tenant";

export type SendabilityInput = {
  tenantId: string;
  lead: Lead;
  contact?: LeadContact | null;
  duplicateEmails?: Set<string>;
};

export type SendabilityResult = {
  sendable: boolean;
  reasons: SendabilityReason[];
};

export function evaluateSendability(input: SendabilityInput): SendabilityResult {
  const reasons: SendabilityReason[] = [];
  const { lead, tenantId } = input;

  if (lead.tenantId !== tenantId) {
    reasons.push("wrong_tenant");
  }

  if (!lead.active) {
    reasons.push("inactive");
  }

  const email = resolveOutreachEmail(lead, input.contact);
  if (!email) {
    reasons.push("missing_email");
  } else if (!isValidEmailSyntax(email)) {
    reasons.push("invalid_email");
  }

  if (lead.consentStatus === "unsubscribed" || lead.outreachStatus === "bounced") {
    reasons.push("suppressed");
  }

  if (email && input.duplicateEmails?.has(email)) {
    reasons.push("duplicate_contact");
  }

  return { sendable: reasons.length === 0, reasons };
}

export function buildDuplicateEmailIndex(
  leads: Lead[],
  contacts: LeadContact[],
  tenantId: string
): Set<string> {
  const counts = new Map<string, number>();
  const primaryContactByLead = new Map<string, LeadContact>();
  for (const contact of contacts) {
    if (contact.tenantId !== tenantId || !contact.active) continue;
    const existing = primaryContactByLead.get(contact.leadId);
    if (!existing || contact.isPrimary) primaryContactByLead.set(contact.leadId, contact);
  }

  for (const lead of leads) {
    if (lead.tenantId !== tenantId || !lead.active) continue;
    const email = resolveOutreachEmail(lead, primaryContactByLead.get(lead.id) ?? null);
    if (!email) continue;
    counts.set(email, (counts.get(email) ?? 0) + 1);
  }

  for (const contact of contacts) {
    if (contact.tenantId !== tenantId || !contact.active || contact.isPrimary) continue;
    const email = normalizeEmail(contact.email);
    if (!email) continue;
    counts.set(email, (counts.get(email) ?? 0) + 1);
  }

  const duplicates = new Set<string>();
  for (const [email, count] of counts) {
    if (count > 1) duplicates.add(email);
  }
  return duplicates;
}

function resolveOutreachEmail(lead: Lead, contact?: LeadContact | null): string {
  const contactEmail = normalizeEmail(contact?.email ?? "");
  if (contactEmail) return contactEmail;
  return normalizeEmail(lead.email);
}

export type ExclusionBucket =
  | "sendable"
  | "missing_email"
  | "invalid_email"
  | "suppressed"
  | "duplicate"
  | "inactive";

export function bucketSendability(result: SendabilityResult): ExclusionBucket {
  if (result.sendable) return "sendable";
  if (result.reasons.includes("missing_email")) return "missing_email";
  if (result.reasons.includes("invalid_email")) return "invalid_email";
  if (result.reasons.includes("suppressed")) return "suppressed";
  if (result.reasons.includes("duplicate_contact")) return "duplicate";
  return "inactive";
}
