import type { CustomizerConfiguration } from "@/domain/customizer-types";

export const CUSTOMIZER_WORKFLOW_STEPS = [
  "product",
  "printing",
  "artwork",
  "preview",
  "quotation"
] as const;

export type CustomizerWorkflowStep = (typeof CUSTOMIZER_WORKFLOW_STEPS)[number];

export function getNextStep(step: CustomizerWorkflowStep): CustomizerWorkflowStep | null {
  const index = CUSTOMIZER_WORKFLOW_STEPS.indexOf(step);
  if (index < 0 || index >= CUSTOMIZER_WORKFLOW_STEPS.length - 1) return null;
  return CUSTOMIZER_WORKFLOW_STEPS[index + 1] ?? null;
}

export function getPreviousStep(step: CustomizerWorkflowStep): CustomizerWorkflowStep | null {
  const index = CUSTOMIZER_WORKFLOW_STEPS.indexOf(step);
  if (index <= 0) return null;
  return CUSTOMIZER_WORKFLOW_STEPS[index - 1] ?? null;
}

export function isStepComplete(
  step: CustomizerWorkflowStep,
  context: {
    hasProduct: boolean;
    hasValidPrinting: boolean;
    hasArtwork: boolean;
    hasPreview: boolean;
    hasPricing: boolean;
  }
): boolean {
  switch (step) {
    case "product":
      return context.hasProduct;
    case "printing":
      return context.hasProduct && context.hasValidPrinting;
    case "artwork":
      return context.hasArtwork;
    case "preview":
      return context.hasPreview;
    case "quotation":
      return context.hasPricing;
    default: {
      const neverStep: never = step;
      return neverStep;
    }
  }
}

export function validatePrintConfiguration(configuration: CustomizerConfiguration): {
  ok: boolean;
  errorKey?: "tooManyColors" | "unsupportedPrintArea";
} {
  if (configuration.printColorCount > 2) {
    return { errorKey: "tooManyColors", ok: false };
  }
  if (!["wrap", "front", "back"].includes(configuration.printArea)) {
    return { errorKey: "unsupportedPrintArea", ok: false };
  }
  return { ok: true };
}

export function buildConfigurationFingerprint(
  productId: string,
  configuration: CustomizerConfiguration,
  quantity: number,
  artworkAssetId: string | null
): string {
  return JSON.stringify({
    artworkAssetId,
    configuration,
    productId,
    quantity
  });
}
