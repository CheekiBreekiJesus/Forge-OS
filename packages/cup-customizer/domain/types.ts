/** Cup customizer domain types — shared between ForgeOS and future JH Gomes website. */
export type CupConfiguration = {
  material: string;
  cupSize: string;
  cupType: string;
  quantity: number;
  printColorCount: number;
  printArea: string;
  artworkPosition: string;
  artworkScale: number;
  artworkOffsetX: number;
  artworkOffsetY: number;
  artworkRotation: number;
  desiredDeliveryDate: string | null;
  notes: string;
};

export type CupPricingEstimate = {
  unitPrice: number;
  setupCost: number;
  subtotal: number;
  vat: number;
  total: number;
  assumptions: string[];
  isEstimate: boolean;
  auditLog: string[];
  validUntilDays: number;
};

export type CupCustomizerAdapterInput = {
  productId: string;
  productSku: string;
  productName: string;
  configuration: CupConfiguration;
  manualUnitPriceOverride?: number;
  overrideReason?: string;
};

export type CupCustomizerAdapterOutput = {
  pricing: CupPricingEstimate;
  ruleId: string | null;
};
