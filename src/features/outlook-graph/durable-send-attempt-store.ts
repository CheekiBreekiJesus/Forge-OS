import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  CreateOutlookDurableSendAttemptInput,
  OutlookDurableSendAttempt,
  OutlookDurableSendAttemptStatus
} from "@/domain/outlook-send-types";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

type AttemptStoreFile = {
  version: 1;
  attempts: OutlookDurableSendAttempt[];
};

const STORE_VERSION = 1;

let writeChain: Promise<void> = Promise.resolve();
let memoryOverride: AttemptStoreFile | null = null;

export function resolveOutlookSendAttemptStorePath(): string {
  const localAppData = process.env.LOCALAPPDATA ?? process.env.HOME ?? ".";
  return join(localAppData, "ForgeOS", "outlook", "durable-send-attempts.json");
}

export function resetOutlookSendAttemptStoreForTests(): void {
  memoryOverride = { version: STORE_VERSION, attempts: [] };
  writeChain = Promise.resolve();
}

export function enableOutlookSendAttemptMemoryStore(): void {
  memoryOverride = { version: STORE_VERSION, attempts: [] };
}

async function withStoreLock<T>(operation: () => Promise<T>): Promise<T> {
  const run = writeChain.then(operation, operation);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readStore(filePath: string): Promise<AttemptStoreFile> {
  if (memoryOverride) return structuredClone(memoryOverride);
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AttemptStoreFile;
    if (parsed.version !== STORE_VERSION || !Array.isArray(parsed.attempts)) {
      return { version: STORE_VERSION, attempts: [] };
    }
    return parsed;
  } catch {
    return { version: STORE_VERSION, attempts: [] };
  }
}

async function writeStore(filePath: string, store: AttemptStoreFile): Promise<void> {
  if (memoryOverride) {
    memoryOverride = structuredClone(store);
    return;
  }
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(store), "utf8");
  await rename(tempPath, filePath);
}

export function buildOutlookDurableIdempotencyKey(
  campaignId: string,
  recipientId: string,
  approvedDraftVersion: string
): string {
  return ["outlook", campaignId, recipientId, approvedDraftVersion, "outlook"].join(":");
}

export type OutlookDurableSendAttemptStore = {
  getByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<OutlookDurableSendAttempt | null>;
  listForRecipient(
    tenantId: string,
    campaignId: string,
    campaignRecipientId: string
  ): Promise<OutlookDurableSendAttempt[]>;
  listAll(): Promise<OutlookDurableSendAttempt[]>;
  createSubmitting(
    input: CreateOutlookDurableSendAttemptInput
  ): Promise<{ attempt: OutlookDurableSendAttempt; created: boolean }>;
  update(
    tenantId: string,
    id: string,
    patch: Partial<OutlookDurableSendAttempt>
  ): Promise<OutlookDurableSendAttempt | null>;
};

export function createOutlookDurableSendAttemptStore(
  filePath = resolveOutlookSendAttemptStorePath()
): OutlookDurableSendAttemptStore {
  return {
    async getByIdempotencyKey(tenantId, idempotencyKey) {
      const store = await readStore(filePath);
      return (
        store.attempts.find(
          (row) => row.tenantId === tenantId && row.idempotencyKey === idempotencyKey
        ) ?? null
      );
    },
    async listForRecipient(tenantId, campaignId, campaignRecipientId) {
      const store = await readStore(filePath);
      return store.attempts.filter(
        (row) =>
          row.tenantId === tenantId &&
          row.campaignId === campaignId &&
          row.campaignRecipientId === campaignRecipientId
      );
    },
    async listAll() {
      const store = await readStore(filePath);
      return [...store.attempts];
    },
    async createSubmitting(input) {
      return withStoreLock(async () => {
        const store = await readStore(filePath);
        const existing = store.attempts.find(
          (row) => row.tenantId === input.tenantId && row.idempotencyKey === input.idempotencyKey
        );
        if (existing) {
          return { attempt: existing, created: false };
        }
        const attempt: OutlookDurableSendAttempt = {
          ...input,
          id: randomUUID()
        };
        store.attempts.push(attempt);
        await writeStore(filePath, store);
        return { attempt, created: true };
      });
    },
    async update(tenantId, id, patch) {
      return withStoreLock(async () => {
        const store = await readStore(filePath);
        const index = store.attempts.findIndex((row) => row.tenantId === tenantId && row.id === id);
        if (index < 0) return null;
        const updated: OutlookDurableSendAttempt = {
          ...store.attempts[index]!,
          ...patch,
          id: store.attempts[index]!.id,
          tenantId: store.attempts[index]!.tenantId
        };
        store.attempts[index] = updated;
        await writeStore(filePath, store);
        return updated;
      });
    }
  };
}

export function isBlockingOutlookAttemptStatus(status: OutlookDurableSendAttemptStatus): boolean {
  return status === "accepted" || status === "uncertain" || status === "submitting";
}

export function isStaleSubmittingAttempt(
  attempt: OutlookDurableSendAttempt,
  now = Date.now(),
  thresholdMs = Number(process.env.OUTLOOK_SUBMITTING_STALE_MS ?? 5 * 60 * 1000)
): boolean {
  if (attempt.status !== "submitting" || !attempt.submittingAt) return false;
  return now - new Date(attempt.submittingAt).getTime() >= thresholdMs;
}
