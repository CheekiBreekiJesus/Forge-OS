import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import {
  convertSimulationToQuote,
  createCustomizerSimulationRepository
} from "@/persistence/indexeddb/customizer-repositories";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:customizer-integration";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

describe("customizer integration persistence", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("creates a simulation and converts it to a linked estimate quote", async () => {
    const repos = getTestRepos();
    const products = await repos.products.list(DEFAULT_TENANT_ID);
    const cup = products.find((product) => product.sku.includes("CUP"));
    expect(cup).toBeTruthy();
    if (!cup) return;

    const simulation = await repos.customizerSimulations.create(DEFAULT_TENANT_ID, {
      configuration: {
        artworkOffsetX: 0,
        artworkOffsetY: 0,
        artworkPosition: "center",
        artworkRotation: 0,
        artworkScale: 1,
        cupSize: cup.capacity,
        cupType: cup.category,
        desiredDeliveryDate: null,
        material: cup.material,
        printArea: "wrap",
        printColorCount: 1
      },
      pricing: {
        assumptions: ["Test assumption"],
        isEstimate: true,
        manualUnitPriceOverride: null,
        overrideReason: null,
        ruleId: "test-rule",
        setupCost: 50,
        subtotal: 500,
        total: 615,
        unitPrice: 0.45,
        vat: 115
      },
      mockupAssetId: "asset_mockup_test",
      productId: cup.id,
      productName: cup.name,
      quantity: 1000,
      status: "saved"
    });

    const { quote, simulation: converted } = await convertSimulationToQuote(
      DEFAULT_TENANT_ID,
      simulation.id,
      repos.customizerSimulations,
      repos.quotes,
      repos.activities
    );

    expect(quote.simulationId).toBe(simulation.id);
    expect(quote.mockupAssetId).toBe("asset_mockup_test");
    expect(quote.isEstimate).toBe(true);
    expect(converted.status).toBe("converted");
    expect(converted.quoteId).toBe(quote.id);
  });

  it("updates an existing draft quote instead of creating a duplicate", async () => {
    const repos = getTestRepos();
    const products = await repos.products.list(DEFAULT_TENANT_ID);
    const cup = products.find((product) => product.sku.includes("CUP"));
    expect(cup).toBeTruthy();
    if (!cup) return;

    const simulation = await repos.customizerSimulations.create(DEFAULT_TENANT_ID, {
      configuration: {
        artworkOffsetX: 0,
        artworkOffsetY: 0,
        artworkPosition: "center",
        artworkRotation: 0,
        artworkScale: 1,
        cupSize: cup.capacity,
        cupType: cup.category,
        desiredDeliveryDate: null,
        material: cup.material,
        printArea: "wrap",
        printColorCount: 1
      },
      pricing: {
        assumptions: ["Initial"],
        isEstimate: true,
        manualUnitPriceOverride: null,
        overrideReason: null,
        ruleId: "test-rule",
        setupCost: 50,
        subtotal: 500,
        total: 615,
        unitPrice: 0.45,
        vat: 115
      },
      productId: cup.id,
      productName: cup.name,
      quantity: 1000,
      status: "saved"
    });

    const first = await convertSimulationToQuote(
      DEFAULT_TENANT_ID,
      simulation.id,
      repos.customizerSimulations,
      repos.quotes,
      repos.activities
    );

    await repos.customizerSimulations.update(DEFAULT_TENANT_ID, simulation.id, {
      pricing: {
        ...simulation.pricing,
        subtotal: 900,
        total: 1107,
        unitPrice: 0.4
      },
      quantity: 2000
    });

    const second = await convertSimulationToQuote(
      DEFAULT_TENANT_ID,
      simulation.id,
      repos.customizerSimulations,
      repos.quotes,
      repos.activities
    );

    expect(second.quote.id).toBe(first.quote.id);
    expect(second.quote.quantity).toBe(2000);
    const allQuotes = await repos.quotes.list(DEFAULT_TENANT_ID);
    expect(allQuotes.filter((row) => row.simulationId === simulation.id)).toHaveLength(1);
  });

  it("duplicates and archives simulations", async () => {
    const repos = getTestRepos();
    const db = getDatabase(TEST_DB);
    const simulations = createCustomizerSimulationRepository(db);
    const products = await repos.products.list(DEFAULT_TENANT_ID);
    const cup = products[0];
    const created = await simulations.create(DEFAULT_TENANT_ID, {
      configuration: {
        artworkOffsetX: 0,
        artworkOffsetY: 0,
        artworkPosition: "center",
        artworkRotation: 0,
        artworkScale: 1,
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
      quantity: 500
    });

    const duplicate = await simulations.duplicate(DEFAULT_TENANT_ID, created.id);
    expect(duplicate.id).not.toBe(created.id);
    expect(duplicate.productId).toBe(created.productId);

    const archived = await simulations.archive(DEFAULT_TENANT_ID, created.id);
    expect(archived.status).toBe("archived");

    const restored = await simulations.restore(DEFAULT_TENANT_ID, created.id);
    expect(restored.status).toBe("saved");
  });
});
