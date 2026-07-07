import type { ForgeOSDatabase } from "@/persistence/db";
import { PersistenceError } from "@/persistence/interfaces";

export class PersistenceStartupError extends Error {
  readonly recoverable: boolean;

  constructor(message: string, options?: { recoverable?: boolean; cause?: unknown }) {
    super(message);
    this.name = "PersistenceStartupError";
    this.recoverable = options?.recoverable ?? false;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

function readErrorName(error: unknown): string {
  if (error && typeof error === "object" && "name" in error) {
    return String(error.name);
  }
  return "";
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isRecoverableDatabaseError(error: unknown): boolean {
  const name = readErrorName(error);
  const message = readErrorMessage(error).toLowerCase();
  return (
    name === "VersionError" ||
    name === "UpgradeError" ||
    name === "InvalidStateError" ||
    name === "DatabaseClosedError" ||
    message.includes("version") ||
    message.includes("upgrade") ||
    message.includes("blocked") ||
    message.includes("corrupt")
  );
}

export function toPersistenceStartupError(error: unknown): PersistenceStartupError {
  if (error instanceof PersistenceStartupError) return error;
  if (error instanceof PersistenceError && error.code === "init_failed") {
    return new PersistenceStartupError(error.message, { recoverable: true, cause: error });
  }

  const message = readErrorMessage(error);
  if (message.includes("Persistence initialization was interrupted")) {
    return new PersistenceStartupError(message, { recoverable: false, cause: error });
  }

  if (typeof window !== "undefined" && !window.indexedDB) {
    return new PersistenceStartupError(
      "IndexedDB is unavailable in this browser context.",
      { recoverable: false, cause: error }
    );
  }

  if (isRecoverableDatabaseError(error)) {
    return new PersistenceStartupError(
      "Local IndexedDB could not be opened. The on-device database may need a reset.",
      { recoverable: true, cause: error }
    );
  }

  return new PersistenceStartupError(
    message || "Database initialization failed.",
    { recoverable: false, cause: error }
  );
}

export async function openLocalDatabase(db: ForgeOSDatabase): Promise<void> {
  if (db.isOpen()) return;
  try {
    await db.open();
  } catch (error) {
    throw toPersistenceStartupError(error);
  }
}
