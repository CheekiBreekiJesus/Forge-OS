import { createHash } from "node:crypto";
import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import type {
  CampaignRecipient,
  OutreachCampaign,
  UpdateCampaignRecipientDraftInput
} from "@/domain/campaign-types";
import type {
  CompanyProfile,
  SenderIdentity,
} from "@/domain/profile-types";
import type {
  CreateOutreachSendJobAttemptInput,
  CreateOutreachSendJobInput,
  CreateOutreachSendJobRecipientInput,
  OutreachSendJob,
  OutreachSendJobAttempt,
  OutreachSendJobDailyUsage,
  OutreachSendJobRecipient,
  OutreachSendJobRecipientStatus
} from "@/domain/send-job-types";
import type { ActivityEvent, CreateActivityEventInput } from "@/domain/types";
import type { EmailSuppression } from "@/domain/suppression-types";
import { readEmailDeliveryConfig } from "@/features/email-delivery/config";
import { readDurableStoreConfig, type DurableStoreConfig } from "@/features/email-delivery/durable-outreach-store";
import { SimulationEmailDeliveryProvider } from "@/features/email-delivery/simulation-provider";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";
import type { SendJobServerMutationDependencies } from "@/application/send-job-server-mutations";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

assertServerOnlyModule();

const ACTIVE_JOB_STATUSES = ["DRAFT", "READY", "QUEUED", "PROCESSING", "PAUSED"];

type JsonRow = Record<string, unknown>;

export type HostedCampaignProjectionInput = {
  campaign: OutreachCampaign;
  recipients: CampaignRecipient[];
  company: Pick<CompanyProfile, "legalName" | "tradingName" | "generalEmail" | "websiteUrl" | "legalFooter">;
  sender: Pick<SenderIdentity, "id" | "displayName" | "fromEmail" | "replyToEmail" | "signatureText" | "signatureHtml">;
};

export type HostedCampaignProjectionResult = {
  campaignId: string;
  preparedAt: string;
  preparedRecipients: number;
  reused: boolean;
  snapshotFingerprint: string;
};

export type HostedCampaignPreparationStatus = {
  campaignId: string;
  preparedAt: string | null;
  preparedBy: string | null;
  preparedRecipients: number;
  snapshotFingerprint: string | null;
  status: "not_prepared" | "prepared";
  activity: Array<{
    action: string;
    occurredAt: string;
    title: string;
  }>;
};

export function createHostedSendJobServerDependencies(
  config: DurableStoreConfig | null = readDurableStoreConfig()
): SendJobServerMutationDependencies | null {
  if (!config) return null;
  const deliveryConfig = {
    ...readEmailDeliveryConfig(),
    provider: "simulation" as const,
    realSendEnabled: false,
    testSendEnabled: false
  };
  return {
    provider: new SimulationEmailDeliveryProvider(deliveryConfig),
    repos: createHostedSendJobRepositoryBundle(config)
  };
}

export function createHostedSendJobRepositoryBundle(config: DurableStoreConfig): LocalRepositoryBundle {
  const client = createRestClient(config);
  return {
    activities: createHostedActivityRepository(client),
    campaignRecipients: createHostedCampaignRecipientRepository(client),
    campaigns: createHostedCampaignRepository(client),
    companyProfiles: createHostedCompanyProfileRepository(client),
    emailSuppressions: createHostedSuppressionRepository(client),
    outreachSendJobAttempts: createHostedSendJobAttemptRepository(client),
    outreachSendJobDailyUsage: createHostedDailyUsageRepository(client),
    outreachSendJobRecipients: createHostedSendJobRecipientRepository(client),
    outreachSendJobs: createHostedSendJobRepository(client),
    senderIdentities: createHostedSenderIdentityRepository(client),
    reset: unsupportedAsync("reset"),
    resetDemoData: unsupportedAsync("resetDemoData"),
    seed: unsupportedAsync("seed")
  } as unknown as LocalRepositoryBundle;
}

export async function prepareHostedCampaignProjection(
  input: HostedCampaignProjectionInput,
  actor: { tenantId: string; userId: string },
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<HostedCampaignProjectionResult> {
  if (!config) throw new PersistenceError("unavailable", "Hosted outreach persistence is not configured.");
  validateHostedProjection(input, actor.tenantId);
  const client = createRestClient(config);
  const timestamp = new Date().toISOString();
  const snapshotFingerprint = buildHostedCampaignProjectionFingerprint(input);
  const existing = await loadHostedCampaignPreparation(client, actor.tenantId, input.campaign.id);
  if (existing?.snapshotFingerprint === snapshotFingerprint) {
    await appendHostedPreparationActivity(client, actor, input.campaign.id, "campaign_server_send_prepare_reused", {
      preparedRecipients: existing.preparedRecipients,
      snapshotFingerprint
    });
    return {
      campaignId: input.campaign.id,
      preparedAt: existing.preparedAt ?? timestamp,
      preparedRecipients: existing.preparedRecipients,
      reused: true,
      snapshotFingerprint
    };
  }
  await client.post(
    "/rest/v1/outreach_hosted_campaigns?on_conflict=tenant_id,campaign_ref",
    toHostedCampaignRow(input, actor, timestamp, snapshotFingerprint),
    fromHostedCampaignRow,
    "resolution=merge-duplicates,return=representation"
  );
  await client.delete(
    `/rest/v1/outreach_hosted_campaign_recipients?tenant_id=eq.${e(actor.tenantId)}&campaign_ref=eq.${e(input.campaign.id)}`
  );
  const rows = input.recipients.map((recipient) => toHostedRecipientRow(input.campaign, recipient, actor.tenantId, timestamp));
  if (rows.length > 0) {
    await client.post(
      "/rest/v1/outreach_hosted_campaign_recipients?on_conflict=tenant_id,campaign_ref,campaign_recipient_ref",
      rows,
      fromHostedRecipientRow,
      "resolution=merge-duplicates,return=representation"
    );
  }
  await appendHostedPreparationActivity(client, actor, input.campaign.id, "campaign_server_send_prepared", {
    preparedRecipients: rows.length,
    snapshotFingerprint
  });
  return {
    campaignId: input.campaign.id,
    preparedAt: timestamp,
    preparedRecipients: rows.length,
    reused: false,
    snapshotFingerprint
  };
}

export async function getHostedCampaignPreparationStatus(
  campaignId: string,
  actor: { tenantId: string },
  config: DurableStoreConfig | null = readDurableStoreConfig()
): Promise<HostedCampaignPreparationStatus> {
  if (!config) throw new PersistenceError("unavailable", "Hosted outreach persistence is not configured.");
  if (!/^[A-Za-z0-9_:-]{1,128}$/.test(campaignId)) {
    throw new PersistenceError("invalid_transition", "Campaign id is malformed.");
  }
  const client = createRestClient(config);
  const [campaign, activity] = await Promise.all([
    loadHostedCampaignPreparation(client, actor.tenantId, campaignId),
    client.get(
      `/rest/v1/outreach_hosted_activity_events?tenant_id=eq.${e(actor.tenantId)}&entity_type=eq.campaign&entity_ref=eq.${e(campaignId)}&order=occurred_at.desc&limit=5`,
      fromHostedActivitySummaryRow
    )
  ]);
  if (!campaign) {
    return {
      activity,
      campaignId,
      preparedAt: null,
      preparedBy: null,
      preparedRecipients: 0,
      snapshotFingerprint: null,
      status: "not_prepared"
    };
  }
  return {
    activity,
    campaignId,
    preparedAt: campaign.preparedAt,
    preparedBy: campaign.preparedBy,
    preparedRecipients: campaign.preparedRecipients,
    snapshotFingerprint: campaign.snapshotFingerprint,
    status: "prepared"
  };
}

function createRestClient(config: DurableStoreConfig) {
  const baseUrl = config.supabaseUrl.replace(/\/$/, "");
  async function request<T>(
    path: string,
    init: RequestInit,
    mapper: (row: JsonRow) => T
  ): Promise<T[]> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        apikey: config.serviceRoleKey,
        authorization: `Bearer ${config.serviceRoleKey}`,
        "content-type": "application/json",
        ...(init.headers ?? {})
      }
    });
    if (!response.ok) throw new PersistenceError("unavailable", "Hosted outreach persistence request failed.");
    const payload = (await response.json().catch(() => null)) as unknown;
    if (!Array.isArray(payload)) throw new PersistenceError("unavailable", "Hosted outreach persistence returned an invalid payload.");
    return payload.map((row) => mapper(row as JsonRow));
  }
  return {
    delete(path: string) {
      return request(path, { headers: { prefer: "return=representation" }, method: "DELETE" }, (row) => row);
    },
    get<T>(path: string, mapper: (row: JsonRow) => T) {
      return request(path, { method: "GET" }, mapper);
    },
    patch<T>(path: string, body: JsonRow, mapper: (row: JsonRow) => T) {
      return request(
        path,
        { body: JSON.stringify(body), headers: { prefer: "return=representation" }, method: "PATCH" },
        mapper
      );
    },
    post<T>(path: string, body: JsonRow | JsonRow[], mapper: (row: JsonRow) => T, prefer = "return=representation") {
      return request(
        path,
        { body: JSON.stringify(body), headers: { prefer }, method: "POST" },
        mapper
      );
    }
  };
}

function validateHostedProjection(input: HostedCampaignProjectionInput, tenantId: string) {
  if (input.campaign.tenantId !== tenantId) {
    throw new PersistenceError("forbidden", "Campaign tenant does not match authenticated tenant.");
  }
  if (input.campaign.status !== "approved") {
    throw new PersistenceError("invalid_transition", "Only approved campaigns can be prepared for hosted sending.");
  }
  if (input.campaign.deliveryMode !== "simulation") {
    throw new PersistenceError("invalid_transition", "Hosted campaign preparation is simulation-only.");
  }
  if (input.recipients.length === 0) {
    throw new PersistenceError("invalid_transition", "At least one approved recipient is required.");
  }
  if (!input.company.tradingName.trim() && !input.company.legalName.trim()) {
    throw new PersistenceError("invalid_transition", "Company sender name is required.");
  }
  if (!input.sender.displayName.trim() || !(input.sender.fromEmail.trim() || input.sender.replyToEmail.trim())) {
    throw new PersistenceError("invalid_transition", "Sender identity is incomplete.");
  }
  const seen = new Set<string>();
  for (const recipient of input.recipients) {
    if (recipient.tenantId !== tenantId || recipient.campaignId !== input.campaign.id) {
      throw new PersistenceError("forbidden", "Recipient tenant or campaign does not match.");
    }
    if (recipient.status !== "included" || recipient.draftStatus !== "APPROVED") {
      throw new PersistenceError("invalid_transition", "Only included approved recipients can be prepared.");
    }
    if (!recipient.approvalContentHash || buildApprovalContentHash(recipient) !== recipient.approvalContentHash) {
      throw new PersistenceError("invalid_transition", "Recipient approval content is stale.");
    }
    if (seen.has(recipient.id)) {
      throw new PersistenceError("duplicate", "Duplicate campaign recipient reference.");
    }
    seen.add(recipient.id);
  }
}

export function buildHostedCampaignProjectionFingerprint(input: HostedCampaignProjectionInput): string {
  const payload = {
    campaign: {
      deliveryMode: input.campaign.deliveryMode,
      htmlTemplate: input.campaign.htmlTemplate,
      id: input.campaign.id,
      plainTextTemplate: input.campaign.plainTextTemplate,
      replyTo: input.campaign.replyTo,
      senderProfileId: input.campaign.senderProfileId,
      status: input.campaign.status,
      subjectTemplate: input.campaign.subjectTemplate,
      templateUpdatedAt: input.campaign.templateUpdatedAt,
      templateVersion: input.campaign.templateVersion,
      tenantId: input.campaign.tenantId
    },
    company: input.company,
    recipients: input.recipients
      .map((recipient) => ({
        approvalContentHash: recipient.approvalContentHash,
        contactSalutation: recipient.contactSalutation,
        draftStatus: recipient.draftStatus,
        greetingOverride: recipient.greetingOverride,
        id: recipient.id,
        leadId: recipient.leadId,
        organizationDisplayNameOverride: recipient.organizationDisplayNameOverride,
        sentAt: recipient.sentAt,
        status: recipient.status,
        templateVersion: recipient.templateVersion
      }))
      .toSorted((a, b) => a.id.localeCompare(b.id)),
    sender: input.sender
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function loadHostedCampaignPreparation(
  client: RestClient,
  tenantId: string,
  campaignId: string
): Promise<{
  campaignId: string;
  preparedAt: string | null;
  preparedBy: string | null;
  preparedRecipients: number;
  snapshotFingerprint: string | null;
} | null> {
  const rows = await client.get(
    `/rest/v1/outreach_hosted_campaigns?tenant_id=eq.${e(tenantId)}&campaign_ref=eq.${e(campaignId)}&limit=1`,
    fromHostedPreparationRow
  );
  return rows[0] ?? null;
}

async function appendHostedPreparationActivity(
  client: RestClient,
  actor: { tenantId: string; userId: string },
  campaignId: string,
  action: "campaign_server_send_prepared" | "campaign_server_send_prepare_reused",
  metadata: Record<string, string | number | boolean>
) {
  await client.post(
    "/rest/v1/outreach_hosted_activity_events",
    {
      action,
      entity_ref: campaignId,
      entity_type: "campaign",
      metadata: { ...metadata, actorId: actor.userId },
      tenant_id: actor.tenantId,
      title: action === "campaign_server_send_prepared" ? "Campaign prepared for server sending" : "Campaign preparation reused"
    },
    fromActivityRow
  );
}

type RestClient = ReturnType<typeof createRestClient>;

function createHostedCampaignRepository(client: RestClient) {
  return {
    async list(tenantId: string): Promise<OutreachCampaign[]> {
      return client.get(
        `/rest/v1/outreach_hosted_campaigns?tenant_id=eq.${e(tenantId)}&order=updated_at.desc`,
        fromHostedCampaignRow
      );
    },
    async getById(tenantId: string, campaignId: string): Promise<OutreachCampaign | null> {
      const rows = await client.get(
        `/rest/v1/outreach_hosted_campaigns?tenant_id=eq.${e(tenantId)}&campaign_ref=eq.${e(campaignId)}&limit=1`,
        fromHostedCampaignRow
      );
      return rows[0] ?? null;
    },
    async create(): Promise<OutreachCampaign> {
      throw new PersistenceError("forbidden", "Hosted campaigns must be prepared through the server handoff.");
    },
    async update(tenantId: string, campaignId: string, patch: Partial<OutreachCampaign>): Promise<OutreachCampaign> {
      const rows = await client.patch(
        `/rest/v1/outreach_hosted_campaigns?tenant_id=eq.${e(tenantId)}&campaign_ref=eq.${e(campaignId)}`,
        {
          sent_count: patch.sentCount,
          status: patch.status,
          updated_at: new Date().toISOString()
        },
        fromHostedCampaignRow
      );
      const row = rows[0];
      if (!row) throw new PersistenceError("not_found", "Campaign not found.");
      return row;
    }
  };
}

function createHostedCampaignRecipientRepository(client: RestClient) {
  return {
    async listForCampaign(tenantId: string, campaignId: string): Promise<CampaignRecipient[]> {
      return client.get(
        `/rest/v1/outreach_hosted_campaign_recipients?tenant_id=eq.${e(tenantId)}&campaign_ref=eq.${e(campaignId)}&order=created_at.asc`,
        fromHostedRecipientRow
      );
    },
    async listForTenant(tenantId: string): Promise<CampaignRecipient[]> {
      return client.get(
        `/rest/v1/outreach_hosted_campaign_recipients?tenant_id=eq.${e(tenantId)}&order=created_at.asc`,
        fromHostedRecipientRow
      );
    },
    async getById(tenantId: string, recipientId: string): Promise<CampaignRecipient | null> {
      const rows = await client.get(
        `/rest/v1/outreach_hosted_campaign_recipients?tenant_id=eq.${e(tenantId)}&campaign_recipient_ref=eq.${e(recipientId)}&limit=1`,
        fromHostedRecipientRow
      );
      return rows[0] ?? null;
    },
    async updateDraft(
      tenantId: string,
      recipientId: string,
      patch: UpdateCampaignRecipientDraftInput
    ): Promise<CampaignRecipient> {
      const rows = await client.patch(
        `/rest/v1/outreach_hosted_campaign_recipients?tenant_id=eq.${e(tenantId)}&campaign_recipient_ref=eq.${e(recipientId)}`,
        toHostedRecipientPatch(patch),
        fromHostedRecipientRow
      );
      const row = rows[0];
      if (!row) throw new PersistenceError("not_found", "Recipient not found.");
      return row;
    },
    async replaceForCampaign(): Promise<never> {
      throw new PersistenceError("forbidden", "Hosted recipient snapshots must be prepared explicitly.");
    }
  };
}

function createHostedSendJobRepository(client: RestClient) {
  return {
    async listForCampaign(tenantId: string, campaignId: string): Promise<OutreachSendJob[]> {
      return client.get(
        `/rest/v1/outreach_send_jobs?tenant_id=eq.${e(tenantId)}&campaign_ref=eq.${e(campaignId)}&order=created_at.desc`,
        fromSendJobRow
      );
    },
    async listForTenant(tenantId: string): Promise<OutreachSendJob[]> {
      return client.get(
        `/rest/v1/outreach_send_jobs?tenant_id=eq.${e(tenantId)}&order=created_at.desc`,
        fromSendJobRow
      );
    },
    async getById(tenantId: string, id: string): Promise<OutreachSendJob | null> {
      const rows = await client.get(
        `/rest/v1/outreach_send_jobs?tenant_id=eq.${e(tenantId)}&id=eq.${e(id)}&limit=1`,
        fromSendJobRow
      );
      return rows[0] ?? null;
    },
    async findActiveForCampaign(
      tenantId: string,
      campaignId: string,
      deliveryMode: OutreachSendJob["deliveryMode"]
    ): Promise<OutreachSendJob | null> {
      const rows = await this.listForCampaign(tenantId, campaignId);
      return rows.find((row) => row.deliveryMode === deliveryMode && ACTIVE_JOB_STATUSES.includes(row.status)) ?? null;
    },
    async create(input: CreateOutreachSendJobInput): Promise<OutreachSendJob> {
      const rows = await client.post("/rest/v1/outreach_send_jobs", toSendJobRow(input), fromSendJobRow);
      const row = rows[0];
      if (!row) throw new PersistenceError("unavailable", "Send job was not created.");
      return row;
    },
    async update(tenantId: string, id: string, patch: Partial<OutreachSendJob>): Promise<OutreachSendJob> {
      const rows = await client.patch(
        `/rest/v1/outreach_send_jobs?tenant_id=eq.${e(tenantId)}&id=eq.${e(id)}`,
        toSendJobPatch(patch),
        fromSendJobRow
      );
      const row = rows[0];
      if (!row) throw new PersistenceError("not_found", "Send job not found.");
      return row;
    },
    async acquireLock(tenantId: string, id: string, owner: string, expiresAt: string): Promise<OutreachSendJob | null> {
      const rows = await client.post(
        "/rest/v1/rpc/acquire_outreach_send_job_lock",
        { p_expires_at: expiresAt, p_job_id: id, p_owner: owner, p_tenant_id: tenantId },
        fromSendJobRow
      );
      return rows[0] ?? null;
    },
    async releaseLock(tenantId: string, id: string, owner: string): Promise<OutreachSendJob | null> {
      const rows = await client.patch(
        `/rest/v1/outreach_send_jobs?tenant_id=eq.${e(tenantId)}&id=eq.${e(id)}&lock_owner=eq.${e(owner)}`,
        { lock_acquired_at: null, lock_expires_at: null, lock_owner: null },
        fromSendJobRow
      );
      return rows[0] ?? null;
    }
  };
}

function createHostedSendJobRecipientRepository(client: RestClient) {
  return {
    async listForJob(tenantId: string, sendJobId: string): Promise<OutreachSendJobRecipient[]> {
      return client.get(
        `/rest/v1/outreach_send_job_recipients?tenant_id=eq.${e(tenantId)}&send_job_id=eq.${e(sendJobId)}&order=created_at.asc`,
        fromSendJobRecipientRow
      );
    },
    async getById(tenantId: string, id: string): Promise<OutreachSendJobRecipient | null> {
      const rows = await client.get(
        `/rest/v1/outreach_send_job_recipients?tenant_id=eq.${e(tenantId)}&id=eq.${e(id)}&limit=1`,
        fromSendJobRecipientRow
      );
      return rows[0] ?? null;
    },
    async getByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<OutreachSendJobRecipient | null> {
      const rows = await client.get(
        `/rest/v1/outreach_send_job_recipients?tenant_id=eq.${e(tenantId)}&idempotency_key=eq.${e(idempotencyKey)}&limit=1`,
        fromSendJobRecipientRow
      );
      return rows[0] ?? null;
    },
    async createMany(inputs: CreateOutreachSendJobRecipientInput[]): Promise<OutreachSendJobRecipient[]> {
      if (inputs.length === 0) return [];
      return client.post("/rest/v1/outreach_send_job_recipients", inputs.map(toSendJobRecipientRow), fromSendJobRecipientRow);
    },
    async update(
      tenantId: string,
      id: string,
      patch: Partial<OutreachSendJobRecipient>
    ): Promise<OutreachSendJobRecipient> {
      const rows = await client.patch(
        `/rest/v1/outreach_send_job_recipients?tenant_id=eq.${e(tenantId)}&id=eq.${e(id)}`,
        toSendJobRecipientPatch(patch),
        fromSendJobRecipientRow
      );
      const row = rows[0];
      if (!row) throw new PersistenceError("not_found", "Send job recipient not found.");
      return row;
    },
    async bulkUpdateStatus(
      tenantId: string,
      sendJobId: string,
      status: OutreachSendJobRecipientStatus,
      patch: Partial<OutreachSendJobRecipient> = {}
    ): Promise<number> {
      const rows = await client.patch(
        `/rest/v1/outreach_send_job_recipients?tenant_id=eq.${e(tenantId)}&send_job_id=eq.${e(sendJobId)}&status=eq.${e(status)}`,
        toSendJobRecipientPatch(patch),
        fromSendJobRecipientRow
      );
      return rows.length;
    }
  };
}

function createHostedSendJobAttemptRepository(client: RestClient) {
  return {
    async listForJob(tenantId: string, sendJobId: string): Promise<OutreachSendJobAttempt[]> {
      return client.get(
        `/rest/v1/outreach_send_job_attempts?tenant_id=eq.${e(tenantId)}&send_job_id=eq.${e(sendJobId)}&order=completed_at.desc`,
        fromSendJobAttemptRow
      );
    },
    async getByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<OutreachSendJobAttempt | null> {
      const rows = await client.get(
        `/rest/v1/outreach_send_job_attempts?tenant_id=eq.${e(tenantId)}&idempotency_key=eq.${e(idempotencyKey)}&limit=1`,
        fromSendJobAttemptRow
      );
      return rows[0] ?? null;
    },
    async create(input: CreateOutreachSendJobAttemptInput): Promise<OutreachSendJobAttempt> {
      const rows = await client.post(
        "/rest/v1/outreach_send_job_attempts?on_conflict=tenant_id,idempotency_key",
        toSendJobAttemptRow(input),
        fromSendJobAttemptRow,
        "resolution=ignore-duplicates,return=representation"
      );
      const row = rows[0] ?? (await this.getByIdempotencyKey(input.tenantId, input.idempotencyKey));
      if (!row) throw new PersistenceError("unavailable", "Send attempt was not created.");
      return row;
    }
  };
}

function createHostedDailyUsageRepository(client: RestClient) {
  return {
    async get(tenantId: string, provider: OutreachSendJob["provider"], usageDate: string): Promise<OutreachSendJobDailyUsage | null> {
      const rows = await client.get(
        `/rest/v1/outreach_send_job_daily_usage?tenant_id=eq.${e(tenantId)}&provider=eq.${e(provider)}&usage_date=eq.${e(usageDate)}&limit=1`,
        fromDailyUsageRow
      );
      return rows[0] ?? null;
    },
    async increment(
      tenantId: string,
      provider: OutreachSendJob["provider"],
      usageDate: string,
      count: number
    ): Promise<OutreachSendJobDailyUsage> {
      const rows = await client.post(
        "/rest/v1/rpc/increment_outreach_send_job_daily_usage",
        { p_count: count, p_provider: provider, p_tenant_id: tenantId, p_usage_date: usageDate },
        fromDailyUsageRow
      );
      const row = rows[0];
      if (!row) throw new PersistenceError("unavailable", "Daily usage was not incremented.");
      return row;
    }
  };
}

function createHostedActivityRepository(client: RestClient) {
  return {
    async list(tenantId: string): Promise<ActivityEvent[]> {
      return client.get(
        `/rest/v1/outreach_hosted_activity_events?tenant_id=eq.${e(tenantId)}&order=occurred_at.desc`,
        fromActivityRow
      );
    },
    async listForEntity(tenantId: string, entityType: string, entityId: string): Promise<ActivityEvent[]> {
      return client.get(
        `/rest/v1/outreach_hosted_activity_events?tenant_id=eq.${e(tenantId)}&entity_type=eq.${e(entityType)}&entity_ref=eq.${e(entityId)}&order=occurred_at.desc`,
        fromActivityRow
      );
    },
    async append(tenantId: string, event: CreateActivityEventInput): Promise<ActivityEvent> {
      const rows = await client.post(
        "/rest/v1/outreach_hosted_activity_events",
        {
          action: event.action,
          entity_ref: event.entityId,
          entity_type: event.entityType,
          metadata: event.metadata ?? {},
          tenant_id: tenantId,
          title: event.title
        },
        fromActivityRow
      );
      const row = rows[0];
      if (!row) throw new PersistenceError("unavailable", "Activity event was not recorded.");
      return row;
    }
  };
}

function createHostedSuppressionRepository(client: RestClient) {
  return {
    async list(tenantId: string): Promise<EmailSuppression[]> {
      return client.get(`/rest/v1/outreach_public_suppressions?tenant_public_id=eq.${e(tenantId)}`, fromSuppressionRow);
    },
    async listActive(tenantId: string): Promise<EmailSuppression[]> {
      return client.get(
        `/rest/v1/outreach_public_suppressions?tenant_public_id=eq.${e(tenantId)}&active=eq.true`,
        fromSuppressionRow
      );
    },
    async getById(tenantId: string, id: string): Promise<EmailSuppression | null> {
      const rows = await client.get(
        `/rest/v1/outreach_public_suppressions?tenant_public_id=eq.${e(tenantId)}&id=eq.${e(id)}&limit=1`,
        fromSuppressionRow
      );
      return rows[0] ?? null;
    },
    async getActiveByEmail(tenantId: string, email: string): Promise<EmailSuppression | null> {
      const hash = createHash("sha256").update(`${tenantId}:${email.trim().toLowerCase()}`).digest("hex");
      const rows = await client.get(
        `/rest/v1/outreach_public_suppressions?tenant_public_id=eq.${e(tenantId)}&normalized_email_hash=eq.${e(hash)}&active=eq.true&limit=1`,
        fromSuppressionRow
      );
      return rows[0] ?? null;
    },
    async create(): Promise<never> {
      throw new PersistenceError("forbidden", "Hosted suppression writes use public unsubscribe or webhook routes.");
    },
    async remove(): Promise<never> {
      throw new PersistenceError("forbidden", "Hosted suppression removal is not enabled for send jobs.");
    }
  };
}

function createHostedCompanyProfileRepository(client: RestClient) {
  return {
    async getForTenant(tenantId: string): Promise<CompanyProfile | null> {
      const rows = await client.get(
        `/rest/v1/outreach_hosted_campaigns?tenant_id=eq.${e(tenantId)}&status=eq.approved&order=updated_at.desc&limit=1`,
        fromCompanyProfileCampaignRow
      );
      return rows[0] ?? null;
    },
    async getById(tenantId: string): Promise<CompanyProfile | null> {
      return this.getForTenant(tenantId);
    },
    async create(): Promise<CompanyProfile> {
      throw new PersistenceError("forbidden", "Hosted company profile is derived from approved campaign projection.");
    },
    async update(): Promise<CompanyProfile> {
      throw new PersistenceError("forbidden", "Hosted company profile is derived from approved campaign projection.");
    },
    async ensureDefault(): Promise<CompanyProfile> {
      throw new PersistenceError("forbidden", "Hosted company profile is derived from approved campaign projection.");
    }
  };
}

function createHostedSenderIdentityRepository(client: RestClient) {
  return {
    async list(tenantId: string): Promise<SenderIdentity[]> {
      return client.get(
        `/rest/v1/outreach_hosted_campaigns?tenant_id=eq.${e(tenantId)}&status=eq.approved&order=updated_at.desc`,
        fromSenderIdentityCampaignRow
      );
    },
    async listAll(tenantId: string): Promise<SenderIdentity[]> {
      return this.list(tenantId);
    },
    async getById(tenantId: string, id: string): Promise<SenderIdentity | null> {
      const rows = await client.get(
        `/rest/v1/outreach_hosted_campaigns?tenant_id=eq.${e(tenantId)}&sender_profile_ref=eq.${e(id)}&status=eq.approved&order=updated_at.desc&limit=1`,
        fromSenderIdentityCampaignRow
      );
      return rows[0] ?? null;
    },
    async getDefault(tenantId: string): Promise<SenderIdentity | null> {
      const rows = await this.list(tenantId);
      return rows[0] ?? null;
    },
    async create(): Promise<SenderIdentity> {
      throw new PersistenceError("forbidden", "Hosted sender identity is derived from approved campaign projection.");
    },
    async update(): Promise<SenderIdentity> {
      throw new PersistenceError("forbidden", "Hosted sender identity is derived from approved campaign projection.");
    },
    async duplicate(): Promise<SenderIdentity> {
      throw new PersistenceError("forbidden", "Hosted sender identity is derived from approved campaign projection.");
    },
    async archive(): Promise<SenderIdentity> {
      throw new PersistenceError("forbidden", "Hosted sender identity is derived from approved campaign projection.");
    },
    async setDefault(): Promise<SenderIdentity> {
      throw new PersistenceError("forbidden", "Hosted sender identity is derived from approved campaign projection.");
    },
    async ensureDefault(): Promise<SenderIdentity> {
      throw new PersistenceError("forbidden", "Hosted sender identity is derived from approved campaign projection.");
    }
  };
}

function fromHostedCampaignRow(row: JsonRow): OutreachCampaign {
  return {
    createdAt: s(row.created_at),
    createdBy: s(row.prepared_by),
    deliveryMode: "simulation",
    description: s(row.description),
    fromName: s(row.from_name),
    htmlTemplate: s(row.html_template),
    id: s(row.campaign_ref),
    language: s(row.language) || "pt-PT",
    name: s(row.name),
    plainTextTemplate: s(row.plain_text_template),
    recipientSnapshotCount: n(row.recipient_snapshot_count),
    recipientSnapshotCreatedAt: s(row.prepared_at) || null,
    replyTo: s(row.reply_to),
    segmentDefinition: null,
    senderProfileId: s(row.sender_profile_ref) || null,
    sentCount: n(row.sent_count),
    status: s(row.status) as OutreachCampaign["status"],
    subjectTemplate: s(row.subject_template),
    templateUpdatedAt: s(row.template_updated_at) || null,
    templateVersion: n(row.template_version) || 1,
    tenantId: s(row.tenant_id),
    totalCount: n(row.recipient_snapshot_count),
    updatedAt: s(row.updated_at)
  };
}

function fromHostedPreparationRow(row: JsonRow): {
  campaignId: string;
  preparedAt: string | null;
  preparedBy: string | null;
  preparedRecipients: number;
  snapshotFingerprint: string | null;
} {
  return {
    campaignId: s(row.campaign_ref),
    preparedAt: sn(row.prepared_at),
    preparedBy: sn(row.prepared_by),
    preparedRecipients: n(row.recipient_snapshot_count),
    snapshotFingerprint: sn(row.snapshot_fingerprint)
  };
}

function fromHostedActivitySummaryRow(row: JsonRow): HostedCampaignPreparationStatus["activity"][number] {
  return {
    action: s(row.action),
    occurredAt: s(row.occurred_at),
    title: s(row.title)
  };
}

function fromHostedRecipientRow(row: JsonRow): CampaignRecipient {
  return {
    approvalContentHash: s(row.approval_content_hash),
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    approvedAt: s(row.approved_at) || null,
    approvedBy: s(row.approved_by) || null,
    campaignId: s(row.campaign_ref),
    contactId: s(row.contact_ref) || null,
    contactSalutation: (s(row.contact_salutation) || null) as CampaignRecipient["contactSalutation"],
    createdAt: s(row.created_at),
    draftStatus: s(row.draft_status) as CampaignRecipient["draftStatus"],
    draftUpdatedAt: s(row.draft_updated_at) || null,
    externalClient: null,
    generatedAt: null,
    generationMethod: (s(row.generation_method) || null) as CampaignRecipient["generationMethod"],
    greetingOverride: s(row.greeting_override),
    id: s(row.campaign_recipient_ref),
    inclusionReason: s(row.inclusion_reason),
    leadId: s(row.lead_ref),
    openedExternallyAt: null,
    operatorNote: s(row.operator_note),
    organizationDisplayNameOverride: s(row.organization_display_name_override),
    personalizedHtml: s(row.personalized_html),
    personalizedPlainText: s(row.personalized_plain_text),
    personalizedSubject: s(row.personalized_subject),
    recipientDeliveryMode: (s(row.recipient_delivery_mode) || null) as CampaignRecipient["recipientDeliveryMode"],
    sendIdempotencyKey: s(row.send_idempotency_key) || null,
    sentAt: s(row.sent_at) || null,
    sentBy: s(row.sent_by) || null,
    simulatedAt: s(row.simulated_at) || null,
    snapshotCategory: s(row.snapshot_category),
    snapshotCompanyName: s(row.snapshot_company_name),
    snapshotContactName: s(row.snapshot_contact_name),
    snapshotEmail: s(row.snapshot_email),
    snapshotRegion: s(row.snapshot_region),
    snapshotWebsite: s(row.snapshot_website),
    status: s(row.status) as CampaignRecipient["status"],
    templateVersion: row.template_version === null ? null : n(row.template_version),
    tenantId: s(row.tenant_id),
    userEdited: Boolean(row.user_edited)
  };
}

function fromSendJobRow(row: JsonRow): OutreachSendJob {
  return {
    approvedBy: sn(row.approved_by),
    batchSize: n(row.batch_size),
    campaignId: s(row.campaign_ref),
    cancelledAt: sn(row.cancelled_at),
    cancelledBy: sn(row.cancelled_by),
    cancelReason: sn(row.cancel_reason),
    completedAt: sn(row.completed_at),
    createdAt: s(row.created_at),
    createdBy: s(row.created_by),
    dailyLimit: n(row.daily_limit),
    delayMs: n(row.delay_ms),
    deliveryMode: s(row.delivery_mode) as OutreachSendJob["deliveryMode"],
    failedCount: n(row.failed_count),
    id: s(row.id),
    lastProcessedAt: sn(row.last_processed_at),
    lastStopReason: sn(row.last_stop_reason),
    lockAcquiredAt: sn(row.lock_acquired_at),
    lockExpiresAt: sn(row.lock_expires_at),
    lockOwner: sn(row.lock_owner),
    maxRetries: n(row.max_retries),
    pausedAt: sn(row.paused_at),
    pausedBy: sn(row.paused_by),
    pauseReason: sn(row.pause_reason),
    processedCount: n(row.processed_count),
    provider: s(row.provider) as OutreachSendJob["provider"],
    queuedAt: sn(row.queued_at),
    remainingCount: n(row.remaining_count),
    resumedAt: sn(row.resumed_at),
    resumedBy: sn(row.resumed_by),
    retryPendingCount: n(row.retry_pending_count),
    sentCount: n(row.sent_count),
    skippedCount: n(row.skipped_count),
    startedAt: sn(row.started_at),
    status: s(row.status) as OutreachSendJob["status"],
    tenantId: s(row.tenant_id),
    version: n(row.version)
  };
}

function fromSendJobRecipientRow(row: JsonRow): OutreachSendJobRecipient {
  return {
    approvedContentVersion: s(row.approved_content_version),
    attemptCount: n(row.attempt_count),
    campaignId: s(row.campaign_ref),
    campaignRecipientId: s(row.campaign_recipient_ref),
    completedAt: sn(row.completed_at),
    contactId: sn(row.contact_ref),
    createdAt: s(row.created_at),
    id: s(row.id),
    idempotencyKey: s(row.idempotency_key),
    lastErrorCode: sn(row.last_error_code) as OutreachSendJobRecipient["lastErrorCode"],
    lastErrorMessage: sn(row.last_error_message),
    leadId: s(row.lead_ref),
    nextAttemptAt: sn(row.next_attempt_at),
    normalizedEmail: s(row.normalized_email),
    processingStartedAt: sn(row.processing_started_at),
    providerMessageId: sn(row.provider_message_id),
    queuedAt: s(row.queued_at),
    sendJobId: s(row.send_job_id),
    sentAt: sn(row.sent_at),
    status: s(row.status) as OutreachSendJobRecipient["status"],
    tenantId: s(row.tenant_id),
    updatedAt: s(row.updated_at)
  };
}

function fromSendJobAttemptRow(row: JsonRow): OutreachSendJobAttempt {
  return {
    attemptNumber: n(row.attempt_number),
    campaignId: s(row.campaign_ref),
    campaignRecipientId: s(row.campaign_recipient_ref),
    completedAt: s(row.completed_at),
    deliveryMode: s(row.delivery_mode) as OutreachSendJobAttempt["deliveryMode"],
    id: s(row.id),
    idempotencyKey: s(row.idempotency_key),
    leadId: s(row.lead_ref),
    provider: s(row.provider) as OutreachSendJobAttempt["provider"],
    providerCategory: s(row.provider_category),
    providerMessageId: sn(row.provider_message_id),
    retryable: Boolean(row.retryable),
    sanitizedErrorCode: sn(row.sanitized_error_code) as OutreachSendJobAttempt["sanitizedErrorCode"],
    sanitizedErrorMessage: sn(row.sanitized_error_message),
    sendJobId: s(row.send_job_id),
    sendJobRecipientId: s(row.send_job_recipient_id),
    startedAt: s(row.started_at),
    status: s(row.status) as OutreachSendJobAttempt["status"],
    tenantId: s(row.tenant_id)
  };
}

function fromDailyUsageRow(row: JsonRow): OutreachSendJobDailyUsage {
  return {
    id: s(row.id),
    provider: s(row.provider) as OutreachSendJobDailyUsage["provider"],
    realSendCount: n(row.real_send_count),
    tenantId: s(row.tenant_id),
    updatedAt: s(row.updated_at),
    usageDate: s(row.usage_date)
  };
}

function fromActivityRow(row: JsonRow): ActivityEvent {
  return {
    action: s(row.action) as ActivityEvent["action"],
    entityId: s(row.entity_ref),
    entityType: s(row.entity_type) as ActivityEvent["entityType"],
    id: s(row.id),
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as ActivityEvent["metadata"]) : {},
    occurredAt: s(row.occurred_at),
    tenantId: s(row.tenant_id),
    title: s(row.title)
  };
}

function fromSuppressionRow(row: JsonRow): EmailSuppression {
  return {
    active: Boolean(row.active),
    campaignId: sn(row.campaign_ref),
    contactId: null,
    createdAt: s(row.created_at),
    createdBy: "hosted-runtime",
    id: s(row.id),
    leadId: sn(row.lead_ref),
    normalizedEmail: s(row.normalized_email_hash),
    notes: "",
    reason: s(row.reason) as EmailSuppression["reason"],
    removalReason: null,
    removedAt: null,
    removedBy: null,
    source: s(row.source) as EmailSuppression["source"],
    tenantId: s(row.tenant_public_id)
  };
}

function fromCompanyProfileCampaignRow(row: JsonRow): CompanyProfile {
  const timestamp = s(row.updated_at);
  return {
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
    createdAt: timestamp,
    defaultCurrency: "EUR",
    defaultLanguage: (s(row.language) === "en" ? "en" : "pt-PT"),
    facebookUrl: "",
    generalEmail: s(row.company_general_email),
    generalPhone: "",
    id: `company:${s(row.tenant_id)}`,
    legalFooter: s(row.legal_footer),
    legalName: s(row.company_legal_name),
    linkedinUrl: "",
    logoLocalAssetId: null,
    logoPublicUrl: "",
    postalCode: "",
    region: "",
    tenantId: s(row.tenant_id),
    tradingName: s(row.company_trading_name),
    updatedAt: timestamp,
    vatNumber: "",
    websiteUrl: s(row.company_website_url)
  };
}

function fromSenderIdentityCampaignRow(row: JsonRow): SenderIdentity {
  const timestamp = s(row.updated_at);
  return {
    active: true,
    archivedAt: null,
    companyProfileId: `company:${s(row.tenant_id)}`,
    createdAt: timestamp,
    defaultLanguage: (s(row.language) === "en" ? "en" : "pt-PT"),
    displayName: s(row.sender_display_name) || s(row.from_name),
    fromEmail: s(row.sender_from_email) || s(row.reply_to),
    id: s(row.sender_profile_ref) || `sender:${s(row.tenant_id)}`,
    isDefault: true,
    jobTitle: "",
    phone: "",
    replyToEmail: s(row.sender_reply_to_email) || s(row.reply_to),
    signatureHtml: s(row.sender_signature_html),
    signatureText: s(row.sender_signature_text),
    tenantId: s(row.tenant_id),
    updatedAt: timestamp,
    userProfileId: ""
  };
}

function toSendJobRow(input: CreateOutreachSendJobInput): JsonRow {
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

function toHostedCampaignRow(
  input: HostedCampaignProjectionInput,
  actor: { tenantId: string; userId: string },
  timestamp: string,
  snapshotFingerprint: string
): JsonRow {
  return {
    campaign_ref: input.campaign.id,
    company_general_email: input.company.generalEmail,
    company_legal_name: input.company.legalName,
    company_trading_name: input.company.tradingName,
    company_website_url: input.company.websiteUrl,
    delivery_mode: "simulation",
    description: input.campaign.description,
    from_name: input.campaign.fromName,
    html_template: input.campaign.htmlTemplate,
    language: input.campaign.language,
    legal_footer: input.company.legalFooter,
    name: input.campaign.name,
    plain_text_template: input.campaign.plainTextTemplate,
    prepared_at: timestamp,
    prepared_by: actor.userId,
    recipient_snapshot_count: input.recipients.length,
    reply_to: input.campaign.replyTo,
    sender_display_name: input.sender.displayName,
    sender_from_email: input.sender.fromEmail,
    sender_profile_ref: input.sender.id || input.campaign.senderProfileId,
    sender_reply_to_email: input.sender.replyToEmail,
    sender_signature_html: input.sender.signatureHtml,
    sender_signature_text: input.sender.signatureText,
    snapshot_fingerprint: snapshotFingerprint,
    status: "approved",
    subject_template: input.campaign.subjectTemplate,
    template_updated_at: input.campaign.templateUpdatedAt,
    template_version: input.campaign.templateVersion,
    tenant_id: actor.tenantId,
    updated_at: timestamp
  };
}

function toHostedRecipientRow(
  campaign: OutreachCampaign,
  recipient: CampaignRecipient,
  tenantId: string,
  timestamp: string
): JsonRow {
  return {
    approval_content_hash: recipient.approvalContentHash,
    approved_at: recipient.approvedAt,
    approved_by: recipient.approvedBy,
    campaign_recipient_ref: recipient.id,
    campaign_ref: campaign.id,
    contact_ref: recipient.contactId,
    contact_salutation: recipient.contactSalutation,
    draft_status: "APPROVED",
    draft_updated_at: recipient.draftUpdatedAt,
    generation_method: recipient.generationMethod,
    greeting_override: recipient.greetingOverride,
    inclusion_reason: recipient.inclusionReason,
    lead_ref: recipient.leadId,
    operator_note: recipient.operatorNote,
    organization_display_name_override: recipient.organizationDisplayNameOverride,
    personalized_html: recipient.personalizedHtml,
    personalized_plain_text: recipient.personalizedPlainText,
    personalized_subject: recipient.personalizedSubject,
    recipient_delivery_mode: recipient.recipientDeliveryMode,
    send_idempotency_key: recipient.sendIdempotencyKey,
    sent_at: recipient.sentAt,
    sent_by: recipient.sentBy,
    simulated_at: recipient.simulatedAt,
    snapshot_category: recipient.snapshotCategory,
    snapshot_company_name: recipient.snapshotCompanyName,
    snapshot_contact_name: recipient.snapshotContactName,
    snapshot_email: recipient.snapshotEmail,
    snapshot_region: recipient.snapshotRegion,
    snapshot_website: recipient.snapshotWebsite,
    status: "included",
    template_version: recipient.templateVersion,
    tenant_id: tenantId,
    updated_at: timestamp,
    user_edited: recipient.userEdited
  };
}

function toSendJobPatch(patch: Partial<OutreachSendJob>): JsonRow {
  return compact({
    cancelled_at: patch.cancelledAt,
    cancelled_by: patch.cancelledBy,
    cancel_reason: patch.cancelReason,
    completed_at: patch.completedAt,
    failed_count: patch.failedCount,
    last_processed_at: patch.lastProcessedAt,
    last_stop_reason: patch.lastStopReason,
    lock_acquired_at: patch.lockAcquiredAt,
    lock_expires_at: patch.lockExpiresAt,
    lock_owner: patch.lockOwner,
    paused_at: patch.pausedAt,
    paused_by: patch.pausedBy,
    pause_reason: patch.pauseReason,
    processed_count: patch.processedCount,
    remaining_count: patch.remainingCount,
    resumed_at: patch.resumedAt,
    resumed_by: patch.resumedBy,
    retry_pending_count: patch.retryPendingCount,
    sent_count: patch.sentCount,
    skipped_count: patch.skippedCount,
    started_at: patch.startedAt,
    status: patch.status
  });
}

function toSendJobRecipientRow(input: CreateOutreachSendJobRecipientInput): JsonRow {
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

function toSendJobRecipientPatch(patch: Partial<OutreachSendJobRecipient>): JsonRow {
  return compact({
    attempt_count: patch.attemptCount,
    completed_at: patch.completedAt,
    last_error_code: patch.lastErrorCode,
    last_error_message: patch.lastErrorMessage,
    next_attempt_at: patch.nextAttemptAt,
    processing_started_at: patch.processingStartedAt,
    provider_message_id: patch.providerMessageId,
    sent_at: patch.sentAt,
    status: patch.status,
    updated_at: new Date().toISOString()
  });
}

function toSendJobAttemptRow(input: CreateOutreachSendJobAttemptInput): JsonRow {
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

function toHostedRecipientPatch(patch: UpdateCampaignRecipientDraftInput): JsonRow {
  return compact({
    draft_status: patch.draftStatus,
    recipient_delivery_mode: patch.recipientDeliveryMode,
    send_idempotency_key: patch.sendIdempotencyKey,
    sent_at: patch.sentAt,
    sent_by: patch.sentBy,
    simulated_at: patch.simulatedAt,
    status: patch.status,
    updated_at: new Date().toISOString()
  });
}

function compact(row: JsonRow): JsonRow {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

function unsupportedAsync(name: string) {
  return async () => {
    throw new PersistenceError("forbidden", `Hosted send-job repository does not support ${name}.`);
  };
}

function e(value: string): string {
  return encodeURIComponent(value);
}

function s(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function sn(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function n(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
