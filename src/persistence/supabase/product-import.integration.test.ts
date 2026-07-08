import { describe, expect, it } from "vitest";
import {
  applySupabaseMigrations,
  readIntegrationDatabaseUrl,
  resetPublicSchema
} from "@/persistence/supabase/test-harness";

const databaseUrl = readIntegrationDatabaseUrl();

describe.skipIf(!databaseUrl)("product data import supabase integration", () => {
  it("applies product import staging tables and RPC", async () => {
    await resetPublicSchema(databaseUrl!);
    await applySupabaseMigrations(databaseUrl!);

    const { Client } = await import("pg");
    const client = new Client({ connectionString: databaseUrl! });
    await client.connect();
    try {
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
        `select proname from pg_proc
         where proname = 'apply_product_import_job'`
      );
      expect(rpc.rows.length).toBe(1);
    } finally {
      await client.end();
    }
  });
});
