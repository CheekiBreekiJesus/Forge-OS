import type { LocalAssetRepository } from "@/persistence/interfaces";
import type { Customer, Lead } from "@/domain/types";

export type CustomerLogoLookupResult =
  | {
      status: "found";
      assetId: string;
      fileName: string;
      mimeType: string;
      updatedAt: string;
      source: "customer-registry" | "lead-registry";
    }
  | { status: "not_found" }
  | { status: "failed"; message: string };

const REGISTRY_PREFIX = "cup-customizer:logo:";

function customerRegistryKey(customerId: string): string {
  return `${REGISTRY_PREFIX}customer:${customerId}`;
}

function leadRegistryKey(leadId: string): string {
  return `${REGISTRY_PREFIX}lead:${leadId}`;
}

export async function getRegistryLogoAssetId(
  metaRepo: { get: (key: string) => Promise<string | null> },
  customerId: string | null,
  leadId: string | null
): Promise<{ assetId: string; source: "customer-registry" | "lead-registry" } | null> {
  if (customerId) {
    const assetId = await metaRepo.get(customerRegistryKey(customerId));
    if (assetId) return { assetId, source: "customer-registry" };
  }
  if (leadId) {
    const assetId = await metaRepo.get(leadRegistryKey(leadId));
    if (assetId) return { assetId, source: "lead-registry" };
  }
  return null;
}

export async function registerCustomerLogoAssetId(
  metaRepo: { set: (key: string, value: string) => Promise<void> },
  customerId: string,
  assetId: string
): Promise<void> {
  await metaRepo.set(customerRegistryKey(customerId), assetId);
}

export async function lookupStoredCustomerLogo(input: {
  tenantId: string;
  customerId: string | null;
  leadId: string | null;
  customer: Customer | null;
  lead: Lead | null;
  localAssets: LocalAssetRepository;
  metaGet: (key: string) => Promise<string | null>;
}): Promise<CustomerLogoLookupResult> {
  try {
    const registry = await getRegistryLogoAssetId(
      { get: input.metaGet },
      input.customerId,
      input.leadId
    );
    if (!registry) {
      return { status: "not_found" };
    }
    const asset = await input.localAssets.getById(input.tenantId, registry.assetId);
    if (!asset || asset.assetType !== "logo") {
      return { status: "not_found" };
    }
    return {
      assetId: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      source: registry.source,
      status: "found",
      updatedAt: asset.createdAt
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "lookup_failed",
      status: "failed"
    };
  }
}
