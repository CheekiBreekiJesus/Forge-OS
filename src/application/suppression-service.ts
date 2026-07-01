import {
  invalidateRecipientApproval
} from "@/application/campaign-approval-service";
import type {
  CreateEmailSuppressionInput,
  EmailSuppression,
  RemoveEmailSuppressionInput,
  SuppressionReason
} from "@/domain/suppression-types";
import { ELEVATED_REMOVAL_REASONS } from "@/domain/suppression-types";
import { normalizeEmail } from "@/features/leadops/import-normalization";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

export function requiresElevatedRemoval(reason: SuppressionReason): boolean {
  return ELEVATED_REMOVAL_REASONS.includes(reason);
}

export async function listActiveSuppressions(
  repos: LocalRepositoryBundle,
  tenantId: string
): Promise<EmailSuppression[]> {
  return repos.emailSuppressions.listActive(tenantId);
}

export async function isEmailSuppressed(
  repos: LocalRepositoryBundle,
  tenantId: string,
  email: string
): Promise<boolean> {
  const row = await repos.emailSuppressions.getActiveByEmail(tenantId, email);
  return Boolean(row);
}

export async function createEmailSuppression(
  repos: LocalRepositoryBundle,
  tenantId: string,
  input: CreateEmailSuppressionInput
): Promise<EmailSuppression> {
  const suppression = await repos.emailSuppressions.create(tenantId, input);

  if (input.leadId && input.reason === "unsubscribe") {
    await repos.leads.update(tenantId, input.leadId, { consentStatus: "unsubscribed" });
  }

  if (input.leadId && input.reason === "invalid_address") {
    await repos.leads.update(tenantId, input.leadId, { outreachStatus: "bounced" });
  }

  await enforceSuppressionOnCampaignRecipients(repos, tenantId, suppression.normalizedEmail, suppression);

  await repos.activities.append(tenantId, {
    entityType: "lead",
    entityId: input.leadId ?? suppression.id,
    action: "suppression_created",
    title: `Suppression added: ${suppression.normalizedEmail}`,
    metadata: {
      suppressionId: suppression.id,
      reason: suppression.reason,
      source: suppression.source
    }
  });

  return suppression;
}

export async function removeEmailSuppression(
  repos: LocalRepositoryBundle,
  tenantId: string,
  suppressionId: string,
  input: RemoveEmailSuppressionInput,
  actorRole = "admin"
): Promise<EmailSuppression> {
  const existing = await repos.emailSuppressions.getById(tenantId, suppressionId);
  if (!existing) {
    throw new PersistenceError("not_found", "Suppression record not found.");
  }

  if (requiresElevatedRemoval(existing.reason)) {
    if (actorRole !== "admin") {
      throw new PersistenceError("forbidden", "Elevated permission required to remove this suppression.");
    }
    if (!input.elevatedConfirmed || !input.removalReason.trim()) {
      throw new PersistenceError(
        "invalid_transition",
        "Unsubscribe and legal-request suppressions require confirmation and a removal reason."
      );
    }
  }

  const removed = await repos.emailSuppressions.remove(tenantId, suppressionId, input);

  await repos.activities.append(tenantId, {
    entityType: "lead",
    entityId: existing.leadId ?? existing.id,
    action: "suppression_removed",
    title: `Suppression removed: ${existing.normalizedEmail}`,
    metadata: {
      suppressionId: existing.id,
      reason: existing.reason,
      removalReason: input.removalReason
    }
  });

  return removed;
}

export async function enforceSuppressionOnCampaignRecipients(
  repos: LocalRepositoryBundle,
  tenantId: string,
  normalizedEmail: string,
  suppression: EmailSuppression
): Promise<number> {
  const recipients = await repos.campaignRecipients.listForTenant(tenantId);
  let affected = 0;

  for (const recipient of recipients) {
    if (normalizeEmail(recipient.snapshotEmail) !== normalizedEmail) continue;
    if (recipient.draftStatus === "SENT_MANUALLY") continue;

    if (recipient.draftStatus === "APPROVED" || recipient.draftStatus === "OPENED_EXTERNALLY") {
      await invalidateRecipientApproval(
        repos,
        tenantId,
        recipient.id,
        `suppressed:${suppression.reason}`
      );
    }

    await repos.campaignRecipients.updateDraft(tenantId, recipient.id, {
      draftStatus: "SUPPRESSED"
    });
    affected += 1;
  }

  return affected;
}

export async function buildActiveSuppressedEmailSet(
  repos: LocalRepositoryBundle,
  tenantId: string
): Promise<Set<string>> {
  const rows = await repos.emailSuppressions.listActive(tenantId);
  return new Set(rows.map((row) => normalizeEmail(row.normalizedEmail)).filter(Boolean));
}
