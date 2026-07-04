import type {
  CustomizerSimulation,
  CustomizerSimulationStatus,
  CustomizerWorkflowStatus
} from "@/domain/customizer-types";

export function deriveWorkflowStatus(simulation: Pick<CustomizerSimulation, "status" | "quoteId" | "artworkAssetId" | "pricing">): CustomizerWorkflowStatus {
  if (simulation.status === "archived") return "ARCHIVED";
  if (simulation.status === "converted" || simulation.quoteId) return "QUOTED";
  if (!simulation.pricing.ruleId && !simulation.pricing.manualUnitPriceOverride) {
    return "PRICING_REQUIRED";
  }
  if (simulation.artworkAssetId) return "READY_FOR_QUOTATION";
  if (simulation.status === "saved") return "READY_FOR_QUOTATION";
  return "DRAFT";
}

export function mapPersistenceStatusForSave(
  hasArtwork: boolean,
  hasPricing: boolean
): CustomizerSimulationStatus {
  if (!hasPricing) return "draft";
  if (hasArtwork) return "saved";
  return "saved";
}
