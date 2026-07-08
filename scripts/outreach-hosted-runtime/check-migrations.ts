import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationRoot = join(process.cwd(), "supabase", "migrations");
const required = [
  {
    file: "202607020002_outreach_send_jobs.sql",
    tokens: [
      "create table if not exists public.outreach_send_jobs",
      "create or replace function public.acquire_outreach_send_job_lock",
      "grant execute on function public.acquire_outreach_send_job_lock"
    ]
  },
  {
    file: "202607030001_outreach_hosted_runtime_projection.sql",
    tokens: [
      "create table if not exists public.outreach_hosted_campaigns",
      "create table if not exists public.outreach_hosted_campaign_recipients",
      "create table if not exists public.outreach_hosted_activity_events",
      "grant select, insert, update, delete on public.outreach_hosted_campaigns to service_role"
    ]
  },
  {
    file: "202607030002_outreach_hosted_preparation_status.sql",
    tokens: [
      "add column if not exists snapshot_fingerprint text",
      "create index if not exists outreach_hosted_campaigns_snapshot_idx"
    ]
  }
];

const missing: string[] = [];

for (const item of required) {
  let sql = "";
  try {
    sql = readFileSync(join(migrationRoot, item.file), "utf8");
  } catch {
    missing.push(`${item.file}: file missing`);
    continue;
  }
  for (const token of item.tokens) {
    if (!sql.includes(token)) {
      missing.push(`${item.file}: missing "${token}"`);
    }
  }
}

if (missing.length > 0) {
  console.error("Hosted outreach migration static check failed:");
  for (const issue of missing) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Hosted outreach migration static check passed.");
console.log("Runtime application is intentionally manual. Use Supabase CLI from this repo:");
console.log("  npx supabase db reset --local");
console.log("  npx supabase db push --linked");
console.log("Run only against local or approved non-production projects.");
