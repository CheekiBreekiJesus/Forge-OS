import { readPersistenceMode } from "@/persistence/mode";

export class LocalDemoLifecycleError extends Error {
  readonly code = "local_demo_lifecycle_blocked" as const;

  constructor(message: string) {
    super(message);
    this.name = "LocalDemoLifecycleError";
  }
}

export function isProductionDemoLifecycleFlagEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.FORGEOS_DEMO_LIFECYCLE_ENABLED === "true";
}

export function isLocalDemoLifecycleAllowed(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (readPersistenceMode(env) !== "local") {
    return false;
  }
  if (env.NODE_ENV === "production" && !isProductionDemoLifecycleFlagEnabled(env)) {
    return false;
  }
  return true;
}

export function assertLocalDemoLifecycleAllowed(
  env: Record<string, string | undefined> = process.env
): void {
  if (readPersistenceMode(env) === "supabase") {
    throw new LocalDemoLifecycleError(
      "Local demo data lifecycle is unavailable in Supabase persistence mode."
    );
  }
  if (env.NODE_ENV === "production" && !isProductionDemoLifecycleFlagEnabled(env)) {
    throw new LocalDemoLifecycleError(
      "Local demo data lifecycle is disabled in production unless FORGEOS_DEMO_LIFECYCLE_ENABLED=true."
    );
  }
}
