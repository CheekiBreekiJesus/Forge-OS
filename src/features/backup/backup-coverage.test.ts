import { describe, expect, it } from "vitest";
import { ForgeOSDatabase } from "@/persistence/db";
import { BACKUP_TABLE_KEYS } from "@/features/backup/service";

describe("backup table coverage", () => {
  it("maps every IndexedDB data table to backup export coverage", () => {
    const db = new ForgeOSDatabase("forgeos:test:backup-coverage");
    for (const tableKey of BACKUP_TABLE_KEYS) {
      expect(db[tableKey as keyof ForgeOSDatabase], `missing Dexie table ${tableKey}`).toBeDefined();
    }
    expect(db.localAssets).toBeDefined();
    expect(db.meta).toBeDefined();
    expect(BACKUP_TABLE_KEYS).not.toContain("localAssets");
    expect(BACKUP_TABLE_KEYS).not.toContain("meta");
  });
});
