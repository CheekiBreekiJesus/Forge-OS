/**
 * Supabase auth integration — Phase 1 stub.
 * Production: @supabase/ssr session helpers + tenant JWT claims.
 */
export interface ForgeSession {
  userId: string;
  tenantId: string;
  role: string;
  locale?: string;
}

export function getDemoSession(): ForgeSession {
  return {
    userId: "00000000-0000-4000-8000-000000000010",
    tenantId: "00000000-0000-4000-8000-000000000001",
    role: "director",
    locale: "pt-PT",
  };
}
