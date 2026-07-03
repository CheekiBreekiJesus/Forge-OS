import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UpdateCampaignRecipientDraftInput
} from "@/domain/campaign-types";
import type {
  CreateOutreachSendAttemptInput,
  OutreachSendAttempt
} from "@/domain/email-delivery-types";
import type { CampaignRecipientRepository } from "@/persistence/indexeddb/campaign-repositories";
import { PersistenceError, type CampaignRepository } from "@/persistence/interfaces";
import {
  mapCampaignRecipientRow,
  mapOutreachCampaignRow,
  mapRecipientDraftToRow,
  mapSendAttemptRow,
  OUTREACH_CAMPAIGN_COLUMNS,
  OUTREACH_RECIPIENT_COLUMNS
} from "./mappers";

export function createSupabaseOutreachCampaignRepository(
  client: SupabaseClient
): CampaignRepository {
  return {
    async list(tenantId) {
      const { data, error } = await client
        .from("outreach_campaigns")
        .select(OUTREACH_CAMPAIGN_COLUMNS)
        .eq("tenant_id", tenantId);
      if (error) throw new PersistenceError("unavailable", error.message);
      return (data ?? []).map((row) => mapOutreachCampaignRow(row));
    },
    async getById(tenantId, campaignId) {
      const { data, error } = await client
        .from("outreach_campaigns")
        .select(OUTREACH_CAMPAIGN_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("id", campaignId)
        .maybeSingle();
      if (error) throw new PersistenceError("unavailable", error.message);
      return data ? mapOutreachCampaignRow(data) : null;
    },
    async create() {
      throw new PersistenceError("unavailable", "Campaign create not implemented for Supabase.");
    },
    async update(tenantId, campaignId, patch) {
      const { data, error } = await client
        .from("outreach_campaigns")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", campaignId)
        .select(OUTREACH_CAMPAIGN_COLUMNS)
        .maybeSingle();
      if (error) throw new PersistenceError("unavailable", error.message);
      if (!data) throw new PersistenceError("not_found", "Campaign not found.");
      return mapOutreachCampaignRow(data);
    }
  };
}

export function createSupabaseCampaignRecipientRepository(
  client: SupabaseClient
): CampaignRecipientRepository {
  return {
    async listForCampaign(tenantId, campaignId) {
      const { data, error } = await client
        .from("outreach_campaign_recipients")
        .select(OUTREACH_RECIPIENT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("campaign_id", campaignId);
      if (error) throw new PersistenceError("unavailable", error.message);
      return (data ?? []).map((row) => mapCampaignRecipientRow(row));
    },
    async listForTenant(tenantId) {
      const { data, error } = await client
        .from("outreach_campaign_recipients")
        .select(OUTREACH_RECIPIENT_COLUMNS)
        .eq("tenant_id", tenantId);
      if (error) throw new PersistenceError("unavailable", error.message);
      return (data ?? []).map((row) => mapCampaignRecipientRow(row));
    },
    async getById(tenantId, recipientId) {
      const { data, error } = await client
        .from("outreach_campaign_recipients")
        .select(OUTREACH_RECIPIENT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("id", recipientId)
        .maybeSingle();
      if (error) throw new PersistenceError("unavailable", error.message);
      return data ? mapCampaignRecipientRow(data) : null;
    },
    async updateDraft(tenantId, recipientId, patch: UpdateCampaignRecipientDraftInput) {
      const { data, error } = await client
        .from("outreach_campaign_recipients")
        .update(mapRecipientDraftToRow(patch))
        .eq("tenant_id", tenantId)
        .eq("id", recipientId)
        .select(OUTREACH_RECIPIENT_COLUMNS)
        .maybeSingle();
      if (error) throw new PersistenceError("unavailable", error.message);
      if (!data) throw new PersistenceError("not_found", "Recipient not found.");
      return mapCampaignRecipientRow(data);
    },
    async replaceForCampaign() {
      throw new PersistenceError("unavailable", "Recipient replace not implemented for Supabase.");
    }
  };
}

export type DeliveryClaimResult =
  | { result: "claimed"; attemptId: string; idempotencyKey: string; reclaimed: boolean }
  | { result: "already_processed"; attemptId?: string; idempotencyKey: string; providerMessageId?: string | null }
  | { result: "blocked" | "conflict" | "forbidden" | "not_found"; reason: string };

export async function claimOutreachDeliveryAttempt(
  client: SupabaseClient,
  input: {
    tenantId: string;
    campaignId: string;
    recipientId: string;
    leadId: string;
    messageVersion: string;
    idempotencyKey: string;
    requestFingerprint: string;
    initiatedBy: string;
    destinationEmail: string;
  }
): Promise<DeliveryClaimResult> {
  const { data, error } = await client.rpc("claim_outreach_send_attempt", {
    p_tenant_id: input.tenantId,
    p_campaign_id: input.campaignId,
    p_recipient_id: input.recipientId,
    p_lead_id: input.leadId,
    p_message_version: input.messageVersion,
    p_idempotency_key: input.idempotencyKey,
    p_request_fingerprint: input.requestFingerprint,
    p_initiated_by: input.initiatedBy,
    p_destination_email: input.destinationEmail
  });

  if (error) {
    throw new PersistenceError("unavailable", error.message);
  }

  const payload = data as Record<string, unknown>;
  const result = String(payload.result ?? "not_found");

  if (result === "claimed") {
    return {
      result: "claimed",
      attemptId: String(payload.attempt_id),
      idempotencyKey: String(payload.idempotency_key),
      reclaimed: Boolean(payload.reclaimed)
    };
  }

  if (result === "already_processed") {
    return {
      result: "already_processed",
      attemptId: payload.attempt_id ? String(payload.attempt_id) : undefined,
      idempotencyKey: String(payload.idempotency_key ?? input.idempotencyKey),
      providerMessageId: payload.provider_message_id ? String(payload.provider_message_id) : null
    };
  }

  return {
    result: result as "blocked" | "conflict" | "forbidden" | "not_found",
    reason: String(payload.reason ?? result)
  };
}

export async function completeOutreachDeliveryAttempt(
  client: SupabaseClient,
  input: {
    tenantId: string;
    attemptId: string;
    status: OutreachSendAttempt["status"];
    providerMessageId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    recipientId: string;
    sentBy: string;
    idempotencyKey: string;
  }
): Promise<void> {
  const { error } = await client.rpc("complete_outreach_send_attempt", {
    p_tenant_id: input.tenantId,
    p_attempt_id: input.attemptId,
    p_status: input.status,
    p_provider_message_id: input.providerMessageId,
    p_error_code: input.errorCode,
    p_error_message: input.errorMessage,
    p_recipient_id: input.recipientId,
    p_sent_by: input.sentBy,
    p_idempotency_key: input.idempotencyKey
  });

  if (error) {
    throw new PersistenceError("unavailable", error.message);
  }
}

export function createSupabaseOutreachSendAttemptRepository(client: SupabaseClient) {
  return {
    async listForTenant(tenantId: string) {
      const { data, error } = await client
        .from("outreach_send_attempts")
        .select("*")
        .eq("tenant_id", tenantId);
      if (error) throw new PersistenceError("unavailable", error.message);
      return (data ?? []).map((row) => mapSendAttemptRow(row));
    },
    async listForRecipient(tenantId: string, campaignRecipientId: string) {
      const { data, error } = await client
        .from("outreach_send_attempts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("campaign_recipient_id", campaignRecipientId);
      if (error) throw new PersistenceError("unavailable", error.message);
      return (data ?? []).map((row) => mapSendAttemptRow(row));
    },
    async getByIdempotencyKey(tenantId: string, idempotencyKey: string) {
      const { data, error } = await client
        .from("outreach_send_attempts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (error) throw new PersistenceError("unavailable", error.message);
      return data ? mapSendAttemptRow(data) : null;
    },
    async create(input: CreateOutreachSendAttemptInput) {
      const { data, error } = await client
        .from("outreach_send_attempts")
        .insert({
          tenant_id: input.tenantId,
          campaign_id: input.campaignId,
          campaign_recipient_id: input.campaignRecipientId,
          lead_id: input.leadId,
          provider: input.provider,
          delivery_mode: input.deliveryMode,
          approved_content_hash: input.approvedContentHash,
          actual_destination_email: input.actualDestinationEmail,
          idempotency_key: input.idempotencyKey,
          status: input.status,
          started_at: input.startedAt,
          completed_at: input.completedAt,
          provider_message_id: input.providerMessageId,
          retryable: input.retryable,
          sanitized_error_code: input.sanitizedErrorCode,
          sanitized_error_message: input.sanitizedErrorMessage,
          initiated_by: input.initiatedBy
        })
        .select("*")
        .single();
      if (error) throw new PersistenceError("unavailable", error.message);
      return mapSendAttemptRow(data);
    },
    claim: (input: Parameters<typeof claimOutreachDeliveryAttempt>[1]) =>
      claimOutreachDeliveryAttempt(client, input),
    complete: (input: Parameters<typeof completeOutreachDeliveryAttempt>[1]) =>
      completeOutreachDeliveryAttempt(client, input)
  };
}
