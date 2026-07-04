import { describe, expect, it } from "vitest";
import {
  createPreviewUrlFromAssetBlob,
  processArtworkUpload,
  validateLocalAssetForCustomizer
} from "./artwork-pipeline";
import { lookupStoredCustomerLogo, registerCustomerLogoAssetId } from "./customer-logos";
import {
  DeterministicMockLogoGenerationProvider,
  UnconfiguredLogoGenerationProvider,
  UnconfiguredLogoSearchProvider
} from "./logo-providers";
import { buildPhotorealisticMockupBlob, resolveMockupGenerationStatus } from "./mockup-generation";
import { defaultConfiguration } from "./configuration";
import type { Product } from "@/domain/product-types";

function sampleCup(): Product {
  return {
    active: true,
    archiveReason: null,
    archivedAt: null,
    archivedBy: null,
    basePrice: 0.052,
    capacity: "330 ml",
    category: "personalized-cups",
    color: "White",
    compatibleLidsAccessories: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    customizerUrl: "",
    defaultCtaLabel: "",
    emailDescription: "",
    emailTitle: "",
    id: "prod_pp_cup_330",
    image: "/demo/products/pp-cup-330.svg",
    imageUrl: "/demo/products/pp-cup-330.svg",
    isEmailPromotable: false,
    leadTimeDays: 7,
    material: "Polypropylene",
    name: "Personalized PP Cup 330 ml",
    personalizationAvailable: true,
    printArea: "wrap",
    productPageUrl: "",
    screenCost: 28,
    setupCost: 35,
    sku: "JHG-CUP-PP-330",
    sourceUrl: null,
    stacksPerBox: 20,
    tenantId: "tenant",
    thumbnailUrl: "/demo/products/pp-cup-330.svg",
    unitsPerBox: 1000,
    unitsPerStack: 50,
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
}

const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function fileFromDataUrl(dataUrl: string, name: string, type: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], name, { type });
}

describe("artwork pipeline", () => {
  it("accepts valid PNG upload", async () => {
    const file = await fileFromDataUrl(PNG_1X1, "logo.png", "image/png");
    const result = await processArtworkUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.metadata.mimeType).toBe("image/png");
      expect(result.previewUrl).toBeTruthy();
    }
  });

  it("rejects oversized files", () => {
    const result = validateLocalAssetForCustomizer({
      name: "big.png",
      size: 3 * 1024 * 1024,
      type: "image/png"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects unsafe SVG", async () => {
    const file = new File(['<svg><script>alert(1)</script></svg>'], "bad.svg", {
      type: "image/svg+xml"
    });
    const result = await processArtworkUpload(file);
    expect(result.ok).toBe(false);
  });

  it("creates preview URL from asset blob", async () => {
    const blob = await (await fetch(PNG_1X1)).blob();
    const url = await createPreviewUrlFromAssetBlob(blob, "image/png");
    expect(url.startsWith("blob:") || url.startsWith("data:")).toBe(true);
  });
});

describe("customer logos", () => {
  it("returns not found when registry empty", async () => {
    const result = await lookupStoredCustomerLogo({
      customer: null,
      customerId: "cust_1",
      lead: null,
      leadId: null,
      localAssets: {
        create: async () => {
          throw new Error("unused");
        },
        delete: async () => {},
        getById: async () => null,
        list: async () => []
      },
      metaGet: async () => null,
      tenantId: "tenant"
    });
    expect(result.status).toBe("not_found");
  });

  it("finds registered customer logo", async () => {
    const meta = new Map<string, string>();
    await registerCustomerLogoAssetId(
      { set: async (key, value) => void meta.set(key, value) },
      "cust_1",
      "asset_logo_1"
    );
    const result = await lookupStoredCustomerLogo({
      customer: null,
      customerId: "cust_1",
      lead: null,
      leadId: null,
      localAssets: {
        create: async () => {
          throw new Error("unused");
        },
        delete: async () => {},
        getById: async () => ({
          assetType: "logo",
          blob: new Blob(),
          createdAt: "2026-01-01T00:00:00.000Z",
          fileName: "customer-logo.png",
          id: "asset_logo_1",
          mimeType: "image/png",
          size: 10,
          tenantId: "tenant"
        }),
        list: async () => []
      },
      metaGet: async (key) => meta.get(key) ?? null,
      tenantId: "tenant"
    });
    expect(result.status).toBe("found");
  });
});

describe("logo provider boundaries", () => {
  it("does not auto-run web search provider when unconfigured", async () => {
    const provider = new UnconfiguredLogoSearchProvider();
    const result = await provider.search({ customerId: "cust_1" });
    expect(result.ok).toBe(false);
  });

  it("does not auto-run generation provider when unconfigured", async () => {
    const provider = new UnconfiguredLogoGenerationProvider();
    const result = await provider.generate({ brief: "Acme" });
    expect(result.ok).toBe(false);
  });

  it("uses deterministic mock generation in tests", async () => {
    const provider = new DeterministicMockLogoGenerationProvider();
    const result = await provider.generate({ brief: "Test" });
    expect(result.ok).toBe(true);
  });
});

describe("mockup rendering", () => {
  it("builds visible SVG mockup blob with artwork href", () => {
    const blob = buildPhotorealisticMockupBlob(
      sampleCup(),
      defaultConfiguration(sampleCup()),
      1000,
      {
        assumptions: [],
        isEstimate: true,
        manualUnitPriceOverride: null,
        overrideReason: null,
        ruleId: "rule",
        setupCost: 50,
        subtotal: 500,
        total: 615,
        unitPrice: 0.45,
        vat: 115
      },
      PNG_1X1
    );
    expect(blob.type).toBe("image/svg+xml");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("marks stale mockup when fingerprint changes", () => {
    const status = resolveMockupGenerationStatus(
      {
        configurationFingerprint: "old",
        generatedAt: "2026-01-01T00:00:00.000Z",
        promptVersion: "v1",
        provider: "deterministic",
        realisticMockupAssetId: "asset_1",
        status: "complete"
      },
      "new"
    );
    expect(status).toBe("stale");
  });
});
