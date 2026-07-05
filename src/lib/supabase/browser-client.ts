"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export class SupabasePublicConfigError extends Error {
  constructor(message = "Supabase public configuration is missing.") {
    super(message);
    this.name = "SupabasePublicConfigError";
  }
}

export function createForgeOSBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseUrl || !anonKey || supabaseUrl.includes("your-project-ref")) {
    throw new SupabasePublicConfigError();
  }

  browserClient = createBrowserClient(supabaseUrl, anonKey);
  return browserClient;
}
