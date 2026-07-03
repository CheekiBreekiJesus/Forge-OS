import type { LocalRepositoryBundle } from "./interfaces";
import { isSupabasePersistenceConfigured, readPersistenceMode } from "./mode";

/**
 * Server-side repository access for outreach API routes.
 * IndexedDB is browser-only; production server routes require Supabase persistence.
 */
export async function getServerOutreachRepositories(): Promise<LocalRepositoryBundle> {
  const mode = readPersistenceMode();
  if (mode === "local" && !isSupabasePersistenceConfigured()) {
    throw new ServerPersistenceUnavailableError();
  }

  if (isSupabasePersistenceConfigured()) {
    const { createSupabaseRepositoryBundle } = await import("./supabase/repository-bundle");
    return createSupabaseRepositoryBundle();
  }

  throw new ServerPersistenceUnavailableError();
}

export class ServerPersistenceUnavailableError extends Error {
  constructor() {
    super("Server outreach persistence is not configured. Set FORGEOS_PERSISTENCE_MODE=supabase with Supabase credentials.");
    this.name = "ServerPersistenceUnavailableError";
  }
}
