import type { Archivable } from "@/domain/operations-types";

export type CustomizerSimulationStatus = "draft" | "saved" | "converted" | "archived";

export type CustomizerWorkflowStatus =
  | "DRAFT"
  | "ARTWORK_REVIEW"
  | "PRICING_REQUIRED"
  | "READY_FOR_QUOTATION"
  | "QUOTED"
  | "APPROVED"
  | "ARCHIVED";

export type MockupGenerationMeta = {
  status: "none" | "generating" | "complete" | "stale" | "failed";
  provider: "deterministic" | "abacus" | null;
  configurationFingerprint: string;
  generatedAt: string | null;
  realisticMockupAssetId: string | null;
  promptVersion: string | null;
};

export type CustomizerConfiguration = {
  material: string;
  cupSize: string;
  cupType: string;
  printColorCount: number;
  printArea: string;
  artworkPosition: string;
  artworkScale: number;
  artworkOffsetX: number;
  artworkOffsetY: number;
  artworkRotation: number;
  desiredDeliveryDate: string | null;
};

export type CustomizerPricingSnapshot = {
  unitPrice: number;
  setupCost: number;
  subtotal: number;
  vat: number;
  total: number;
  assumptions: string[];
  isEstimate: boolean;
  manualUnitPriceOverride: number | null;
  overrideReason: string | null;
  ruleId: string | null;
};

export type CustomizerSimulation = Archivable & {
  id: string;
  tenantId: string;
  customerId: string | null;
  leadId: string | null;
  productId: string;
  productName: string;
  configuration: CustomizerConfiguration;
  quantity: number;
  artworkAssetId: string | null;
  mockupAssetId: string | null;
  mockupGeneration?: MockupGenerationMeta | null;
  workflowStatus?: CustomizerWorkflowStatus | null;
  pricing: CustomizerPricingSnapshot;
  quoteId: string | null;
  notes: string;
  status: CustomizerSimulationStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomizerSimulationInput = {
  customerId?: string | null;
  leadId?: string | null;
  productId: string;
  productName: string;
  configuration: CustomizerConfiguration;
  quantity: number;
  artworkAssetId?: string | null;
  mockupAssetId?: string | null;
  mockupGeneration?: MockupGenerationMeta | null;
  workflowStatus?: CustomizerWorkflowStatus | null;
  pricing: CustomizerPricingSnapshot;
  notes?: string;
  status?: CustomizerSimulationStatus;
  createdBy?: string;
};

export type UpdateCustomizerSimulationInput = Partial<
  Omit<CustomizerSimulation, "id" | "tenantId" | "createdAt" | "updatedAt">
>;

export type LocalNotificationSeverity = "info" | "warning" | "action";

export type LocalNotification = {
  id: string;
  tenantId: string;
  kind: string;
  title: string;
  message: string;
  href: string;
  entityType: string;
  entityId: string;
  severity: LocalNotificationSeverity;
  read: boolean;
  createdAt: string;
};
