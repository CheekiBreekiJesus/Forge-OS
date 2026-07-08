import { personalizedCupQuotationRules } from "@/demo/operational-seed";
import {
  calculateConfigurableCupQuote,
  selectQuotationTier
} from "@/demo/operational-workflows";
import type { QuotationRule } from "@/demo/operational-types";
import type {
  CupCustomizerAdapterInput,
  CupCustomizerAdapterOutput,
  CupPricingEstimate
} from "../domain/types";

const DEFAULT_RULE = personalizedCupQuotationRules[0];

export function resolveQuotationRuleForProduct(sku: string): QuotationRule {
  if (sku.includes("CUP") || sku.includes("cup")) {
    return DEFAULT_RULE;
  }
  return DEFAULT_RULE;
}

export function estimateCupPricing(input: CupCustomizerAdapterInput): CupCustomizerAdapterOutput {
  const rule = resolveQuotationRuleForProduct(input.productSku);
  const breakdown = calculateConfigurableCupQuote({
    input: {
      manualUnitPriceOverride: input.manualUnitPriceOverride,
      overrideReason: input.overrideReason,
      printColorCount: input.configuration.printColorCount,
      quantity: input.configuration.quantity
    },
    rule
  });

  const tier = selectQuotationTier({
    quantity: input.configuration.quantity,
    rule
  });

  const assumptions = [
    `Pricing rule: ${rule.name}`,
    `Tier from ${tier.minimumQuantity} units @ €${tier.unitPrice.toFixed(4)}/unit`,
    `VAT ${(rule.vatRate * 100).toFixed(0)}%`,
    `Validity ${breakdown.validUntilDays} days`,
    "Label: Estimate — requires human approval before production."
  ];

  const pricing: CupPricingEstimate = {
    assumptions: [...assumptions, ...breakdown.auditLog],
    auditLog: breakdown.auditLog,
    isEstimate: true,
    setupCost: breakdown.setupCost,
    subtotal: breakdown.subtotal,
    total: breakdown.total,
    unitPrice: input.manualUnitPriceOverride ?? tier.unitPrice,
    validUntilDays: breakdown.validUntilDays,
    vat: breakdown.vat
  };

  return { pricing, ruleId: rule.id };
}
