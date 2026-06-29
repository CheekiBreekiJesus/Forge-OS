import { demoMachines, demoProducts } from "./seed";
import type {
  DemoInventoryItem,
  DemoMachine,
  DemoProduct,
  DemoProductionOrder
} from "./types";

export type QuoteBreakdown = {
  productCost: number;
  setupCost: number;
  screenCost: number;
  inkCost: number;
  personalizationCost: number;
  subtotal: number;
  vat: number;
  total: number;
};

export type DemoJobCard = {
  orderId: string;
  customer: string;
  product: string;
  quantity: number;
  cupCapacity: string;
  material: string;
  artworkStatus: string;
  screenStatus: string;
  predictedInkKg: number;
  stackLoadingInfo: string;
  loadingBayCapacity: number;
  assignedMachine: string;
  operatorNotes: string;
  logoPreviewLabel: string;
  packageLabelPlaceholder: string;
  qrReadyJobUrl: string;
};

const vatRate = 0.23;
const inkCostPerColor = 12;
const personalizationCostPerUnitColor = 0.006;

export function calculatePersonalizedCupQuote({
  printColorCount,
  product,
  quantity
}: {
  printColorCount: number;
  product: DemoProduct;
  quantity: number;
}): QuoteBreakdown {
  const productCost = product.basePrice * quantity;
  const setupCost = product.setupCost;
  const screenCost = product.screenCost * printColorCount;
  const inkCost = inkCostPerColor * printColorCount;
  const personalizationCost = product.personalizationAvailable
    ? quantity * printColorCount * personalizationCostPerUnitColor
    : 0;
  const subtotal =
    productCost + setupCost + screenCost + inkCost + personalizationCost;
  const vat = subtotal * vatRate;

  return {
    productCost,
    setupCost,
    screenCost,
    inkCost,
    personalizationCost,
    subtotal,
    vat,
    total: subtotal + vat
  };
}

export function findCompatibleMachine(product: DemoProduct): DemoMachine {
  return (
    demoMachines.find((machine) =>
      machine.compatibleProductCategories.includes(product.category)
    ) ?? demoMachines[0]
  );
}

export function createDemoProductionOrder({
  customerName,
  product,
  quantity,
  quoteId
}: {
  customerName: string;
  product: DemoProduct;
  quantity: number;
  quoteId: string;
}): DemoProductionOrder {
  const machine = findCompatibleMachine(product);

  return {
    id: `po_demo_${quoteId}`,
    tenantId: product.tenantId,
    quoteId,
    productId: product.id,
    customerName,
    quantity,
    status: "scheduled",
    scheduledDate: "2026-06-15",
    artworkStatus: "approved",
    screenStatus: "ready",
    machineId: machine.id,
    progress: 0,
    operatorNotes: "Demo order generated from approved personalized quote."
  };
}

export function createDemoJobCard({
  locale = "pt-PT",
  order,
  product
}: {
  locale?: "pt-PT" | "en";
  order: DemoProductionOrder;
  product: DemoProduct;
}): DemoJobCard {
  const machine = findCompatibleMachine(product);
  const stacksNeeded = Math.ceil(order.quantity / product.unitsPerStack);
  const boxesNeeded = Math.ceil(order.quantity / product.unitsPerBox);

  return {
    orderId: order.id,
    customer: order.customerName,
    product: product.name,
    quantity: order.quantity,
    cupCapacity: product.capacity,
    material: product.material,
    artworkStatus: order.artworkStatus,
    screenStatus: order.screenStatus,
    predictedInkKg: Number((order.quantity * 0.00018).toFixed(2)),
    stackLoadingInfo: `${stacksNeeded} stacks / ${boxesNeeded} boxes`,
    loadingBayCapacity: machine.loadingBayCapacity,
    assignedMachine: machine.name,
    operatorNotes: order.operatorNotes,
    logoPreviewLabel: "Demo logo preview",
    packageLabelPlaceholder: "Label/sticker placeholder",
    qrReadyJobUrl: `/${locale}/jobs/${order.id}`
  };
}

export function reserveInventoryForProduction({
  inventory,
  product,
  quantity
}: {
  inventory: DemoInventoryItem[];
  product: DemoProduct;
  quantity: number;
}): DemoInventoryItem[] {
  const normalizedCapacity = product.capacity.toLowerCase().replace(" ", "-");

  return inventory.map((item) => {
    const isMatchingCup =
      product.category === "personalized-cups" &&
      item.sku.toLowerCase().includes(normalizedCapacity.replace("ml", ""));
    const isMatchingBag =
      product.category === "bags" && item.sku.toLowerCase().includes("bag");

    if (!isMatchingCup && !isMatchingBag) {
      return item;
    }

    return {
      ...item,
      reservedQuantity: item.reservedQuantity + quantity
    };
  });
}

export function getDemoProductById(productId: string) {
  return demoProducts.find((product) => product.id === productId) ?? demoProducts[0];
}
