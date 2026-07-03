import type {
  NormalizedProviderEvent
} from "@/features/email-delivery/provider-events";
import type { PublicUnsubscribeTokenClaims } from "@/domain/email-delivery-types";
import type {
  CreateOutreachSendJobAttemptInput,
  CreateOutreachSendJobInput,
  CreateOutreachSendJobRecipientInput,
  OutreachSendJob,
  OutreachSendJobAttempt,
  OutreachSendJobDailyUsage,
  OutreachSendJobRecipient
} from "@/domain/send-job-types";
import { createHash } from "node:crypto";
import { assertServerOnlyModule } from "./server-only";

assertServerOnlyModule();

export type DurableStoreConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

export type DurableStoreResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "request_failed" };

export type DurableStoreValueResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "not_configured" | "request_failed" };

export function readDurableStoreConfig(
  env: Record<string, string | undefined> = process.env
): DurableStoreConfig | null {
  const supabaseUrl = env.SUPABASE_URL?.trim() ?? env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!supabaseUrl || !serviceRoleKey) return null;
  return { serviceRoleKey, supabaseUrl: supabaseUrl.replace(/\/$/, "") };
}

export async function createDurableSuppressionFromTokenClaims(
  claims: PublicUnsubscribeTokenClaims,
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreResult> {
  if (!config) return { ok: false, reason: "not_configured" };
  const response = await supabaseFetch(
    config,
    "/rest/v1/outreach_public_suppressions?on_conflict=tenant_public_id,normalized_email_hash,reason",
    {
      active: true,
      campaign_ref: claims.campaignId,
      lead_ref: claims.leadId,
      normalized_email_hash: claims.emailHash,
      reason: "unsubscribe",
      recipient_ref: claims.campaignRecipientId,
      source: "public_unsubscribe",
      tenant_public_id: claims.tenantId,
      token_version: claims.version
    },
    "resolution=merge-duplicates,return=minimal"
  );
  return response.ok ? { ok: true } : { ok: false, reason: "request_failed" };
}

export async function createDurableProviderEvent(
  tenantId: string,
  event: NormalizedProviderEvent,
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreResult> {
  if (!config) return { ok: false, reason: "not_configured" };
  const response = await supabaseFetch(
    config,
    "/rest/v1/outreach_provider_events?on_conflict=tenant_public_id,event_fingerprint",
    {
      duplicate: false,
      event_fingerprint: event.eventFingerprint,
      event_type: event.eventType,
      normalized_email_hash: event.normalizedEmail ? hashNormalizedEmail(tenantId, event.normalizedEmail) : null,
      occurred_at: event.occurredAt,
      processing_status: "received",
      provider: event.provider,
      provider_event_id: event.providerEventId,
      provider_message_id: event.providerMessageId,
      received_at: new Date().toISOString(),
      sanitized_metadata: event.sanitizedMetadata,
      tenant_public_id: tenantId
    },
    "resolution=ignore-duplicates,return=minimal"
  );
  return response.ok ? { ok: true } : { ok: false, reason: "request_failed" };
}

export async function createDurableSendJob(
  input: CreateOutreachSendJobInput,
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreValueResult<OutreachSendJob>> {
  if (!config) return { ok: false, reason: "not_configured" };
  const response = await supabaseFetch(
    config,
    "/rest/v1/outreach_send_jobs",
    toSendJobRow(input),
    "return=representation",
    "POST"
  );
  return mapSingleResponse(response, fromSendJobRow);
}

export async function createDurableSendJobRecipients(
  inputs: CreateOutreachSendJobRecipientInput[],
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreValueResult<OutreachSendJobRecipient[]>> {
  if (!config) return { ok: false, reason: "not_configured" };
  if (inputs.length === 0) return { ok: true, value: [] };
  const response = await supabaseFetch(
    config,
    "/rest/v1/outreach_send_job_recipients",
    inputs.map(toSendJobRecipientRow),
    "return=representation",
    "POST"
  );
  return mapArrayResponse(response, fromSendJobRecipientRow);
}

export async function createDurableSendJobAttempt(
  input: CreateOutreachSendJobAttemptInput,
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreValueResult<OutreachSendJobAttempt>> {
  if (!config) return { ok: false, reason: "not_configured" };
  const response = await supabaseFetch(
    config,
    "/rest/v1/outreach_send_job_attempts?on_conflict=tenant_id,idempotency_key",
    toSendJobAttemptRow(input),
    "resolution=ignore-duplicates,return=representation",
    "POST"
  );
  return mapSingleResponse(response, fromSendJobAttemptRow);
}

export async function acquireDurableSendJobLock(
  tenantId: string,
  sendJobId: string,
  owner: string,
  expiresAt: string,
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreValueResult<OutreachSendJob | null>> {
  if (!config) return { ok: false, reason: "not_configured" };
  const response = await supabaseFetch(
    config,
    "/rest/v1/rpc/acquire_outreach_send_job_lock",
    {
      p_expires_at: expiresAt,
      p_job_id: sendJobId,
      p_owner: owner,
      p_tenant_id: tenantId
    },
    "return=representation",
    "POST"
  );
  const result = await mapArrayResponse(response, fromSendJobRow);
  if (!result.ok) return result;
  return { ok: true, value: result.value[0] ?? null };
}

export async function releaseDurableSendJobLock(
  tenantId: string,
  sendJobId: string,
  owner: string,
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreResult> {
  if (!config) return { ok: false, reason: "not_configured" };
  const query = `/rest/v1/outreach_send_jobs?tenant_id=eq.${encodeURIComponent(tenantId)}&id=eq.${encodeURIComponent(
    sendJobId
  )}&lock_owner=eq.${encodeURIComponent(owner)}`;
  const response = await supabaseFetch(
    config,
    query,
    {
      lock_acquired_at: null,
      lock_expires_at: null,
      lock_owner: null
    },
    "return=minimal",
    "PATCH"
  );
  return response.ok ? { ok: true } : { ok: false, reason: "request_failed" };
}

export async function incrementDurableSendJobDailyUsage(
  tenantId: string,
  provider: "brevo",
  usageDate: string,
  count: number,
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<DurableStoreValueResult<OutreachSendJobDailyUsage>> {
  if (!config) return { ok: false, reason: "not_configured" };
  const response = await supabaseFetch(
    config,
    "/rest/v1/rpc/increment_outreach_send_job_daily_usage",
    {
      p_count: count,
      p_provider: provider,
      p_tenant_id: tenantId,
      p_usage_date: usageDate
    },
    "return=representation",
    "POST"
  );
  return mapSingleResponse(response, fromDailyUsageRow);
}

function hashNormalizedEmail(tenantId: string, normalizedEmail: string): string {
  return createHash("sha256").update(`${tenantId}:${normalizedEmail}`).digest("hex");
}

async function supabaseFetch(
  config: DurableStoreConfig,
  path: string,
  body: Record<string, unknown> | Record<string, unknown>[],
  prefer: string,
  method = "POST"
): Promise<Response> {
  return fetch(`${config.supabaseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      "content-type": "application/json",
      prefer
    },
    method
  });
}

async function mapSingleResponse<T>(
  response: Response,
  mapper: (row: Record<string, unknown>) => T
): Promise<DurableStoreValueResult<T>> {
  const rows = await mapArrayResponse(response, mapper);
  if (!rows.ok) return rows;
  const first = rows.value[0];
  return first ? { ok: true, value: first } : { ok: false, reason: "request_failed" };
}

async function mapArrayResponse<T>(
  response: Response,
  mapper: (row: Record<string, unknown>) => T
): Promise<DurableStoreValueResult<T[]>> {
  if (!response.ok) return { ok: false, reason: "request_failed" };
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!Array.isArray(payload)) return { ok: false, reason: "request_failed" };
  return {
    ok: true,
    value: payload.map((row) => mapper(row as Record<string, unknown>))
  };
}

function toSendJobRow(input: CreateOutreachSendJobInput): Record<string, unknown> {
  return {
    approved_by: input.approvedBy,
    batch_size: input.batchSize,
    campaign_ref: input.campaignId,
    cancelled_at: input.cancelledAt,
    cancelled_by: input.cancelledBy,
    cancel_reason: input.cancelReason,
    completed_at: input.completedAt,
    created_at: input.createdAt,
    created_by: input.createdBy,
    daily_limit: input.dailyLimit,
    delay_ms: input.delayMs,
    delivery_mode: input.deliveryMode,
    last_processed_at: input.lastProcessedAt,
    last_stop_reason: input.lastStopReason,
    max_retries: input.maxRetries,
    paused_at: input.pausedAt,
    paused_by: input.pausedBy,
    pause_reason: input.pauseReason,
    provider: input.provider,
    queued_at: input.queuedAt,
    remaining_count: input.remainingCount,
    resumed_at: input.resumedAt,
    resumed_by: input.resumedBy,
    started_at: input.startedAt,
    status: input.status,
    tenant_id: input.tenantId
  };
}

function toSendJobRecipientRow(input: CreateOutreachSendJobRecipientInput): Record<string, unknown> {
  return {
    approved_content_version: input.approvedContentVersion,
    attempt_count: input.attemptCount,
    campaign_recipient_ref: input.campaignRecipientId,
    campaign_ref: input.campaignId,
    completed_at: input.completedAt,
    contact_ref: input.contactId,
    created_at: input.createdAt,
    idempotency_key: input.idempotencyKey,
    last_error_code: input.lastErrorCode,
    last_error_message: input.lastErrorMessage,
    lead_ref: input.leadId,
    next_attempt_at: input.nextAttemptAt,
    normalized_email: input.normalizedEmail,
    processing_started_at: input.processingStartedAt,
    provider_message_id: input.providerMessageId,
    queued_at: input.queuedAt,
    send_job_id: input.sendJobId,
    sent_at: input.sentAt,
    status: input.status,
    tenant_id: input.tenantId,
    updated_at: input.updatedAt
  };
}

function toSendJobAttemptRow(input: CreateOutreachSendJobAttemptInput): Record<string, unknown> {
  return {
    attempt_number: input.attemptNumber,
    campaign_recipient_ref: input.campaignRecipientId,
    campaign_ref: input.campaignId,
    completed_at: input.completedAt,
    delivery_mode: input.deliveryMode,
    idempotency_key: input.idempotencyKey,
    lead_ref: input.leadId,
    provider: input.provider,
    provider_category: input.providerCategory,
    provider_message_id: input.providerMessageId,
    retryable: input.retryable,
    sanitized_error_code: input.sanitizedErrorCode,
    sanitized_error_message: input.sanitizedErrorMessage,
    send_job_id: input.sendJobId,
    send_job_recipient_id: input.sendJobRecipientId,
    started_at: input.startedAt,
    status: input.status,
    tenant_id: input.tenantId
  };
}

function fromSendJobRow(row: Record<string, unknown>): OutreachSendJob {
  return {
    approvedBy: stringOrNull(row.approved_by),
    batchSize: numberValue(row.batch_size),
    campaignId: stringValue(row.campaign_ref),
    cancelledAt: stringOrNull(row.cancelled_at),
    cancelledBy: stringOrNull(row.cancelled_by),
    cancelReason: stringOrNull(row.cancel_reason),
    completedAt: stringOrNull(row.completed_at),
    createdAt: stringValue(row.created_at),
    createdBy: stringValue(row.created_by),
    dailyLimit: numberValue(row.daily_limit),
    delayMs: numberValue(row.delay_ms),
    deliveryMode: stringValue(row.delivery_mode) as OutreachSendJob["deliveryMode"],
    failedCount: numberValue(row.failed_count),
    id: stringValue(row.id),
    lastProcessedAt: stringOrNull(row.last_processed_at),
    lastStopReason: stringOrNull(row.last_stop_reason),
    lockAcquiredAt: stringOrNull(row.lock_acquired_at),
    lockExpiresAt: stringOrNull(row.lock_expires_at),
    lockOwner: stringOrNull(row.lock_owner),
    maxRetries: numberValue(row.max_retries),
    pausedAt: stringOrNull(row.paused_at),
    pausedBy: stringOrNull(row.paused_by),
    pauseReason: stringOrNull(row.pause_reason),
    processedCount: numberValue(row.processed_count),
    provider: stringValue(row.provider) as OutreachSendJob["provider"],
    queuedAt: stringOrNull(row.queued_at),
    remainingCount: numberValue(row.remaining_count),
    resumedAt: stringOrNull(row.resumed_at),
    resumedBy: stringOrNull(row.resumed_by),
    retryPendingCount: numberValue(row.retry_pending_count),
    sentCount: numberValue(row.sent_count),
    skippedCount: numberValue(row.skipped_count),
    startedAt: stringOrNull(row.started_at),
    status: stringValue(row.status) as OutreachSendJob["status"],
    tenantId: stringValue(row.tenant_id),
    version: numberValue(row.version)
  };
}

function fromSendJobRecipientRow(row: Record<string, unknown>): OutreachSendJobRecipient {
  return {
    approvedContentVersion: stringValue(row.approved_content_version),
    attemptCount: numberValue(row.attempt_count),
    campaignId: stringValue(row.campaign_ref),
    campaignRecipientId: stringValue(row.campaign_recipient_ref),
    completedAt: stringOrNull(row.completed_at),
    contactId: stringOrNull(row.contact_ref),
    createdAt: stringValue(row.created_at),
    id: stringValue(row.id),
    idempotencyKey: stringValue(row.idempotency_key),
    lastErrorCode: stringOrNull(row.last_error_code) as OutreachSendJobRecipient["lastErrorCode"],
    lastErrorMessage: stringOrNull(row.last_error_message),
    leadId: stringValue(row.lead_ref),
    nextAttemptAt: stringOrNull(row.next_attempt_at),
    normalizedEmail: stringValue(row.normalized_email),
    processingStartedAt: stringOrNull(row.processing_started_at),
    providerMessageId: stringOrNull(row.provider_message_id),
    queuedAt: stringValue(row.queued_at),
    sendJobId: stringValue(row.send_job_id),
    sentAt: stringOrNull(row.sent_at),
    status: stringValue(row.status) as OutreachSendJobRecipient["status"],
    tenantId: stringValue(row.tenant_id),
    updatedAt: stringValue(row.updated_at)
  };
}

function fromSendJobAttemptRow(row: Record<string, unknown>): OutreachSendJobAttempt {
  return {
    attemptNumber: numberValue(row.attempt_number),
    campaignId: stringValue(row.campaign_ref),
    campaignRecipientId: stringValue(row.campaign_recipient_ref),
    completedAt: stringValue(row.completed_at),
    deliveryMode: stringValue(row.delivery_mode) as OutreachSendJobAttempt["deliveryMode"],
    id: stringValue(row.id),
    idempotencyKey: stringValue(row.idempotency_key),
    leadId: stringValue(row.lead_ref),
    provider: stringValue(row.provider) as OutreachSendJobAttempt["provider"],
    providerCategory: stringValue(row.provider_category),
    providerMessageId: stringOrNull(row.provider_message_id),
    retryable: Boolean(row.retryable),
    sanitizedErrorCode: stringOrNull(row.sanitized_error_code) as OutreachSendJobAttempt["sanitizedErrorCode"],
    sanitizedErrorMessage: stringOrNull(row.sanitized_error_message),
    sendJobId: stringValue(row.send_job_id),
    sendJobRecipientId: stringValue(row.send_job_recipient_id),
    startedAt: stringValue(row.started_at),
    status: stringValue(row.status) as OutreachSendJobAttempt["status"],
    tenantId: stringValue(row.tenant_id)
  };
}

function fromDailyUsageRow(row: Record<string, unknown>): OutreachSendJobDailyUsage {
  return {
    id: stringValue(row.id),
    provider: stringValue(row.provider) as OutreachSendJobDailyUsage["provider"],
    realSendCount: numberValue(row.real_send_count),
    tenantId: stringValue(row.tenant_id),
    updatedAt: stringValue(row.updated_at),
    usageDate: stringValue(row.usage_date)
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
