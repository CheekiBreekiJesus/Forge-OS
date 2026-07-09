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
const WAREHOUSE_ID = "91000000-0000-0000-0000-000000000001";
const LOCATION_A = "92000000-0000-0000-0000-000000000001";
const LOCATION_B = "92000000-0000-0000-0000-000000000002";

describeIf("inventory runtime supabase integration", () => {
  let client: Client;
  let itemId: string;

  beforeAll(async () => {
    await resetPublicSchema(databaseUrl!);
    await applySupabaseMigrations(databaseUrl!);
    client = new Client({ connectionString: databaseUrl! });
    await client.connect();

    const item = await client.query<{ id: string }>(
      `insert into public.inv_item_masters (
        tenant_id, internal_reference, item_type, name, description, base_unit_code, sku, active
      ) values ($1::uuid, 'INV-RPC-001', 'finished_good', 'RPC Test Item', 'desc', 'unit', 'INV-RPC-001', true)
      returning id`,
      [TENANT_A]
    );
    itemId = item.rows[0]!.id;

    await client.query(
      `insert into public.warehouses (id, tenant_id, code, name)
       values ($1::uuid, $2::uuid, 'WH-RPC', 'RPC Warehouse')
       on conflict (tenant_id, code) do nothing`,
      [WAREHOUSE_ID, TENANT_A]
    );

    await client.query(
      `insert into public.inv_stock_locations (
        id, tenant_id, warehouse_id, code, name, location_type, active
      ) values
        ($1::uuid, $2::uuid, $3::uuid, 'RPC-A', 'RPC A', 'shelf', true),
        ($4::uuid, $2::uuid, $3::uuid, 'RPC-B', 'RPC B', 'shelf', true)
      on conflict (tenant_id, code) do nothing`,
      [LOCATION_A, TENANT_A, WAREHOUSE_ID, LOCATION_B]
    );
  }, 120_000);

  it("receipt, issue, transfer, and idempotent retry work", async () => {
    const receipt = await client.query(
      `select public.inv_post_stock_movement(
        $1::uuid, 'operator-a', 'rpc:receipt:1', 'receipt', $2::uuid, $3::uuid, $4::uuid, 10
      ) as payload`,
      [TENANT_A, itemId, WAREHOUSE_ID, LOCATION_A]
    );
    expect(receipt.rows[0]?.payload.idempotent).toBe(false);

    const duplicate = await client.query(
      `select public.inv_post_stock_movement(
        $1::uuid, 'operator-a', 'rpc:receipt:1', 'receipt', $2::uuid, $3::uuid, $4::uuid, 10
      ) as payload`,
      [TENANT_A, itemId, WAREHOUSE_ID, LOCATION_A]
    );
    expect(duplicate.rows[0]?.payload.idempotent).toBe(true);

    const issue = await client.query(
      `select public.inv_post_stock_movement(
        $1::uuid, 'operator-a', 'rpc:issue:1', 'issue', $2::uuid, $3::uuid, $4::uuid, 3
      ) as payload`,
      [TENANT_A, itemId, WAREHOUSE_ID, LOCATION_A]
    );
    expect(issue.rows[0]?.payload.idempotent).toBe(false);

    const transfer = await client.query(
      `select public.inv_post_stock_movement(
        $1::uuid, 'operator-a', 'rpc:transfer:1', 'transfer', $2::uuid, $3::uuid, $4::uuid, 2,
        'unit', 'available', $5::uuid
      ) as payload`,
      [TENANT_A, itemId, WAREHOUSE_ID, LOCATION_A, LOCATION_B]
    );
    expect(transfer.rows[0]?.payload.idempotent).toBe(false);

    const available = await client.query<{ qty: string }>(
      `select public.inv_available_quantity($1::uuid, $2::uuid, $3::uuid) as qty`,
      [TENANT_A, itemId, LOCATION_A]
    );
    expect(Number(available.rows[0]?.qty)).toBe(5);
  });

  it("rejects stock movement when item belongs to another tenant", async () => {
    await expect(
      client.query(
        `select public.inv_post_stock_movement(
          $1::uuid, 'operator-b', 'rpc:cross-tenant', 'receipt', $2::uuid, $3::uuid, $4::uuid, 1
        )`,
        [TENANT_B, itemId, WAREHOUSE_ID, LOCATION_A]
      )
    ).rejects.toThrow(/inventory item not found/i);
  });

  it("rejects insufficient stock on issue", async () => {
    await expect(
      client.query(
        `select public.inv_post_stock_movement(
          $1::uuid, 'operator-a', 'rpc:issue:fail', 'issue', $2::uuid, $3::uuid, $4::uuid, 9999
        )`,
        [TENANT_A, itemId, WAREHOUSE_ID, LOCATION_A]
      )
    ).rejects.toThrow(/insufficient/i);
  });

  it("links barcode and writes activity log", async () => {
    const link = await client.query(
      `select public.inv_link_barcode($1::uuid, 'operator-a', $2::uuid, '5601234567890') as payload`,
      [TENANT_A, itemId]
    );
    expect(link.rows[0]?.payload.normalized_value).toBe("5601234567890");

    const audit = await client.query(
      `select activity_type from public.inv_activity_log
        where tenant_id = $1::uuid and entity_type = 'inv_barcode_record'
        order by occurred_at desc limit 1`,
      [TENANT_A]
    );
    expect(audit.rows[0]?.activity_type).toBe("barcode.linked");
  });

  it("resolves ambiguous duplicate barcodes only when multiple active records exist", async () => {
    const secondItem = await client.query<{ id: string }>(
      `insert into public.inv_item_masters (
        tenant_id, internal_reference, item_type, name, description, base_unit_code, sku, active
      ) values ($1::uuid, 'INV-RPC-002', 'finished_good', 'Second', 'desc', 'unit', 'INV-RPC-002', true)
      returning id`,
      [TENANT_A]
    );
    await client.query(
      `update public.inv_barcode_records set status = 'inactive'
        where tenant_id = $1::uuid and normalized_value = '5601234567890'`,
      [TENANT_A]
    );
    await client.query(
      `select public.inv_link_barcode($1::uuid, 'operator-a', $2::uuid, '5609999999999')`,
      [TENANT_A, secondItem.rows[0]!.id]
    );
    const rows = await client.query(
      `select count(*)::int as count from public.inv_barcode_records
        where tenant_id = $1::uuid and normalized_value = '5609999999999' and status = 'active'`,
      [TENANT_A]
    );
    expect(rows.rows[0]?.count).toBe(1);
  });
});
