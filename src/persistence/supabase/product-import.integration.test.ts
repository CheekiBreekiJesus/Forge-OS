import { describe, expect, it, beforeAll } from "vitest";
import { Client } from "pg";
import {
  applySupabaseMigrations,
  readIntegrationDatabaseUrl,
  resetPublicSchema
} from "@/persistence/supabase/test-harness";

const databaseUrl = readIntegrationDatabaseUrl();
const describeIf = databaseUrl ? describe : describe.skip;

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

async function seedImportJob(
  client: Client,
  input: {
    jobId: string;
    tenantId: string;
    rowId: string;
    internalReference: string;
    description: string;
    barcode?: string;
    proposedAction?: string;
    approvedAction?: string | null;
  }
): Promise<void> {
  await client.query(
    `insert into public.prod_import_jobs (
      id, tenant_id, filename, file_format, file_fingerprint, worksheet_name,
      status, idempotency_key, operator_id, total_rows, valid_rows
    ) values ($1::uuid, $2::uuid, 'synthetic.csv', 'csv', 'fp-test', 'Sheet1', 'approved', $3, 'operator', 1, 1)`,
    [input.jobId, input.tenantId, `apply:${input.jobId}`]
  );

  await client.query(
    `insert into public.prod_import_rows (
      id, tenant_id, job_id, source_row_number, original_values, normalized_values,
      proposed_action, approved_action, resolution_status
    ) values (
      $1::uuid, $2::uuid, $3::uuid, 1, '{}'::jsonb,
      jsonb_build_object(
        'internalReference', $4::text,
        'description', $5::text,
        'barcode', $6::text,
        'baseUnit', 'unit',
        'status', 'active'
      ),
      $7::text, $8::text, 'valid'
    )`,
    [
      input.rowId,
      input.tenantId,
      input.jobId,
      input.internalReference,
      input.description,
      input.barcode ?? null,
      input.proposedAction ?? "create_new",
      input.approvedAction ?? null
    ]
  );
}

describeIf("product data import supabase integration", () => {
  let client: Client;

  beforeAll(async () => {
    if (!databaseUrl) return;
    await resetPublicSchema(databaseUrl);
    await applySupabaseMigrations(databaseUrl);
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
  }, 120_000);

  it("applies product import staging tables and RPC", async () => {
    const tables = await client.query<{ tablename: string }>(
      `select tablename from pg_tables
       where schemaname = 'public'
         and tablename like 'prod_import_%'
       order by tablename`
    );
    expect(tables.rows.map((row) => row.tablename)).toEqual([
      "prod_import_jobs",
      "prod_import_mapping_profiles",
      "prod_import_rows",
      "prod_import_validation_issues"
    ]);

    const rpc = await client.query<{ proname: string }>(
      `select proname from pg_proc where proname = 'apply_product_import_job'`
    );
    expect(rpc.rows.length).toBe(1);
  });

  it("creates inventory items and exposes barcode for lookup", async () => {
    const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01";
    const rowId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";

    await seedImportJob(client, {
      barcode: "5601999888777",
      description: "Synthetic Import Cup",
      internalReference: "SYN-IMPORT-001",
      jobId,
      rowId,
      tenantId: TENANT_A
    });

    const result = await client.query(
      `select public.apply_product_import_job($1::uuid, $2, $3) as payload`,
      [jobId, `apply:${jobId}`, "operator-a"]
    );

    expect(result.rows[0]?.payload.applied_rows).toBe(1);

    const lookup = await client.query(
      `select id, internal_reference, barcode
         from public.inv_item_masters
        where tenant_id = $1::uuid
          and barcode = $2`,
      [TENANT_A, "5601999888777"]
    );
    expect(lookup.rowCount).toBe(1);
    expect(lookup.rows[0]?.internal_reference).toBe("SYN-IMPORT-001");
  });

  it("returns idempotent summary on duplicate apply key", async () => {
    const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02";
    const rowId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
    const key = `apply:${jobId}`;

    await seedImportJob(client, {
      description: "Synthetic Import Lid",
      internalReference: "SYN-IMPORT-002",
      jobId,
      rowId,
      tenantId: TENANT_A
    });

    const first = await client.query(
      `select public.apply_product_import_job($1::uuid, $2, $3) as payload`,
      [jobId, key, "operator-a"]
    );
    expect(first.rows[0]?.payload.applied_rows).toBe(1);

    const second = await client.query(
      `select public.apply_product_import_job($1::uuid, $2, $3) as payload`,
      [jobId, key, "operator-a"]
    );
    expect(second.rows[0]?.payload.idempotent).toBe(true);
  });

  it("updates existing SKU when approved action is update", async () => {
    const existingId = "cccccccc-cccc-4ccc-8ccc-ccccccccccc1";
    await client.query(
      `insert into public.inv_item_masters (
        id, tenant_id, internal_reference, item_type, name, description, base_unit_code, sku, active
      ) values (
        $1::uuid, $2::uuid, 'SYN-UPDATE-001', 'finished_good', 'Old Name', 'Old description', 'unit', 'SYN-UPDATE-001', true
      )`,
      [existingId, TENANT_A]
    );

    const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03";
    const rowId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3";

    await seedImportJob(client, {
      approvedAction: "update",
      description: "Updated Synthetic Name",
      internalReference: "SYN-UPDATE-001",
      jobId,
      proposedAction: "update_missing_only",
      rowId,
      tenantId: TENANT_A
    });

    const result = await client.query(
      `select public.apply_product_import_job($1::uuid, $2, $3) as payload`,
      [jobId, `apply:${jobId}`, "operator-a"]
    );
    expect(result.rows[0]?.payload.applied_rows).toBe(1);

    const item = await client.query(
      `select name from public.inv_item_masters where id = $1::uuid`,
      [existingId]
    );
    expect(item.rows[0]?.name).toBe("Updated Synthetic Name");
  });

  it("skips rows with approved skip action", async () => {
    const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04";
    const rowId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4";

    await seedImportJob(client, {
      approvedAction: "skip",
      description: "Skipped Product",
      internalReference: "SYN-SKIP-001",
      jobId,
      proposedAction: "create_new",
      rowId,
      tenantId: TENANT_A
    });

    const result = await client.query(
      `select public.apply_product_import_job($1::uuid, $2, $3) as payload`,
      [jobId, `apply:${jobId}`, "operator-a"]
    );
    expect(result.rows[0]?.payload.skipped_rows).toBe(1);
    expect(result.rows[0]?.payload.applied_rows).toBe(0);

    const item = await client.query(
      `select id from public.inv_item_masters
        where tenant_id = $1::uuid and internal_reference = $2`,
      [TENANT_A, "SYN-SKIP-001"]
    );
    expect(item.rowCount).toBe(0);
  });

  it("records audit activity on successful apply", async () => {
    const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05";
    const rowId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5";

    await seedImportJob(client, {
      description: "Audited Product",
      internalReference: "SYN-AUDIT-001",
      jobId,
      rowId,
      tenantId: TENANT_A
    });

    await client.query(`select public.apply_product_import_job($1::uuid, $2, $3)`, [
      jobId,
      `apply:${jobId}`,
      "operator-a"
    ]);

    const audit = await client.query(
      `select activity_type, metadata
         from public.inv_activity_log
        where tenant_id = $1::uuid
          and entity_id = $2
        order by occurred_at desc
        limit 1`,
      [TENANT_A, jobId]
    );
    expect(audit.rows[0]?.activity_type).toBe("product_import_completed");
    expect(audit.rows[0]?.metadata.applied_rows).toBe(1);
  });

  it("isolates import jobs by tenant", async () => {
    const tenantAJob = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa06";
    const tenantBJob = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa07";

    await client.query(
      `insert into public.prod_import_jobs (
        id, tenant_id, filename, file_format, file_fingerprint, status, idempotency_key, operator_id
      ) values ($1::uuid, $2::uuid, 'a.csv', 'csv', 'fp-a', 'approved', 'key-a', 'op')`,
      [tenantAJob, TENANT_A]
    );
    await client.query(
      `insert into public.prod_import_jobs (
        id, tenant_id, filename, file_format, file_fingerprint, status, idempotency_key, operator_id
      ) values ($1::uuid, $2::uuid, 'b.csv', 'csv', 'fp-b', 'approved', 'key-b', 'op')`,
      [tenantBJob, TENANT_B]
    );

    const crossTenant = await client.query(
      `select id from public.prod_import_jobs
        where tenant_id = $1::uuid and id = $2::uuid`,
      [TENANT_B, tenantAJob]
    );
    expect(crossTenant.rowCount).toBe(0);
  });

  it("rejects apply when job is not approved", async () => {
    const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa08";
    await client.query(
      `insert into public.prod_import_jobs (
        id, tenant_id, filename, file_format, file_fingerprint, status, idempotency_key, operator_id
      ) values ($1::uuid, $2::uuid, 'pending.csv', 'csv', 'fp-pending', 'validated', 'key-pending', 'op')`,
      [jobId, TENANT_A]
    );

    await expect(
      client.query(`select public.apply_product_import_job($1::uuid, $2, $3)`, [
        jobId,
        `apply:${jobId}`,
        "operator-a"
      ])
    ).rejects.toThrow(/not approved/i);
  });
});
