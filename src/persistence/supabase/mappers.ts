import { createHash } from "node:crypto";
import type {
  CampaignDraftGenerationMethod,
  CampaignDraftStatus,
  CampaignExternalClient,
  CampaignRecipient,
  CampaignRecipientDeliveryMode,
  CampaignRecipientStatus,
  CampaignStatus,
  OutreachCampaign,
  SegmentDefinition
} from "@/domain/campaign-types";
import type { OutreachSendAttempt, OutreachSendAttemptStatus } from "@/domain/email-delivery-types";
import type { ActivityEvent, ActivityAction, ActivityEntityType, CreateActivityEventInput } from "@/domain/types";

export function buildOutreachRequestFingerprint(input: {
  tenantId: string;
  messageVersion: string;
  recipientEmail: string;
  approvedSubject: string;
  approvedPlainText: string;
  approvedHtml?: string;
  provider: string;
}): string {
  const payload = [
    input.tenantId,
    input.messageVersion,
    input.recipientEmail.trim().toLowerCase(),
    input.approvedSubject,
    input.approvedPlainText,
    input.approvedHtml ?? "",
    input.provider
  ].join("\u001f");
  return createHash("sha256").update(payload).digest("hex");
}

type CampaignRow = Record<string, unknown>;
type RecipientRow = Record<string, unknown>;
type SendAttemptRow = Record<string, unknown>;
type ActivityRow = Record<string, unknown>;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function mapOutreachCampaignRow(row: CampaignRow): OutreachCampaign {
  return {
    id: str(row.id),
    tenantId: str(row.tenant_id),
    name: str(row.name),
    description: str(row.description),
    language: str(row.language, "pt-PT"),
    status: str(row.status, "draft") as CampaignStatus,
    segmentDefinition: (row.segment_definition as SegmentDefinition | null) ?? null,
    recipientSnapshotCreatedAt: strOrNull(row.recipient_snapshot_created_at),
    recipientSnapshotCount: typeof row.recipient_snapshot_count === "number" ? row.recipient_snapshot_count : 0,
    subjectTemplate: str(row.subject_template),
    plainTextTemplate: str(row.plain_text_template),
    htmlTemplate: str(row.html_template),
    templateVersion: typeof row.template_version === "number" ? row.template_version : 1,
    templateUpdatedAt: strOrNull(row.template_updated_at),
    fromName: str(row.from_name),
    senderProfileId: strOrNull(row.sender_profile_id),
    replyTo: str(row.reply_to),
    deliveryMode: str(row.delivery_mode, "simulation") as OutreachCampaign["deliveryMode"],
    createdBy: str(row.created_by, "system"),
    sentCount: typeof row.sent_count === "number" ? row.sent_count : 0,
    totalCount: typeof row.total_count === "number" ? row.total_count : 0,
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at)
  };
}

export function mapCampaignRecipientRow(row: RecipientRow): CampaignRecipient {
  return {
    id: str(row.id),
    tenantId: str(row.tenant_id),
    campaignId: str(row.campaign_id),
    leadId: str(row.lead_id),
    contactId: strOrNull(row.contact_id),
    snapshotEmail: str(row.snapshot_email),
    snapshotCompanyName: str(row.snapshot_company_name),
    snapshotContactName: str(row.snapshot_contact_name),
    snapshotCategory: str(row.snapshot_category),
    snapshotRegion: str(row.snapshot_region),
    snapshotWebsite: str(row.snapshot_website),
    greetingOverride: str(row.greeting_override),
    organizationDisplayNameOverride: str(row.organization_display_name_override),
    contactSalutation: (row.contact_salutation as CampaignRecipient["contactSalutation"]) ?? null,
    inclusionReason: str(row.inclusion_reason),
    status: str(row.recipient_status, "included") as CampaignRecipientStatus,
    personalizedSubject: str(row.personalized_subject),
    personalizedPlainText: str(row.personalized_plain_text),
    personalizedHtml: str(row.personalized_html),
    draftStatus: str(row.draft_status, "PENDING") as CampaignDraftStatus,
    generatedAt: strOrNull(row.generated_at),
    generationMethod: strOrNull(row.generation_method) as CampaignDraftGenerationMethod | null,
    templateVersion: numOrNull(row.template_version),
    userEdited: bool(row.user_edited),
    draftUpdatedAt: strOrNull(row.draft_updated_at),
    approvedAt: strOrNull(row.approved_at),
    approvedBy: strOrNull(row.approved_by),
    approvalContentHash: strOrNull(row.approval_content_hash),
    approvalInvalidatedAt: strOrNull(row.approval_invalidated_at),
    approvalInvalidationReason: strOrNull(row.approval_invalidation_reason),
    openedExternallyAt: strOrNull(row.opened_externally_at),
    externalClient: strOrNull(row.external_client) as CampaignExternalClient | null,
    sentAt: strOrNull(row.sent_at),
    sentBy: strOrNull(row.sent_by),
    recipientDeliveryMode: strOrNull(row.recipient_delivery_mode) as CampaignRecipientDeliveryMode | null,
    operatorNote: str(row.operator_note),
    simulatedAt: strOrNull(row.simulated_at),
    sendIdempotencyKey: strOrNull(row.send_idempotency_key),
    createdAt: str(row.created_at)
  };
}

export function mapRecipientDraftToRow(
  patch: Partial<CampaignRecipient>
): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.personalizedSubject !== undefined) row.personalized_subject = patch.personalizedSubject;
  if (patch.personalizedPlainText !== undefined) row.personalized_plain_text = patch.personalizedPlainText;
  if (patch.personalizedHtml !== undefined) row.personalized_html = patch.personalizedHtml;
  if (patch.draftStatus !== undefined) row.draft_status = patch.draftStatus;
  if (patch.approvedAt !== undefined) row.approved_at = patch.approvedAt;
  if (patch.approvedBy !== undefined) row.approved_by = patch.approvedBy;
  if (patch.approvalContentHash !== undefined) row.approval_content_hash = patch.approvalContentHash;
  if (patch.sentAt !== undefined) row.sent_at = patch.sentAt;
  if (patch.sentBy !== undefined) row.sent_by = patch.sentBy;
  if (patch.sendIdempotencyKey !== undefined) row.send_idempotency_key = patch.sendIdempotencyKey;
  if (patch.simulatedAt !== undefined) row.simulated_at = patch.simulatedAt;
  if (patch.recipientDeliveryMode !== undefined) row.recipient_delivery_mode = patch.recipientDeliveryMode;
  return row;
}

export function mapSendAttemptRow(row: SendAttemptRow): OutreachSendAttempt {
  return {
    id: str(row.id),
    tenantId: str(row.tenant_id),
    provider: str(row.provider, "simulation") as OutreachSendAttempt["provider"],
    deliveryMode: str(row.delivery_mode, "simulation") as OutreachSendAttempt["deliveryMode"],
    campaignId: str(row.campaign_id),
    campaignRecipientId: str(row.campaign_recipient_id),
    leadId: str(row.lead_id),
    approvedContentHash: str(row.approved_content_hash),
    actualDestinationEmail: str(row.actual_destination_email),
    idempotencyKey: str(row.idempotency_key),
    status: str(row.status) as OutreachSendAttemptStatus,
    startedAt: str(row.started_at),
    completedAt: str(row.completed_at, str(row.started_at)),
    providerMessageId: strOrNull(row.provider_message_id),
    retryable: bool(row.retryable),
    sanitizedErrorCode: strOrNull(row.sanitized_error_code) as OutreachSendAttempt["sanitizedErrorCode"],
    sanitizedErrorMessage: strOrNull(row.sanitized_error_message),
    initiatedBy: str(row.initiated_by)
  };
}

export function mapActivityRow(row: ActivityRow): ActivityEvent {
  return {
    id: str(row.id),
    tenantId: str(row.tenant_id),
    entityType: str(row.entity_type) as ActivityEntityType,
    entityId: str(row.entity_id),
    action: str(row.action) as ActivityAction,
    title: str(row.title),
    metadata: (row.metadata as ActivityEvent["metadata"]) ?? {},
    occurredAt: str(row.occurred_at)
  };
}

export function mapActivityInputToRow(
  tenantId: string,
  event: CreateActivityEventInput
): Record<string, unknown> {
  return {
    tenant_id: tenantId,
    entity_type: event.entityType,
    entity_id: event.entityId,
    action: event.action,
    title: event.title,
    metadata: event.metadata ?? {}
  };
}

export const OUTREACH_CAMPAIGN_COLUMNS =
  "id, tenant_id, name, description, language, status, segment_definition, recipient_snapshot_created_at, recipient_snapshot_count, subject_template, plain_text_template, html_template, template_version, template_updated_at, from_name, sender_profile_id, reply_to, delivery_mode, created_by, sent_count, total_count, created_at, updated_at";

export const OUTREACH_RECIPIENT_COLUMNS =
  "id, tenant_id, campaign_id, lead_id, contact_id, snapshot_email, snapshot_company_name, snapshot_contact_name, snapshot_category, snapshot_region, snapshot_website, greeting_override, organization_display_name_override, contact_salutation, inclusion_reason, recipient_status, personalized_subject, personalized_plain_text, personalized_html, draft_status, generated_at, generation_method, template_version, user_edited, draft_updated_at, approved_at, approved_by, approval_content_hash, approval_invalidated_at, approval_invalidation_reason, opened_externally_at, external_client, sent_at, sent_by, recipient_delivery_mode, operator_note, simulated_at, send_idempotency_key, created_at";

export const OUTREACH_SEND_ATTEMPT_COLUMNS =
  "id, tenant_id, campaign_id, campaign_recipient_id, lead_id, provider, delivery_mode, approved_content_hash, actual_destination_email, idempotency_key, status, request_fingerprint, started_at, completed_at, provider_message_id, retryable, sanitized_error_code, sanitized_error_message, initiated_by";
