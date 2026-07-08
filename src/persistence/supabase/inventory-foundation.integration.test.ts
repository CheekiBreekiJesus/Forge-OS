import { describe, expect, it } from "vitest";
import {
  applySupabaseMigrations,
  readIntegrationDatabaseUrl,
  resetPublicSchema
} from "@/persistence/supabase/test-harness";

const databaseUrl = readIntegrationDatabaseUrl();

describe.skipIf(!databaseUrl)("inventory foundation supabase integration", () => {
  it("applies migrations with tenant-scoped inventory tables", async () => {
    await resetPublicSchema(databaseUrl!);
    await applySupabaseMigrations(databaseUrl!);

    const { Client } = await import("pg");
    const client = new Client({ connectionString: databaseUrl! });
    await client.connect();
    try {
      const tables = await client.query<{ tablename: string }>(
        `select tablename from pg_tables
         where schemaname = 'public'
           and tablename ~ '^inv_'
         order by tablename`
      );
      expect(tables.rows.map((row) => row.tablename)).toEqual([
        "inv_activity_log",
        "inv_item_masters",
        "inv_ledger_entries",
        "inv_lots",
        "inv_reservations",
        "inv_stock_locations",
        "inv_transactions"
      ]);
    } finally {
      await client.end();
    }
  });
});
