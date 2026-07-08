import { describe, expect, it, beforeAll } from "vitest";
import { Client } from "pg";
import {
  applySupabaseMigrations,
  readIntegrationDatabaseUrl,
  resetPublicSchema
} from "./test-harness";

const databaseUrl = readIntegrationDatabaseUrl();
const describeIf = databaseUrl ? describe : describe.skip;

describeIf("Supabase outreach SQL integration", () => {
  let client: Client;

  beforeAll(async () => {
    if (!databaseUrl) return;
    await resetPublicSchema(databaseUrl);
    await applySupabaseMigrations(databaseUrl);
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
  }, 120_000);

  it("claims delivery once and returns already_processed on duplicate", async () => {
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const campaignId = "55555555-5555-4555-8555-555555555555";
    const recipientId = "66666666-6666-4666-8666-666666666666";
    const leadId = "33333333-3333-4333-8333-333333333333";
    const actorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const idempotencyKey = `outreach-send:${tenantId}:${recipientId}:alex@example.test::Exact Approved Subject::Exact approved body paragraph.::0`;
    const fingerprint = "fp-integration-test";

    const first = await client.query(
      "select public.claim_outreach_send_attempt($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6,$7,$8::uuid,$9) as payload",
      [
        tenantId,
        campaignId,
        recipientId,
        leadId,
        "alex@example.test::Exact Approved Subject::Exact approved body paragraph.::0",
        idempotencyKey,
        fingerprint,
        actorId,
        "alex@example.test"
      ]
    );

    expect(first.rows[0]?.payload.result).toBe("claimed");

    const second = await client.query(
      "select public.claim_outreach_send_attempt($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6,$7,$8::uuid,$9) as payload",
      [
        tenantId,
        campaignId,
        recipientId,
        leadId,
        "alex@example.test::Exact Approved Subject::Exact approved body paragraph.::0",
        idempotencyKey,
        fingerprint,
        actorId,
        "alex@example.test"
      ]
    );

    expect(second.rows[0]?.payload.result).toBe("already_processed");
  });

  it("blocks bounced leads", async () => {
    await client.query(
      `insert into public.outreach_campaign_recipients (
        id, tenant_id, campaign_id, lead_id, snapshot_email, snapshot_company_name,
        snapshot_contact_name, draft_status, personalized_subject, personalized_plain_text,
        approval_content_hash, approved_at, approved_by
      ) values (
        '77777777-7777-4777-8777-777777777777',
        '11111111-1111-4111-8111-111111111111',
        '55555555-5555-4555-8555-555555555555',
        '44444444-4444-4444-8444-444444444444',
        'bounce@example.test', 'Bounced Co', 'Bounce Lead', 'APPROVED',
        'Subject', 'Body', 'hash-bounced', now(), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      ) on conflict (id) do nothing`
    );

    const result = await client.query(
      "select public.claim_outreach_send_attempt($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6,$7,$8::uuid,$9) as payload",
      [
        "11111111-1111-4111-8111-111111111111",
        "55555555-5555-4555-8555-555555555555",
        "77777777-7777-4777-8777-777777777777",
        "44444444-4444-4444-8444-444444444444",
        "hash-bounced",
        "outreach-send:bounced",
        "fp-bounced",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "bounce@example.test"
      ]
    );

    expect(result.rows[0]?.payload.result).toBe("blocked");
    expect(result.rows[0]?.payload.reason).toBe("lead_bounced");
  });

  it("rejects cross-tenant recipient reads via tenant filter", async () => {
    const row = await client.query(
      "select id from public.outreach_campaign_recipients where tenant_id = $1::uuid and id = $2::uuid",
      ["22222222-2222-4222-8222-222222222222", "66666666-6666-4666-8666-666666666666"]
    );
    expect(row.rowCount).toBe(0);
  });
});
