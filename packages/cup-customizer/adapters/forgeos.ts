import { estimateCupPricing, resolveQuotationRuleForProduct } from "../pricing/engine";
import type { CupCustomizerAdapterInput, CupCustomizerAdapterOutput } from "../domain/types";

export type ForgeOSCustomizerBridge = {
  estimatePricing(input: CupCustomizerAdapterInput): CupCustomizerAdapterOutput;
  resolveRuleId(sku: string): string | null;
};

export function createForgeOSCustomizerBridge(): ForgeOSCustomizerBridge {
  return {
    estimatePricing(input) {
      return estimateCupPricing(input);
    },
    resolveRuleId(sku) {
      return resolveQuotationRuleForProduct(sku).id;
    }
  };
}

export { estimateCupPricing, resolveQuotationRuleForProduct };
export { CupPreview } from "../rendering/cup-preview";
export { CupDesignCanvas, type CupDesignCanvasProps, type CupDesignView } from "../rendering/cup-design-canvas";
export type {
  CupConfiguration,
  CupCustomizerAdapterInput,
  CupCustomizerAdapterOutput,
  CupPricingEstimate
} from "../domain/types";
