import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import {
  deriveOnboardingItems,
  dismissOnboarding,
  isOnboardingDismissed,
  onboardingProgress
} from "@/features/onboarding/checklist";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:onboarding";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

describe("onboarding checklist", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("marks customizer_tested when a simulation exists", async () => {
    const repos = getTestRepos();
    const products = await repos.products.list(DEFAULT_TENANT_ID);
    const cup = products.find((product) => product.sku.includes("CUP"));
    expect(cup).toBeTruthy();
    if (!cup) return;

    let items = await deriveOnboardingItems(repos, DEFAULT_TENANT_ID, "en");
    expect(items.find((item) => item.id === "customizer_tested")?.completed).toBe(false);

    await repos.customizerSimulations.create(DEFAULT_TENANT_ID, {
      configuration: {
        artworkPosition: "center",
        cupSize: "330 ml",
        cupType: "personalized-cups",
        desiredDeliveryDate: null,
        material: "PP",
        printArea: "wrap",
        printColorCount: 1
      },
      pricing: {
        assumptions: [],
        isEstimate: true,
        manualUnitPriceOverride: null,
        overrideReason: null,
        ruleId: null,
        setupCost: 0,
        subtotal: 100,
        total: 123,
        unitPrice: 0.1,
        vat: 23
      },
      productId: cup.id,
      productName: cup.name,
      quantity: 1000
    });

    items = await deriveOnboardingItems(repos, DEFAULT_TENANT_ID, "en");
    expect(items.find((item) => item.id === "customizer_tested")?.completed).toBe(true);
    expect(items.find((item) => item.id === "customizer_tested")?.href).toContain("/quotations/customizer");
  });

  it("tracks dismiss state and progress", async () => {
    const repos = getTestRepos();
    expect(await isOnboardingDismissed(repos)).toBe(false);
    await dismissOnboarding(repos);
    expect(await isOnboardingDismissed(repos)).toBe(true);

    const items = await deriveOnboardingItems(repos, DEFAULT_TENANT_ID, "pt-PT");
    const progress = onboardingProgress(items);
    expect(progress.total).toBe(11);
    expect(progress.percent).toBeGreaterThanOrEqual(0);
  });
});
