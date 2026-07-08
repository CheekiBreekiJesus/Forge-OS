export function readSupabaseUrl(env: Record<string, string | undefined> = process.env): string {
  return (env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? env.SUPABASE_URL?.trim() ?? "").replace(/\/$/, "");
}

export function readSupabaseAnonKey(env: Record<string, string | undefined> = process.env): string {
  return env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function readSupabaseServiceRoleKey(
  env: Record<string, string | undefined> = process.env
): string {
  return env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

export function isSupabaseAuthConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  const url = readSupabaseUrl(env);
  const anon = readSupabaseAnonKey(env);
  return Boolean(url && anon && !url.includes("your-project-ref"));
}
