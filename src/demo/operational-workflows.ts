import type {
  ImportTemplate,
  OperationalQuoteBreakdown,
  ProductionMetrics,
  ProductionResultInput,
  QuotationInput,
  QuotationRule,
  QuotationRuleTier,
  StockItem,
  StockMovementInput
} from "./operational-types";

export function selectQuotationTier({
  quantity,
  rule
}: {
  quantity: number;
  rule: QuotationRule;
}): QuotationRuleTier {
  if (quantity < rule.minimumOrderQuantity) {
    throw new Error(`Minimum order quantity is ${rule.minimumOrderQuantity}.`);
  }

  return [...rule.tiers]
    .sort((a, b) => b.minimumQuantity - a.minimumQuantity)
    .find((tier) => quantity >= tier.minimumQuantity) ?? rule.tiers[0];
}

export function calculateConfigurableCupQuote({
  input,
  rule
}: {
  input: QuotationInput;
  rule: QuotationRule;
}): OperationalQuoteBreakdown {
  const selectedTier = selectQuotationTier({ quantity: input.quantity, rule });
  const auditLog: string[] = [];
  const unitPrice = input.manualUnitPriceOverride ?? selectedTier.unitPrice;

  if (input.manualUnitPriceOverride !== undefined) {
    auditLog.push(
      `Manual unit price override: ${selectedTier.unitPrice} -> ${input.manualUnitPriceOverride}. Reason: ${input.overrideReason ?? "not provided"}`
    );
  }

  const productCost = roundMoney(unitPrice * input.quantity);
  const setupCost = selectedTier.setupCost;
  const printingCost = selectedTier.printCostPerColor * input.printColorCount;
  const plateCost = rule.plateCostPerColor * input.printColorCount;
  const artworkCost = rule.artworkCost;
  const packagingCost = rule.packagingCost;
  const transportCost = rule.transportCost;
  const baseSubtotal =
    productCost +
    setupCost +
    printingCost +
    plateCost +
    artworkCost +
    packagingCost +
    transportCost;
  const margin = roundMoney(baseSubtotal * rule.marginRate);
  const discount = roundMoney((baseSubtotal + margin) * rule.discountRate);
  const subtotal = roundMoney(baseSubtotal + margin - discount);
  const vat = roundMoney(subtotal * rule.vatRate);

  return {
    selectedTier,
    productCost,
    setupCost,
    printingCost,
    plateCost,
    artworkCost,
    packagingCost,
    transportCost,
    margin,
    discount,
    subtotal,
    vat,
    total: roundMoney(subtotal + vat),
    validUntilDays: rule.validityDays,
    auditLog
  };
}

export function applyStockMovement({
  item,
  movement
}: {
  item: StockItem;
  movement: StockMovementInput;
}): StockItem {
  if (movement.quantity <= 0) {
    throw new Error("Stock movement quantity must be greater than zero.");
  }

  if (movement.movementType === "reservation") {
    const available = item.quantityOnHand - item.reservedQuantity;

    if (movement.quantity > available) {
      throw new Error("Cannot reserve more stock than is available.");
    }

    return {
      ...item,
      reservedQuantity: item.reservedQuantity + movement.quantity
    };
  }

  if (movement.movementType === "consumption") {
    if (movement.quantity > item.quantityOnHand) {
      throw new Error("Cannot consume more stock than is on hand.");
    }

    return {
      ...item,
      quantityOnHand: item.quantityOnHand - movement.quantity,
      reservedQuantity: Math.max(0, item.reservedQuantity - movement.quantity)
    };
  }

  if (movement.movementType === "receipt" || movement.movementType === "production-output") {
    return {
      ...item,
      quantityOnHand: item.quantityOnHand + movement.quantity
    };
  }

  if (movement.movementType === "adjustment" || movement.movementType === "cycle-count" || movement.movementType === "full-count") {
    return {
      ...item,
      quantityOnHand: movement.quantity,
      reservedQuantity: Math.min(item.reservedQuantity, movement.quantity)
    };
  }

  return {
    ...item,
    location: movement.toLocation ?? item.location
  };
}

export function calculateProductionMetrics({
  input,
  standardSpeedPerHour
}: {
  input: ProductionResultInput;
  standardSpeedPerHour: number;
}): ProductionMetrics {
  const runtimeHours = input.productionMinutes > 0 ? input.productionMinutes / 60 : 0;
  const unitsPerHour =
    runtimeHours > 0 ? input.producedQuantity / runtimeHours : 0;
  const expectedUnits = runtimeHours * standardSpeedPerHour;

  return {
    completionRate: ratio(input.producedQuantity, input.plannedQuantity),
    scrapRate: ratio(input.scrapQuantity, input.plannedQuantity),
    rejectionRate: ratio(input.rejectedQuantity, input.producedQuantity),
    setupMinutes: input.setupMinutes,
    productionMinutes: input.productionMinutes,
    downtimeMinutes: input.downtimeMinutes,
    unitsPerHour: roundNumber(unitsPerHour),
    estimatedVsActualPerformance: expectedUnits > 0 ? ratio(input.producedQuantity, expectedUnits) : 0
  };
}

export function validateImportRows({
  rows,
  template
}: {
  rows: Array<Record<string, string>>;
  template: ImportTemplate;
}) {
  const errors: Array<{ rowIndex: number; field: string; message: string }> = [];

  rows.forEach((row, rowIndex) => {
    template.columns.forEach((column) => {
      if (column.required && !row[column.key]) {
        errors.push({
          field: column.key,
          message: `${column.key} is required.`,
          rowIndex
        });
      }
    });
  });

  return {
    errors,
    valid: errors.length === 0
  };
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return roundNumber(numerator / denominator);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundNumber(value: number) {
  return Math.round(value * 10000) / 10000;
}
