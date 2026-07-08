import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202607040001_auth_membership_status_permissions.sql"),
  "utf8"
);

describe("auth membership migration", () => {
  it("adds required membership status and permission fields", () => {
    expect(migration).toContain("add column if not exists status text");
    expect(migration).toContain("add column if not exists permissions text[]");
    expect(migration).toContain("drop constraint if exists tenant_memberships_status_check");
    expect(migration).toContain("set status = 'suspended'");
    expect(migration).toContain("where status = 'disabled'");
    expect(migration).toContain("tenant_memberships_status_check");
    expect(migration).toContain("'pending', 'active', 'suspended', 'revoked'");
  });

  it("adds role constraints and indexes for tenant membership lookup", () => {
    expect(migration).toContain("tenant_memberships_role_check");
    expect(migration).toContain("tenant_memberships_user_status_idx");
    expect(migration).toContain("tenant_memberships_tenant_status_idx");
    expect(migration).toContain("grant select on public.tenant_memberships to authenticated");
  });

  it("repairs tenant RLS lookup to only grant active memberships", () => {
    expect(migration).toContain("create or replace function public.current_user_tenant_ids()");
    expect(migration).toContain("and status = 'active'");
  });
});
