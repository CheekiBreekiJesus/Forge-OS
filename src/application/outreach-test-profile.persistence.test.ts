import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { exportBackup, importBackup } from "@/features/backup/service";
import { buildJhGomesOutreachTestProfileDefaults } from "@/features/outreach-test-profile/defaults";
import {
  loadJhGomesOutreachTestProfileDefaults,
  saveOutreachTestProfile
} from "@/application/outreach-test-profile-service";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { destroyDatabaseForTests } from "@/persistence/registry";

const TEST_DB = "forgeos:test:outreach-profile";

describe("outreach test profile persistence", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("persists profile after reload", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const saved = await saveOutreachTestProfile(repos, DEFAULT_TENANT_ID, {
      ...buildJhGomesOutreachTestProfileDefaults(),
      defaultOptOutLine: "Opt-out line",
      defaultProductFocus: "Cup printing",
      defaultSignature: "Best regards",
      defaultTestRecipient: "qa@example.com"
    });

    const reloaded = await repos.outreachTestProfiles.getForTenant(DEFAULT_TENANT_ID);
    expect(reloaded?.id).toBe(saved.id);
    expect(reloaded?.defaultTestRecipient).toBe("qa@example.com");
    expect(reloaded?.senderEmail).toBe("operador@synthetic.example");
  });

  it("includes profile in backup and restore", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    await loadJhGomesOutreachTestProfileDefaults(repos, DEFAULT_TENANT_ID);
    const backup = await exportBackup(repos, DEFAULT_TENANT_ID, false);
    expect(backup.tables.outreachTestProfiles).toHaveLength(1);
    expect(JSON.stringify(backup)).not.toContain("xkeysib-");

    await repos.outreachTestProfiles.reset(DEFAULT_TENANT_ID);
    expect(await repos.outreachTestProfiles.getForTenant(DEFAULT_TENANT_ID)).toBeNull();

    await importBackup(repos, backup);
    const restored = await repos.outreachTestProfiles.getForTenant(DEFAULT_TENANT_ID);
    expect(restored?.companyName).toBe("JH Gomes");
  });

  it("does not store secret-like values", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    await expect(
      saveOutreachTestProfile(repos, DEFAULT_TENANT_ID, {
        ...buildJhGomesOutreachTestProfileDefaults(),
        senderEmail: "xkeysib-secret-value"
      })
    ).rejects.toThrow(/must not contain secrets/i);
  });
});
