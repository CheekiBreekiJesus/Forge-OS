import {
  cupSizeToSlug,
  normalizeCupSize,
  normalizeCupType,
  type CupSizeMl,
  type CupTypeId
} from "./cup-catalog";

export const CUP_BACKGROUND_BASE_PATH = "/assets/cup-customizer/backgrounds";

const BACKGROUND_VARIANT = "default";
const SUPPORTED_EXTENSIONS = ["svg", "png", "webp", "jpg", "jpeg"] as const;

export type CupBackgroundResolveInput = {
  cupType: string;
  cupSize: string;
  variant?: string;
};

export type CupBackgroundResolveResult = {
  cupType: CupTypeId;
  sizeMl: CupSizeMl;
  variant: string;
  /** Public URL paths only — never filesystem paths. */
  candidateUrls: string[];
  fallbackUrl: string;
};

export function sanitizeAssetSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function cupTypeFolderName(cupType: CupTypeId): string {
  switch (cupType) {
    case "reusable_pp":
      return "reusable-pp";
    case "paper":
      return "paper";
    default: {
      const _exhaustive: never = cupType;
      return _exhaustive;
    }
  }
}

export function buildCupBackgroundCandidateUrls(
  cupType: CupTypeId,
  sizeMl: CupSizeMl,
  variant = BACKGROUND_VARIANT
): string[] {
  const safeVariant = sanitizeAssetSegment(variant) || BACKGROUND_VARIANT;
  const folder = `${CUP_BACKGROUND_BASE_PATH}/${cupTypeFolderName(cupType)}/${cupSizeToSlug(sizeMl)}`;
  return SUPPORTED_EXTENSIONS.map((ext) => `${folder}/${safeVariant}.${ext}`);
}

export function resolveCupBackgroundAssets(input: CupBackgroundResolveInput): CupBackgroundResolveResult {
  const cupType = normalizeCupType(input.cupType);
  const sizeMl = normalizeCupSize(input.cupSize, cupType);
  const variant = sanitizeAssetSegment(input.variant ?? BACKGROUND_VARIANT) || BACKGROUND_VARIANT;
  return {
    cupType,
    sizeMl,
    variant,
    candidateUrls: buildCupBackgroundCandidateUrls(cupType, sizeMl, variant),
    fallbackUrl: `${CUP_BACKGROUND_BASE_PATH}/fallback/default.svg`
  };
}

export function warnMissingBackgroundAsset(
  resolved: CupBackgroundResolveResult,
  loadedUrl: string | null,
  isDevelopment: boolean
): void {
  if (!isDevelopment || loadedUrl) return;
  console.warn(
    `[cup-customizer] Missing background for ${resolved.cupType}/${resolved.sizeMl}. ` +
      `Tried: ${resolved.candidateUrls.join(", ")}. Using fallback.`
  );
}
