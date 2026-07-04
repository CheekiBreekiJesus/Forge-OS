import { createForgeOSCustomizerBridge, type CupCustomizerAdapterInput } from "@cup-customizer";
import type { CustomizerConfiguration, CustomizerPricingSnapshot } from "@/domain/customizer-types";
import type { Product } from "@/domain/product-types";

export function buildPricingSnapshot(
  product: Product,
  configuration: CustomizerConfiguration,
  quantity: number,
  notes: string,
  manualUnitPriceOverride: number | null,
  overrideReason: string
): CustomizerPricingSnapshot {
  const bridge = createForgeOSCustomizerBridge();
  const input: CupCustomizerAdapterInput = {
    configuration: {
      ...configuration,
      notes,
      quantity
    },
    manualUnitPriceOverride: manualUnitPriceOverride ?? undefined,
    overrideReason: overrideReason || undefined,
    productId: product.id,
    productName: product.name,
    productSku: product.sku
  };
  const { pricing, ruleId } = bridge.estimatePricing(input);
  return {
    assumptions: pricing.assumptions,
    isEstimate: pricing.isEstimate,
    manualUnitPriceOverride,
    overrideReason: overrideReason || null,
    ruleId,
    setupCost: pricing.setupCost,
    subtotal: pricing.subtotal,
    total: pricing.total,
    unitPrice: pricing.unitPrice,
    vat: pricing.vat
  };
}

export function validateQuantity(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}
