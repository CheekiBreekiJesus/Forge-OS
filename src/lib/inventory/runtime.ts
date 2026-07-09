import { resolveEffectivePersistenceMode } from "@/persistence/mode";

export type InventoryRuntimeMode = "supabase" | "demo";

export function resolveInventoryRuntimeMode(
  env: Record<string, string | undefined> = process.env
): InventoryRuntimeMode {
  if (env.NEXT_PUBLIC_FORGEOS_FORCE_DEMO_INVENTORY === "true") {
    return "demo";
  }
  return resolveEffectivePersistenceMode(env) === "supabase" ? "supabase" : "demo";
}

export function isInventorySupabaseRuntime(
  env: Record<string, string | undefined> = process.env
): boolean {
  return resolveInventoryRuntimeMode(env) === "supabase";
}

export function readClientInventoryRuntimeMode(): InventoryRuntimeMode {
  if (typeof window === "undefined") {
    return resolveInventoryRuntimeMode();
  }
  if (window.localStorage.getItem("forgeos:inventory:force-demo") === "true") {
    return "demo";
  }
  const configured = process.env.NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE?.trim().toLowerCase();
  if (configured === "supabase") return "supabase";
  if (configured === "local") return "demo";
  return resolveInventoryRuntimeMode();
}
