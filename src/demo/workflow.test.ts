import { describe, expect, it } from "vitest";
import {
  createWebhookEvent,
  getEmailTemplatesForLocale,
  getN8nWebhookQueue,
  getQuoteRequestFormModel,
  renderEmailTemplate
} from "./automation";
import { answerCopilotPrompt, copilotPrompts } from "./copilot";
import {
  importTemplates,
  operationalMachines,
  operationalProducts,
  personalizedCupQuotationRules,
  productionRoutings,
  qualityTemplates,
  stockItems
} from "./operational-seed";
import {
  applyStockMovement,
  calculateConfigurableCupQuote,
  calculateProductionMetrics,
  validateImportRows
} from "./operational-workflows";
import {
  calculatePersonalizedCupQuote,
  createDemoJobCard,
  createDemoProductionOrder,
  findCompatibleMachine,
  reserveInventoryForProduction
} from "./workflow";
import {
  demoInventoryItems,
  demoProducts,
  jhGomesTenant
} from "./seed";

describe("JH Gomes demo workflow", () => {
  const cup330 = demoProducts.find((product) => product.id === "prod_pp_cup_330");

  it("seeds JH Gomes as a tenant and includes required product categories", () => {
    const categories = new Set(demoProducts.map((product) => product.category));

    expect(jhGomesTenant).toMatchObject({
      defaultLocale: "pt-PT",
      id: "tenant_jh_gomes",
      slug: "jh-gomes"
    });
    expect(categories).toEqual(
      new Set([
        "personalized-cups",
        "paper-cups",
        "reusable-cups",
        "takeaway-packaging",
        "bags",
        "lids",
        "accessories"
      ])
    );
  });

  it("keeps required product catalog fields populated", () => {
    for (const product of demoProducts) {
      expect(product.name).toBeTruthy();
      expect(product.sku).toBeTruthy();
      expect(product.image).toBeTruthy();
      expect(product.material).toBeTruthy();
      expect(product.capacity).toBeTruthy();
      expect(product.color).toBeTruthy();
      expect(product.unitsPerBox).toBeGreaterThan(0);
      expect(product.stacksPerBox).toBeGreaterThan(0);
      expect(product.unitsPerStack).toBeGreaterThan(0);
      expect(product.compatibleLidsAccessories.length).toBeGreaterThan(0);
      expect(product.basePrice).toBeGreaterThan(0);
      expect(product.printArea).toBeTruthy();
      expect(product.leadTimeDays).toBeGreaterThan(0);
    }
  });

  it("calculates personalized cup quote totals with VAT", () => {
    expect(cup330).toBeDefined();

    const quote = calculatePersonalizedCupQuote({
      printColorCount: 2,
      product: cup330!,
      quantity: 12000
    });

    expect(quote.productCost).toBeCloseTo(624);
    expect(quote.setupCost).toBe(35);
    expect(quote.screenCost).toBe(56);
    expect(quote.inkCost).toBe(24);
    expect(quote.personalizationCost).toBeCloseTo(144);
    expect(quote.subtotal).toBeCloseTo(883);
    expect(quote.vat).toBeCloseTo(203.09);
    expect(quote.total).toBeCloseTo(1086.09);
  });

  it("converts an approved quote into a production job card with machine context", () => {
    expect(cup330).toBeDefined();

    const machine = findCompatibleMachine(cup330!);
    const order = createDemoProductionOrder({
      customerName: "Demo Hospitality Client",
      product: cup330!,
      quantity: 12000,
      quoteId: "quote_demo_live"
    });
    const jobCard = createDemoJobCard({ order, product: cup330! });

    expect(order.id).toBe("po_demo_quote_demo_live");
    expect(order.machineId).toBe(machine.id);
    expect(jobCard).toMatchObject({
      assignedMachine: machine.name,
      cupCapacity: "330 ml",
      customer: "Demo Hospitality Client",
      material: "Polypropylene",
      orderId: "po_demo_quote_demo_live",
      qrReadyJobUrl: "/pt-PT/jobs/po_demo_quote_demo_live"
    });
    expect(jobCard.predictedInkKg).toBeGreaterThan(0);
    expect(jobCard.stackLoadingInfo).toContain("stacks");
  });

  it("reserves matching inventory for production and preserves unrelated stock", () => {
    expect(cup330).toBeDefined();

    const updatedInventory = reserveInventoryForProduction({
      inventory: demoInventoryItems,
      product: cup330!,
      quantity: 12000
    });
    const cupStock = updatedInventory.find((item) => item.id === "inv_pp_330_clear");
    const inkStock = updatedInventory.find((item) => item.id === "inv_black_ink");

    expect(cupStock?.reservedQuantity).toBe(24000);
    expect(inkStock?.reservedQuantity).toBe(1);
  });

  it("provides n8n-ready webhook and email template demo models", () => {
    const quoteRequest = getQuoteRequestFormModel();
    const webhooks = getN8nWebhookQueue();
    const templates = getEmailTemplatesForLocale("pt-PT");
    const rendered = renderEmailTemplate({
      data: {
        companyName: quoteRequest.companyName,
        contactName: quoteRequest.contactName,
        quoteId: "quote_demo_live"
      },
      template: templates[0]
    });
    const webhook = createWebhookEvent({
      eventType: "production_started",
      payload: {
        productionOrderId: "po_demo_quote_demo_live"
      }
    });

    expect(quoteRequest.tenantId).toBe(jhGomesTenant.id);
    expect(webhooks.map((item) => item.eventType)).toEqual(
      expect.arrayContaining(["lead_created", "quote_created", "quote_approved"])
    );
    expect(rendered.subject).toContain("ForgeOS");
    expect(rendered.body).toContain("quote_demo_live");
    expect(webhook).toMatchObject({
      destination: "n8n",
      eventType: "production_started",
      status: "queued"
    });
  });

  it("answers AI Copilot prompts from seeded demo data", () => {
    expect(copilotPrompts.length).toBeGreaterThanOrEqual(4);
    expect(answerCopilotPrompt("summarize-dashboard")).toContain("JH Gomes");
    expect(answerCopilotPrompt("find-blockers")).toContain("po_240615_02");
    expect(answerCopilotPrompt("inventory-risk")).toContain("inventory");
  });

  it("seeds operational master data for article process types, machines, labels, routings, and quality", () => {
    expect(operationalProducts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "JHG-CUP-PP-330",
          processType: "internal-production",
          requiredLabelIds: expect.arrayContaining(["label_customer_box"])
        })
      ])
    );
    expect(operationalMachines.map((machine) => machine.type)).toEqual(
      expect.arrayContaining([
        "orange-repacking-labelling",
        "flowpack",
        "cup-printer"
      ])
    );
    expect(productionRoutings[0].steps.map((step) => step.operation)).toEqual(
      ["quality-check", "internal-production", "packing"]
    );
    expect(qualityTemplates.map((template) => template.type)).toContain(
      "setup-approval"
    );
  });

  it("calculates configurable personalized cup quotations from seeded rules", () => {
    const quote = calculateConfigurableCupQuote({
      input: {
        printColorCount: 2,
        quantity: 12000
      },
      rule: personalizedCupQuotationRules[0]
    });

    expect(quote.selectedTier.minimumQuantity).toBe(10000);
    expect(quote.productCost).toBe(624);
    expect(quote.plateCost).toBe(56);
    expect(quote.subtotal).toBeGreaterThan(900);
    expect(quote.total).toBeGreaterThan(quote.subtotal);
    expect(quote.validUntilDays).toBe(15);
  });

  it("records manual quotation overrides in the audit log", () => {
    const quote = calculateConfigurableCupQuote({
      input: {
        manualUnitPriceOverride: 0.05,
        overrideReason: "Approved management discount for demo order.",
        printColorCount: 2,
        quantity: 12000
      },
      rule: personalizedCupQuotationRules[0]
    });

    expect(quote.productCost).toBe(600);
    expect(quote.auditLog[0]).toContain("Manual unit price override");
  });

  it("applies barcode-oriented stock movements and protects available quantity", () => {
    const reserved = applyStockMovement({
      item: stockItems[0],
      movement: {
        movementType: "reservation",
        notes: "Reserve cups for production",
        quantity: 1000
      }
    });

    expect(reserved.reservedQuantity).toBe(stockItems[0].reservedQuantity + 1000);
    expect(() =>
      applyStockMovement({
        item: stockItems[0],
        movement: {
          movementType: "reservation",
          notes: "Over-reserve",
          quantity: 999999
        }
      })
    ).toThrow("Cannot reserve more stock");
  });

  it("calculates production efficiency metrics", () => {
    const metrics = calculateProductionMetrics({
      input: {
        downtimeMinutes: 20,
        plannedQuantity: 12000,
        producedQuantity: 11000,
        productionMinutes: 300,
        rejectedQuantity: 180,
        scrapQuantity: 120,
        setupMinutes: 45
      },
      standardSpeedPerHour: 2500
    });

    expect(metrics.completionRate).toBeCloseTo(0.9167);
    expect(metrics.scrapRate).toBe(0.01);
    expect(metrics.unitsPerHour).toBe(2200);
    expect(metrics.estimatedVsActualPerformance).toBe(0.88);
  });

  it("validates import template required fields", () => {
    const result = validateImportRows({
      rows: [
        {
          code: "JHG-DEMO",
          designation: "Demo item",
          minimum_stock: "10",
          process_type: "direct-sale"
        },
        {
          code: "",
          designation: "Missing code",
          minimum_stock: "5",
          process_type: "direct-sale"
        }
      ],
      template: importTemplates[0]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      {
        field: "code",
        message: "code is required.",
        rowIndex: 1
      }
    ]);
  });
});
