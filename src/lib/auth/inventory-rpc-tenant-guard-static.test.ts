import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202607091300_inventory_rpc_tenant_guards.sql"),
  "utf8"
);

const productImportMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/202607091000_product_import_rpc_tenant_fix.sql"),
  "utf8"
);

const guardedFunctions = [
  "inv_post_stock_movement",
  "inv_create_reservation",
  "inv_release_reservation",
  "inv_link_barcode"
] as const;

describe("inventory RPC tenant guard migration", () => {
  it("defines a shared authenticated tenant access assertion", () => {
    expect(migration).toContain("create or replace function public.assert_authenticated_tenant_access(p_tenant_id uuid)");
    expect(migration).toContain("auth.uid() is not null");
    expect(migration).toContain("current_user_tenant_ids()");
    expect(migration).toContain("raise exception 'tenant access denied'");
  });

  it.each(guardedFunctions)("guards %s with assert_authenticated_tenant_access", (functionName) => {
    const pattern = new RegExp(
      `create or replace function public\\.${functionName}[\\s\\S]*?perform public\\.assert_authenticated_tenant_access\\(p_tenant_id\\);`
    );
    expect(migration).toMatch(pattern);
  });

  it("matches the apply_product_import_job authenticated guard pattern", () => {
    expect(productImportMigration).toContain(
      "if auth.uid() is not null and v_job.tenant_id not in (select public.current_user_tenant_ids()) then"
    );
    expect(migration).toContain(
      "if auth.uid() is not null and p_tenant_id not in (select public.current_user_tenant_ids()) then"
    );
  });
});
