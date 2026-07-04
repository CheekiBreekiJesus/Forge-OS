import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationRoot = join(process.cwd(), "supabase", "migrations");

function migration(name: string): string {
  return readFileSync(join(migrationRoot, name), "utf8");
}

describe("outreach hosted runtime migrations", () => {
  it("keeps durable send-job locking and usage RPCs service-role only", () => {
    const sql = migration("202607020002_outreach_send_jobs.sql");

    expect(sql).toContain("create table if not exists public.outreach_send_jobs");
    expect(sql).toContain("alter table public.outreach_send_jobs enable row level security");
    expect(sql).toContain("create or replace function public.acquire_outreach_send_job_lock");
    expect(sql).toContain("security invoker");
    expect(sql).toContain("revoke all on function public.acquire_outreach_send_job_lock");
    expect(sql).toContain("grant execute on function public.acquire_outreach_send_job_lock");
    expect(sql).toContain("create or replace function public.increment_outreach_send_job_daily_usage");
    expect(sql).toContain("unique (tenant_id, idempotency_key)");
  });

  it("adds the minimal hosted campaign projection with RLS and explicit service-role grants", () => {
    const sql = migration("202607030001_outreach_hosted_runtime_projection.sql");

    expect(sql).toContain("add column if not exists status text not null default 'active'");
    expect(sql).toContain("add column if not exists permissions text[] not null default '{}'");
    expect(sql).toContain("create table if not exists public.outreach_hosted_campaigns");
    expect(sql).toContain("create table if not exists public.outreach_hosted_campaign_recipients");
    expect(sql).toContain("create table if not exists public.outreach_hosted_activity_events");
    expect(sql).toContain("greeting_override text not null default ''");
    expect(sql).toContain("organization_display_name_override text not null default ''");
    expect(sql).toContain("contact_salutation text check");
    expect(sql).toContain("delivery_mode text not null default 'simulation'");
    expect(sql).toContain("alter table public.outreach_hosted_campaigns enable row level security");
    expect(sql).toContain("alter table public.outreach_hosted_campaign_recipients enable row level security");
    expect(sql).toContain("grant select, insert, update, delete on public.outreach_hosted_campaigns to service_role");
    expect(sql).toContain("grant select, insert, update, delete on public.outreach_hosted_campaign_recipients to service_role");
  });

  it("adds hosted campaign preparation status metadata for idempotent snapshots", () => {
    const sql = migration("202607030002_outreach_hosted_preparation_status.sql");

    expect(sql).toContain("alter table public.outreach_hosted_campaigns");
    expect(sql).toContain("add column if not exists snapshot_fingerprint text");
    expect(sql).toContain("create index if not exists outreach_hosted_campaigns_snapshot_idx");
    expect(sql).toContain("snapshot_fingerprint");
  });
});
