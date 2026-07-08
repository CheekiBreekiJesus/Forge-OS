import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import {
  deriveLocalNotifications,
  getNotificationReadIds,
  markAllNotificationsRead,
  markNotificationRead
} from "@/features/notifications/local-notifications";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:notifications";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

describe("local notifications", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("derives backup reminder when no export timestamp exists", async () => {
    const repos = getTestRepos();
    const items = await deriveLocalNotifications(repos, DEFAULT_TENANT_ID, "en");
    expect(items.some((item) => item.id === "backup-not-exported")).toBe(true);
  });

  it("marks notifications as read", async () => {
    const repos = getTestRepos();
    const items = await deriveLocalNotifications(repos, DEFAULT_TENANT_ID, "pt-PT");
    const target = items[0];
    expect(target).toBeTruthy();
    if (!target) return;

    await markNotificationRead(repos, target.id);
    const readIds = await getNotificationReadIds(repos);
    expect(readIds.has(target.id)).toBe(true);

    const refreshed = await deriveLocalNotifications(repos, DEFAULT_TENANT_ID, "pt-PT");
    expect(refreshed.find((item) => item.id === target.id)?.read).toBe(true);

    await markAllNotificationsRead(
      repos,
      refreshed.map((item) => item.id)
    );
    const allRead = await deriveLocalNotifications(repos, DEFAULT_TENANT_ID, "pt-PT");
    expect(allRead.every((item) => item.read)).toBe(true);
  });

  it("hides backup reminder after export meta is set", async () => {
    const repos = getTestRepos();
    await repos.meta.set("lastBackupExportedAt", new Date().toISOString());
    const items = await deriveLocalNotifications(repos, DEFAULT_TENANT_ID, "en");
    expect(items.some((item) => item.id === "backup-not-exported")).toBe(false);
  });
});
