export type PersistenceMode = "local" | "supabase";

export function readPersistenceMode(
  env: Record<string, string | undefined> = process.env
): PersistenceMode {
  const raw = env.FORGEOS_PERSISTENCE_MODE?.trim().toLowerCase();
  if (raw === "supabase") return "supabase";
  return "local";
}

export function isSupabasePersistenceConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? env.SUPABASE_URL?.trim() ?? "";
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return Boolean(url && key && !url.includes("your-project-ref"));
}

export function resolveEffectivePersistenceMode(
  env: Record<string, string | undefined> = process.env
): PersistenceMode {
  const requested = readPersistenceMode(env);
  if (requested === "supabase" && !isSupabasePersistenceConfigured(env)) {
    return "local";
  }
  return requested;
}
