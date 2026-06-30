import type { Archivable } from "@/domain/operations-types";

export type CustomizerSimulationStatus = "draft" | "saved" | "converted" | "archived";

export type CustomizerConfiguration = {
  material: string;
  cupSize: string;
  cupType: string;
  printColorCount: number;
  printArea: string;
  artworkPosition: string;
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
