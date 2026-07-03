import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acquireDurableSendJobLock,
  createDurableSendJob,
  createDurableSendJobAttempt,
  createDurableSendJobRecipients,
  incrementDurableSendJobDailyUsage,
  releaseDurableSendJobLock,
  type DurableStoreConfig
} from "./durable-outreach-store";

const config: DurableStoreConfig = {
  serviceRoleKey: "service-role-test-key",
  supabaseUrl: "https://db.example"
};

const timestamp = "2026-07-02T12:00:00.000Z";

function sendJobRow(overrides: Record<string, unknown> = {}) {
  return {
    approved_by: "operator",
    batch_size: 5,
    campaign_ref: "cmp_1",
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
    completed_at: null,
    created_at: timestamp,
    created_by: "operator",
    daily_limit: 25,
    delay_ms: 0,
    delivery_mode: "simulation",
    failed_count: 0,
    id: "00000000-0000-4000-8000-000000000001",
    last_processed_at: null,
    last_stop_reason: null,
    lock_acquired_at: null,
    lock_expires_at: null,
    lock_owner: null,
    max_retries: 2,
    paused_at: null,
    paused_by: null,
    pause_reason: null,
    processed_count: 0,
    provider: "simulation",
    queued_at: timestamp,
    remaining_count: 2,
    resumed_at: null,
    resumed_by: null,
    retry_pending_count: 0,
    sent_count: 0,
    skipped_count: 0,
    started_at: null,
    status: "QUEUED",
    tenant_id: "tenant_a",
    version: 1,
    ...overrides
  };
}

function response(body: unknown, ok = true): Response {
  return {
    json: async () => body,
    ok
  } as Response;
}

function fetchMock(body: unknown, ok = true) {
  const fetch = vi.fn(async (...args: [string, RequestInit]): Promise<Response> => {
    void args;
    return response(body, ok);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function fetchCall(fetch: ReturnType<typeof fetchMock>, index: number): [string, RequestInit] {
  return fetch.mock.calls[index];
}

describe("durable outreach store send jobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns not_configured when server Supabase credentials are unavailable", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const result = await createDurableSendJob({
      approvedBy: "operator",
      batchSize: 5,
      campaignId: "cmp_1",
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      completedAt: null,
      createdAt: timestamp,
      createdBy: "operator",
      dailyLimit: 25,
      delayMs: 0,
      deliveryMode: "simulation",
      lastProcessedAt: null,
      lastStopReason: null,
      maxRetries: 2,
      pausedAt: null,
      pausedBy: null,
      pauseReason: null,
      provider: "simulation",
      queuedAt: timestamp,
      remainingCount: 1,
      resumedAt: null,
      resumedBy: null,
      startedAt: null,
      status: "QUEUED",
      tenantId: "tenant_a"
    });

    expect(result).toEqual({ ok: false, reason: "not_configured" });
  });

  it("creates a durable send job through Supabase REST representation insert", async () => {
    const fetch = fetchMock([sendJobRow()]);

    const result = await createDurableSendJob(
      {
        approvedBy: "operator",
        batchSize: 5,
        campaignId: "cmp_1",
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
        completedAt: null,
        createdAt: timestamp,
        createdBy: "operator",
        dailyLimit: 25,
        delayMs: 0,
        deliveryMode: "simulation",
        lastProcessedAt: null,
        lastStopReason: null,
        maxRetries: 2,
        pausedAt: null,
        pausedBy: null,
        pauseReason: null,
        provider: "simulation",
        queuedAt: timestamp,
        remainingCount: 2,
        resumedAt: null,
        resumedBy: null,
        startedAt: null,
        status: "QUEUED",
        tenantId: "tenant_a"
      },
      config
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("00000000-0000-4000-8000-000000000001");
      expect(result.value.campaignId).toBe("cmp_1");
      expect(result.value.remainingCount).toBe(2);
    }
    expect(fetch).toHaveBeenCalledWith(
      "https://db.example/rest/v1/outreach_send_jobs",
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: "service-role-test-key",
          authorization: "Bearer service-role-test-key",
          prefer: "return=representation"
        }),
        method: "POST"
      })
    );
    expect(JSON.parse(String(fetchCall(fetch, 0)[1].body))).toMatchObject({
      campaign_ref: "cmp_1",
      delivery_mode: "simulation",
      tenant_id: "tenant_a"
    });
  });

  it("creates recipients and attempts without full provider payloads", async () => {
    const fetch = fetchMock([
      {
        approved_content_version: "hash",
        attempt_count: 0,
        campaign_recipient_ref: "cmr_1",
        campaign_ref: "cmp_1",
        completed_at: null,
        contact_ref: null,
        created_at: timestamp,
        id: "00000000-0000-4000-8000-000000000011",
        idempotency_key: "idem_1",
        last_error_code: null,
        last_error_message: null,
        lead_ref: "lead_1",
        next_attempt_at: null,
        normalized_email: "lead@example.invalid",
        processing_started_at: null,
        provider_message_id: null,
        queued_at: timestamp,
        send_job_id: "00000000-0000-4000-8000-000000000001",
        sent_at: null,
        status: "QUEUED",
        tenant_id: "tenant_a",
        updated_at: timestamp
      }
    ]);

    const recipients = await createDurableSendJobRecipients(
      [
        {
          approvedContentVersion: "hash",
          attemptCount: 0,
          campaignId: "cmp_1",
          campaignRecipientId: "cmr_1",
          completedAt: null,
          contactId: null,
          createdAt: timestamp,
          idempotencyKey: "idem_1",
          lastErrorCode: null,
          lastErrorMessage: null,
          leadId: "lead_1",
          nextAttemptAt: null,
          normalizedEmail: "lead@example.invalid",
          processingStartedAt: null,
          providerMessageId: null,
          queuedAt: timestamp,
          sendJobId: "00000000-0000-4000-8000-000000000001",
          sentAt: null,
          status: "QUEUED",
          tenantId: "tenant_a",
          updatedAt: timestamp
        }
      ],
      config
    );

    expect(recipients.ok).toBe(true);
    expect(JSON.parse(String(fetchCall(fetch, 0)[1].body))[0]).toMatchObject({
      idempotency_key: "idem_1",
      normalized_email: "lead@example.invalid"
    });

    fetch.mockResolvedValueOnce(
      response([
        {
          attempt_number: 1,
          campaign_recipient_ref: "cmr_1",
          campaign_ref: "cmp_1",
          completed_at: timestamp,
          delivery_mode: "simulation",
          id: "00000000-0000-4000-8000-000000000021",
          idempotency_key: "idem_1",
          lead_ref: "lead_1",
          provider: "simulation",
          provider_category: "none",
          provider_message_id: "msg_1",
          retryable: false,
          sanitized_error_code: null,
          sanitized_error_message: null,
          send_job_id: "00000000-0000-4000-8000-000000000001",
          send_job_recipient_id: "00000000-0000-4000-8000-000000000011",
          started_at: timestamp,
          status: "ACCEPTED",
          tenant_id: "tenant_a"
        }
      ])
    );

    const attempt = await createDurableSendJobAttempt(
      {
        attemptNumber: 1,
        campaignId: "cmp_1",
        campaignRecipientId: "cmr_1",
        completedAt: timestamp,
        deliveryMode: "simulation",
        idempotencyKey: "idem_1",
        leadId: "lead_1",
        provider: "simulation",
        providerCategory: "none",
        providerMessageId: "msg_1",
        retryable: false,
        sanitizedErrorCode: null,
        sanitizedErrorMessage: null,
        sendJobId: "00000000-0000-4000-8000-000000000001",
        sendJobRecipientId: "00000000-0000-4000-8000-000000000011",
        startedAt: timestamp,
        status: "ACCEPTED",
        tenantId: "tenant_a"
      },
      config
    );

    expect(attempt.ok).toBe(true);
    expect(String(fetchCall(fetch, 1)[0])).toContain("outreach_send_job_attempts");
    expect(String(fetchCall(fetch, 1)[1].body)).not.toContain("authorization");
  });

  it("uses RPC for lock acquisition and daily usage increments", async () => {
    const fetch = fetchMock([
      sendJobRow({
        lock_acquired_at: timestamp,
        lock_expires_at: "2026-07-02T12:01:00.000Z",
        lock_owner: "worker-a",
        version: 2
      })
    ]);

    const lock = await acquireDurableSendJobLock(
      "tenant_a",
      "00000000-0000-4000-8000-000000000001",
      "worker-a",
      "2026-07-02T12:01:00.000Z",
      config
    );

    expect(lock.ok).toBe(true);
    if (lock.ok) expect(lock.value?.lockOwner).toBe("worker-a");
    expect(fetch).toHaveBeenCalledWith(
      "https://db.example/rest/v1/rpc/acquire_outreach_send_job_lock",
      expect.objectContaining({ method: "POST" })
    );

    fetch.mockResolvedValueOnce(response([], true));
    await releaseDurableSendJobLock("tenant_a", "00000000-0000-4000-8000-000000000001", "worker-a", config);
    expect(String(fetchCall(fetch, 1)[0])).toContain("lock_owner=eq.worker-a");
    expect(fetchCall(fetch, 1)[1].method).toBe("PATCH");

    fetch.mockResolvedValueOnce(
      response([
        {
          id: "00000000-0000-4000-8000-000000000031",
          provider: "brevo",
          real_send_count: 3,
          tenant_id: "tenant_a",
          updated_at: timestamp,
          usage_date: "2026-07-02"
        }
      ])
    );
    const usage = await incrementDurableSendJobDailyUsage("tenant_a", "brevo", "2026-07-02", 1, config);
    expect(usage.ok).toBe(true);
    if (usage.ok) expect(usage.value.realSendCount).toBe(3);
    expect(String(fetchCall(fetch, 2)[0])).toContain("increment_outreach_send_job_daily_usage");
  });
});
