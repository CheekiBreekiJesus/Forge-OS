import type { LocalRepositoryBundle } from "../interfaces";
import { ServerPersistenceUnavailableError } from "../server-factory";

/**
 * Supabase repository bundle placeholder.
 * Full LeadOps table adapters are added incrementally; until complete, server routes return 503.
 */
export function createSupabaseRepositoryBundle(): LocalRepositoryBundle {
  throw new ServerPersistenceUnavailableError();
}
