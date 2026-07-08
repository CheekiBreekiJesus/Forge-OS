import { createRecordId } from "@/domain/ids";
import type {
  CreateOutreachSendJobAttemptInput,
  CreateOutreachSendJobInput,
  CreateOutreachSendJobRecipientInput,
  OutreachSendJob,
  OutreachSendJobAttempt,
  OutreachSendJobDailyUsage,
  OutreachSendJobRecipient,
  OutreachSendJobRecipientStatus,
  OutreachSendJobStatus
} from "@/domain/send-job-types";
import type { ForgeOSDatabase } from "@/persistence/db";
import { PersistenceError } from "@/persistence/interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export interface OutreachSendJobRepository {
  listForCampaign(tenantId: string, campaignId: string): Promise<OutreachSendJob[]>;
  listForTenant(tenantId: string): Promise<OutreachSendJob[]>;
  getById(tenantId: string, id: string): Promise<OutreachSendJob | null>;
  findActiveForCampaign(
    tenantId: string,
    campaignId: string,
    deliveryMode: OutreachSendJob["deliveryMode"]
  ): Promise<OutreachSendJob | null>;
  create(input: CreateOutreachSendJobInput): Promise<OutreachSendJob>;
  update(tenantId: string, id: string, patch: Partial<OutreachSendJob>): Promise<OutreachSendJob>;
  acquireLock(
    tenantId: string,
    id: string,
    owner: string,
    expiresAt: string,
    now?: string
  ): Promise<OutreachSendJob | null>;
  releaseLock(tenantId: string, id: string, owner: string): Promise<OutreachSendJob | null>;
}

export interface OutreachSendJobRecipientRepository {
  listForJob(tenantId: string, sendJobId: string): Promise<OutreachSendJobRecipient[]>;
  getById(tenantId: string, id: string): Promise<OutreachSendJobRecipient | null>;
  getByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<OutreachSendJobRecipient | null>;
  createMany(inputs: CreateOutreachSendJobRecipientInput[]): Promise<OutreachSendJobRecipient[]>;
  update(
    tenantId: string,
    id: string,
    patch: Partial<OutreachSendJobRecipient>
  ): Promise<OutreachSendJobRecipient>;
  bulkUpdateStatus(
    tenantId: string,
    sendJobId: string,
    status: OutreachSendJobRecipientStatus,
    patch?: Partial<OutreachSendJobRecipient>
  ): Promise<number>;
}

export interface OutreachSendJobAttemptRepository {
  listForJob(tenantId: string, sendJobId: string): Promise<OutreachSendJobAttempt[]>;
  getByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<OutreachSendJobAttempt | null>;
  create(input: CreateOutreachSendJobAttemptInput): Promise<OutreachSendJobAttempt>;
}

export interface OutreachSendJobDailyUsageRepository {
  get(
    tenantId: string,
    provider: OutreachSendJob["provider"],
    usageDate: string
  ): Promise<OutreachSendJobDailyUsage | null>;
  increment(
    tenantId: string,
    provider: OutreachSendJob["provider"],
    usageDate: string,
    count: number
  ): Promise<OutreachSendJobDailyUsage>;
}

const ACTIVE_JOB_STATUSES: OutreachSendJobStatus[] = ["DRAFT", "READY", "QUEUED", "PROCESSING", "PAUSED"];

export function createOutreachSendJobRepository(db: ForgeOSDatabase): OutreachSendJobRepository {
  return {
    async listForCampaign(tenantId, campaignId) {
      return db.outreachSendJobs
        .where("[tenantId+campaignId]")
        .equals([tenantId, campaignId])
        .toArray();
    },
    async listForTenant(tenantId) {
      return db.outreachSendJobs.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, id) {
      const row = await db.outreachSendJobs.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async findActiveForCampaign(tenantId, campaignId, deliveryMode) {
      const rows = await this.listForCampaign(tenantId, campaignId);
      return rows.find((row) => row.deliveryMode === deliveryMode && ACTIVE_JOB_STATUSES.includes(row.status)) ?? null;
    },
    async create(input) {
      const row: OutreachSendJob = {
        ...input,
        id: createRecordId("osj"),
        failedCount: 0,
        lockAcquiredAt: null,
        lockExpiresAt: null,
        lockOwner: null,
        processedCount: 0,
        remainingCount: input.remainingCount,
        retryPendingCount: 0,
        sentCount: 0,
        skippedCount: 0,
        version: 1
      };
      await db.outreachSendJobs.put(row);
      return row;
    },
    async update(tenantId, id, patch) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Send job not found.");
      const updated: OutreachSendJob = {
        ...existing,
        ...patch,
        id: existing.id,
        tenantId: existing.tenantId,
        version: existing.version + 1
      };
      await db.outreachSendJobs.put(updated);
      return updated;
    },
    async acquireLock(tenantId, id, owner, expiresAt, now = nowIso()) {
      const existing = await this.getById(tenantId, id);
      if (!existing) return null;
      if (existing.lockOwner && existing.lockExpiresAt && existing.lockExpiresAt > now) {
        return null;
      }
      return this.update(tenantId, id, {
        lockAcquiredAt: now,
        lockExpiresAt: expiresAt,
        lockOwner: owner
      });
    },
    async releaseLock(tenantId, id, owner) {
      const existing = await this.getById(tenantId, id);
      if (!existing || existing.lockOwner !== owner) return existing;
      return this.update(tenantId, id, {
        lockAcquiredAt: null,
        lockExpiresAt: null,
        lockOwner: null
      });
    }
  };
}

export function createOutreachSendJobRecipientRepository(
  db: ForgeOSDatabase
): OutreachSendJobRecipientRepository {
  return {
    async listForJob(tenantId, sendJobId) {
      return db.outreachSendJobRecipients
        .where("[tenantId+sendJobId]")
        .equals([tenantId, sendJobId])
        .toArray();
    },
    async getById(tenantId, id) {
      const row = await db.outreachSendJobRecipients.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getByIdempotencyKey(tenantId, idempotencyKey) {
      const rows = await db.outreachSendJobRecipients
        .where("[tenantId+idempotencyKey]")
        .equals([tenantId, idempotencyKey])
        .toArray();
      return rows[0] ?? null;
    },
    async createMany(inputs) {
      const rows = inputs.map((input) => ({
        ...input,
        id: createRecordId("osjr")
      }));
      if (rows.length > 0) await db.outreachSendJobRecipients.bulkPut(rows);
      return rows;
    },
    async update(tenantId, id, patch) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Send job recipient not found.");
      const updated: OutreachSendJobRecipient = {
        ...existing,
        ...patch,
        id: existing.id,
        tenantId: existing.tenantId,
        updatedAt: nowIso()
      };
      await db.outreachSendJobRecipients.put(updated);
      return updated;
    },
    async bulkUpdateStatus(tenantId, sendJobId, status, patch = {}) {
      const rows = await this.listForJob(tenantId, sendJobId);
      const timestamp = nowIso();
      const updates = rows
        .filter((row) => row.status === status)
        .map((row) => ({
          ...row,
          ...patch,
          updatedAt: timestamp
        }));
      if (updates.length > 0) await db.outreachSendJobRecipients.bulkPut(updates);
      return updates.length;
    }
  };
}

export function createOutreachSendJobAttemptRepository(
  db: ForgeOSDatabase
): OutreachSendJobAttemptRepository {
  return {
    async listForJob(tenantId, sendJobId) {
      return db.outreachSendJobAttempts
        .where("[tenantId+sendJobId]")
        .equals([tenantId, sendJobId])
        .toArray();
    },
    async getByIdempotencyKey(tenantId, idempotencyKey) {
      const rows = await db.outreachSendJobAttempts
        .where("[tenantId+idempotencyKey]")
        .equals([tenantId, idempotencyKey])
        .toArray();
      return rows[0] ?? null;
    },
    async create(input) {
      const existing = await this.getByIdempotencyKey(input.tenantId, input.idempotencyKey);
      if (existing) return existing;
      const row: OutreachSendJobAttempt = {
        ...input,
        id: createRecordId("osja")
      };
      await db.outreachSendJobAttempts.put(row);
      return row;
    }
  };
}

export function createOutreachSendJobDailyUsageRepository(
  db: ForgeOSDatabase
): OutreachSendJobDailyUsageRepository {
  return {
    async get(tenantId, provider, usageDate) {
      const rows = await db.outreachSendJobDailyUsage
        .where("[tenantId+provider+usageDate]")
        .equals([tenantId, provider, usageDate])
        .toArray();
      return rows[0] ?? null;
    },
    async increment(tenantId, provider, usageDate, count) {
      const existing = await this.get(tenantId, provider, usageDate);
      const row: OutreachSendJobDailyUsage = {
        id: existing?.id ?? createRecordId("osjdu"),
        provider,
        realSendCount: (existing?.realSendCount ?? 0) + count,
        tenantId,
        updatedAt: nowIso(),
        usageDate
      };
      await db.outreachSendJobDailyUsage.put(row);
      return row;
    }
  };
}
