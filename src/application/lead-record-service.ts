import { createEmailSuppression } from "@/application/suppression-service";
import type { UpdateLeadInput } from "@/domain/types";
import { normalizeEmail } from "@/features/leadops/import-normalization";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

export async function updateLeadOrganization(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string,
  input: Pick<UpdateLeadInput, "companyName" | "location" | "industry" | "website" | "notes">
): Promise<void> {
  await repos.leads.update(tenantId, leadId, input);
  await repos.activities.append(tenantId, {
    entityType: "lead",
    entityId: leadId,
    action: "lead_record_corrected",
    title: "Organization data corrected",
    metadata: { leadId }
  });
}

export async function updateLeadContactData(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string,
  input: { contactName?: string; email?: string; phone?: string }
): Promise<void> {
  await repos.leads.update(tenantId, leadId, {
    contactName: input.contactName,
    email: input.email,
    phone: input.phone
  });

  const contacts = await repos.leadContacts.listForLead(tenantId, leadId);
  const primary = contacts.find((row) => row.isPrimary) ?? contacts[0];
  if (primary && input.email) {
    await repos.leadContacts.update(tenantId, primary.id, {
      email: input.email,
      normalizedEmail: normalizeEmail(input.email),
      name: input.contactName ?? primary.name
    });
  }

  await repos.activities.append(tenantId, {
    entityType: "lead",
    entityId: leadId,
    action: "lead_record_corrected",
    title: "Contact data corrected",
    metadata: { leadId }
  });
}

export async function markLeadInactive(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string,
  archiveReason = "marked_inactive"
): Promise<void> {
  await repos.leads.archive(tenantId, leadId, { archiveReason });
}

export async function suppressLeadEmail(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string,
  reason: "manual" | "unsubscribe" | "invalid_address" | "duplicate" | "legal_request" | "other",
  notes?: string
): Promise<void> {
  const lead = await repos.leads.getById(tenantId, leadId);
  if (!lead) throw new PersistenceError("not_found", "Lead not found.");
  await createEmailSuppression(repos, tenantId, {
    email: lead.email,
    reason,
    source: "lead_detail",
    leadId,
    notes
  });
}

export async function deleteLeadIfSafe(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string
): Promise<"deleted" | "anonymized"> {
  const lead = await repos.leads.getById(tenantId, leadId);
  if (!lead) throw new PersistenceError("not_found", "Lead not found.");

  const recipients = (await repos.campaignRecipients.listForTenant(tenantId)).filter(
    (row) => row.leadId === leadId
  );
  const hasSentHistory = recipients.some((row) => row.draftStatus === "SENT_MANUALLY");

  if (hasSentHistory) {
    for (const recipient of recipients) {
      await repos.campaignRecipients.updateDraft(tenantId, recipient.id, {
        snapshotCompanyName: "Anonymized organization",
        snapshotContactName: "Anonymized contact",
        snapshotEmail: "anonymized@example.invalid"
      });
    }
    await repos.leads.update(tenantId, leadId, {
      companyName: "Anonymized organization",
      contactName: "Anonymized contact",
      email: "anonymized@example.invalid",
      active: false
    });
    await repos.activities.append(tenantId, {
      entityType: "lead",
      entityId: leadId,
      action: "lead_record_anonymized",
      title: "Lead anonymized to preserve campaign history",
      metadata: { leadId }
    });
    return "anonymized";
  }

  await repos.leads.archive(tenantId, leadId, { archiveReason: "deleted_by_operator" });
  await repos.activities.append(tenantId, {
    entityType: "lead",
    entityId: leadId,
    action: "lead_record_deleted",
    title: `Lead archived: ${lead.companyName}`,
    metadata: { leadId }
  });
  return "deleted";
}
