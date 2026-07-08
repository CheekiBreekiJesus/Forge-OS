import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseServiceRoleKey, readSupabaseUrl } from "./env";

let serviceClient: SupabaseClient | null = null;

export function createSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient;
  const url = readSupabaseUrl();
  const key = readSupabaseServiceRoleKey();
  if (!url || !key) {
    throw new Error("Supabase service role is not configured.");
  }
  serviceClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return serviceClient;
}

export function resetSupabaseServiceClientForTests(): void {
  serviceClient = null;
}
