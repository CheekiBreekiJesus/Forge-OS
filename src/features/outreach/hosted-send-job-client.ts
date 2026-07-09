import type { EmailProviderDiagnostic } from "@/domain/email-delivery-types";

export type HostedSendJobSummary = {
  campaignId: string;
  deliveryMode: "brevo" | "simulation";
  failedCount: number;
  id: string;
  processedCount: number;
  provider: string;
  remainingCount: number;
  retryPendingCount: number;
  sentCount: number;
  skippedCount: number;
  status: string;
};

type ApiEnvelope<T> =
  | { ok: true; result: T }
  | { ok: false; error?: { code?: string; message?: string } };

function hostedHeaders(selectedTenantId?: string): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (selectedTenantId?.trim()) {
    headers["x-forgeos-selected-tenant-id"] = selectedTenantId.trim();
  }
  return headers;
}

async function parseEnvelope<T>(response: Response): Promise<{ payload: ApiEnvelope<T> | null; response: Response }> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  return { payload, response };
}

export function hostedSendJobErrorMessage(payload: ApiEnvelope<unknown> | null): string | null {
  if (!payload || payload.ok) return null;
  return payload.error?.message ?? "Hosted send-job request failed.";
}

export function isRealCampaignSendReadyFromDiagnostic(
  diagnostic: EmailProviderDiagnostic | null
): boolean {
  if (!diagnostic) return false;
  return (
    diagnostic.provider === "brevo" &&
    diagnostic.configured &&
    diagnostic.realSendEnabled &&
    diagnostic.publicBaseUrlConfigured &&
    diagnostic.unsubscribeSecretConfigured
  );
}

export async function fetchHostedCampaignSendJobs(
  campaignId: string,
  selectedTenantId?: string
): Promise<HostedSendJobSummary[]> {
  const response = await fetch(
    `/api/outreach/send-jobs/campaign?campaignId=${encodeURIComponent(campaignId)}`,
    {
      credentials: "include",
      headers: hostedHeaders(selectedTenantId)
    }
  );
  const { payload } = await parseEnvelope<{ jobs: HostedSendJobSummary[] }>(response);
  if (!response.ok || !payload?.ok) return [];
  return payload.result.jobs;
}

export type QueueHostedSendJobInput = {
  batchSize: number;
  campaignId: string;
  confirmation: "QUEUE BREVO" | "QUEUE SIMULATION";
  dailyLimit?: number;
  delayMs: number;
  deliveryMode: "brevo" | "simulation";
  maxRetries?: number;
  provider: "brevo" | "simulation";
  selectedTenantId?: string;
};

export async function queueHostedCampaignSendJob(input: QueueHostedSendJobInput) {
  const response = await fetch("/api/outreach/send-jobs/queue", {
    body: JSON.stringify({
      batchSize: input.batchSize,
      campaignId: input.campaignId,
      confirmation: input.confirmation,
      dailyLimit: input.dailyLimit,
      delayMs: input.delayMs,
      deliveryMode: input.deliveryMode,
      maxRetries: input.maxRetries,
      provider: input.provider
    }),
    credentials: "include",
    headers: hostedHeaders(input.selectedTenantId),
    method: "POST"
  });
  const { payload } = await parseEnvelope<{
    alreadyQueued: boolean;
    job: HostedSendJobSummary;
  }>(response);
  return { payload, response };
}

export async function processHostedSendJobBatch(jobId: string, selectedTenantId?: string) {
  const response = await fetch("/api/outreach/send-jobs/process", {
    body: JSON.stringify({ jobId }),
    credentials: "include",
    headers: hostedHeaders(selectedTenantId),
    method: "POST"
  });
  const { payload } = await parseEnvelope<{
    failed: number;
    job: HostedSendJobSummary;
    processed: number;
    sent: number;
    stopReason: string;
  }>(response);
  return { payload, response };
}

export async function pauseHostedSendJob(jobId: string, reason: string, selectedTenantId?: string) {
  const response = await fetch("/api/outreach/send-jobs/pause", {
    body: JSON.stringify({ jobId, reason }),
    credentials: "include",
    headers: hostedHeaders(selectedTenantId),
    method: "POST"
  });
  const { payload } = await parseEnvelope<{ job: HostedSendJobSummary }>(response);
  return { payload, response };
}

export async function resumeHostedSendJob(jobId: string, selectedTenantId?: string) {
  const response = await fetch("/api/outreach/send-jobs/resume", {
    body: JSON.stringify({ jobId }),
    credentials: "include",
    headers: hostedHeaders(selectedTenantId),
    method: "POST"
  });
  const { payload } = await parseEnvelope<{ job: HostedSendJobSummary }>(response);
  return { payload, response };
}

export async function cancelHostedSendJob(jobId: string, reason: string, selectedTenantId?: string) {
  const response = await fetch("/api/outreach/send-jobs/cancel", {
    body: JSON.stringify({ jobId, reason }),
    credentials: "include",
    headers: hostedHeaders(selectedTenantId),
    method: "POST"
  });
  const { payload } = await parseEnvelope<{ job: HostedSendJobSummary }>(response);
  return { payload, response };
}
