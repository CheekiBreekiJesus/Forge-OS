import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { destroyDatabaseForTests } from "@/persistence/registry";

const TEST_DB = "forgeos:test:profiles";

describe("profile persistence", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("seeds default company profile once", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const first = await repos.companyProfiles.getForTenant(DEFAULT_TENANT_ID);
    expect(first?.tradingName).toBe("JH Gomes");

    await seedDatabase(getDatabase(TEST_DB), DEFAULT_TENANT_ID, false);
    const second = await repos.companyProfiles.getForTenant(DEFAULT_TENANT_ID);
    expect(second?.id).toBe(first?.id);
  });

  it("creates and lists sender identities with default", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const company = await repos.companyProfiles.getForTenant(DEFAULT_TENANT_ID);
    const user = await repos.userProfiles.getCurrent(DEFAULT_TENANT_ID);
    expect(company).toBeTruthy();
    expect(user).toBeTruthy();

    const sender = await repos.senderIdentities.create(DEFAULT_TENANT_ID, {
      active: true,
      companyProfileId: company!.id,
      defaultLanguage: "pt-PT",
      displayName: "Test Sender",
      fromEmail: "test@demo.local",
      isDefault: false,
      jobTitle: "Sales",
      phone: "",
      replyToEmail: "test@demo.local",
      signatureHtml: "",
      signatureText: "",
      userProfileId: user!.id
    });
    expect(sender.id).toBeTruthy();

    const defaultSender = await repos.senderIdentities.getDefault(DEFAULT_TENANT_ID);
    expect(defaultSender?.isDefault).toBe(true);
  });

  it("seeds products with email fields", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const products = await repos.products.list(DEFAULT_TENANT_ID);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]?.productPageUrl).toContain("http");
  });
});
