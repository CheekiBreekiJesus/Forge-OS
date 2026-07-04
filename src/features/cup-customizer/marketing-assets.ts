import type { LocalAssetRepository } from "@/persistence/interfaces";

export type MarketingVisualizationInput = {
  tenantId: string;
  simulationId: string | null;
  customerId: string | null;
  leadId: string | null;
  source: "deterministic-preview" | "realistic-mockup";
  blob: Blob;
  fileName: string;
  mimeType: string;
  configurationFingerprint: string;
};

export type MarketingVisualizationRecord = {
  assetId: string;
  simulationId: string | null;
  customerId: string | null;
  leadId: string | null;
  source: MarketingVisualizationInput["source"];
  createdAt: string;
};

const META_PREFIX = "cup-customizer:marketing-visualization:";

export async function saveMarketingVisualization(
  localAssets: LocalAssetRepository,
  metaSet: (key: string, value: string) => Promise<void>,
  input: MarketingVisualizationInput
): Promise<MarketingVisualizationRecord> {
  const asset = await localAssets.create(input.tenantId, {
    assetType: "product-image",
    blob: input.blob,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.blob.size
  });

  const record: MarketingVisualizationRecord = {
    assetId: asset.id,
    createdAt: new Date().toISOString(),
    customerId: input.customerId,
    leadId: input.leadId,
    simulationId: input.simulationId,
    source: input.source
  };

  const key = input.simulationId
    ? `${META_PREFIX}${input.simulationId}`
    : `${META_PREFIX}draft:${asset.id}`;
  await metaSet(key, JSON.stringify({ ...record, configurationFingerprint: input.configurationFingerprint }));

  return record;
}

export async function getMarketingVisualizationAssetId(
  metaGet: (key: string) => Promise<string | null>,
  simulationId: string
): Promise<string | null> {
  const raw = await metaGet(`${META_PREFIX}${simulationId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MarketingVisualizationRecord;
    return parsed.assetId;
  } catch {
    return null;
  }
}

/**
 * Outreach and campaign modules can resolve marketing visuals via simulationId
 * without coupling to the customizer UI. See docs/product/cup-customizer-marketing-assets.md
 */
export const MARKETING_VISUALIZATION_META_PREFIX = META_PREFIX;
