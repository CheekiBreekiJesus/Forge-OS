import type {
  NormalizedProviderEvent
} from "@/features/email-delivery/provider-events";
import type { PublicUnsubscribeTokenClaims } from "@/domain/email-delivery-types";
import { createHash } from "node:crypto";
import { assertServerOnlyModule } from "./server-only";

assertServerOnlyModule();

type DurableStoreConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

export type DurableStoreResult =
  | { ok: true }
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

function hashNormalizedEmail(tenantId: string, normalizedEmail: string): string {
  return createHash("sha256").update(`${tenantId}:${normalizedEmail}`).digest("hex");
}

async function supabaseFetch(
  config: DurableStoreConfig,
  path: string,
  body: Record<string, unknown>,
  prefer: string
): Promise<Response> {
  return fetch(`${config.supabaseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      "content-type": "application/json",
      prefer
    },
    method: "POST"
  });
}
