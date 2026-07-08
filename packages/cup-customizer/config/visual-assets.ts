import {
  cupSizeToSlug,
  normalizeCupSize,
  normalizeCupType,
  type CupSizeMl,
  type CupTypeId
} from "./cup-catalog";

/** Re-enable paper cups in the customizer UI by setting this to `true`. */
export const CUP_CUSTOMIZER_SHOW_PAPER_CUPS = false;

export type CupSizeSlug = "250ml" | "330ml" | "430ml" | "500ml";
export type PreviewBackground = "day" | "night";

export const CUP_ASSET_BASE_PATH = "/assets/cup-customizer/cups/reusable-pp";
export const SCENE_BACKGROUND_BASE_PATH = "/assets/cup-customizer/backgrounds";

export const reusablePPCups: Readonly<
  Record<
    CupSizeSlug,
    {
      label: string;
      assetPath: string;
    }
  >
> = {
  "250ml": {
    label: "250 ml",
    assetPath: `${CUP_ASSET_BASE_PATH}/250ml.png`
  },
  "330ml": {
    label: "330 ml",
    assetPath: `${CUP_ASSET_BASE_PATH}/330ml.png`
  },
  "430ml": {
    label: "430 ml",
    assetPath: `${CUP_ASSET_BASE_PATH}/430ml.png`
  },
  "500ml": {
    label: "500 ml",
    assetPath: `${CUP_ASSET_BASE_PATH}/500ml.png`
  }
} as const;

export const previewBackgrounds: Readonly<
  Record<
    PreviewBackground,
    {
      assetPath: string;
    }
  >
> = {
  day: {
    assetPath: `${SCENE_BACKGROUND_BASE_PATH}/day.png`
  },
  night: {
    assetPath: `${SCENE_BACKGROUND_BASE_PATH}/night.png`
  }
} as const;

export const DEFAULT_PREVIEW_BACKGROUND: PreviewBackground = "day";

export const CUP_IMAGE_FALLBACK_URL = "/assets/cup-customizer/backgrounds/fallback/default.svg";
export const SCENE_IMAGE_FALLBACK_URL = "/assets/cup-customizer/backgrounds/fallback/default.svg";

export type CupTransform = {
  /** Cup width as a percentage of the square preview frame. */
  widthPercent: number;
  /** Distance from the bottom edge of the preview frame. */
  bottomPercent: number;
  /** Horizontal nudge from centre. */
  translateXPercent: number;
};

export type ArtworkRegion = {
  topPercent: number;
  heightPercent: number;
  centerXPercent: number;
  /** Multiplier applied to the printable band width for this cup size. */
  bandWidthPercent: number;
};

export type CupPlacementConfig = {
  cupTransform: CupTransform;
  artworkRegion: ArtworkRegion;
};

/**
 * Per-size visual offsets for seating reusable PP cups on the day/night table surface.
 * Baseline asset scale is preserved; only layout nudges are applied in CSS.
 */
export const CUP_PLACEMENT_BY_SIZE: Readonly<Record<CupSizeMl, CupPlacementConfig>> = {
  250: {
    cupTransform: { widthPercent: 56, bottomPercent: 11, translateXPercent: 0 },
    artworkRegion: { topPercent: 27, heightPercent: 28, centerXPercent: 50, bandWidthPercent: 1 }
  },
  330: {
    cupTransform: { widthPercent: 60, bottomPercent: 10, translateXPercent: 0 },
    artworkRegion: { topPercent: 26, heightPercent: 29, centerXPercent: 50, bandWidthPercent: 1 }
  },
  430: {
    cupTransform: { widthPercent: 64, bottomPercent: 9, translateXPercent: 0 },
    artworkRegion: { topPercent: 25, heightPercent: 30, centerXPercent: 50, bandWidthPercent: 1 }
  },
  500: {
    cupTransform: { widthPercent: 68, bottomPercent: 8, translateXPercent: 0 },
    artworkRegion: { topPercent: 24, heightPercent: 31, centerXPercent: 50, bandWidthPercent: 1 }
  }
};

export function cupSizeToSlugKey(sizeMl: CupSizeMl): CupSizeSlug {
  return cupSizeToSlug(sizeMl) as CupSizeSlug;
}

export function normalizePreviewBackground(value: string | null | undefined): PreviewBackground {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "night" || normalized === "noite") {
    return "night";
  }
  return "day";
}

export function resolveReusablePPCupAssetPath(sizeMl: CupSizeMl | number | string): string {
  const normalized = normalizeCupSize(sizeMl, "reusable_pp");
  return reusablePPCups[cupSizeToSlugKey(normalized)].assetPath;
}

export function resolvePreviewSceneAssetPath(scene: PreviewBackground | string | null | undefined): string {
  const normalized = normalizePreviewBackground(scene);
  return previewBackgrounds[normalized].assetPath;
}

export function visibleCupTypesInCustomizer(): readonly CupTypeId[] {
  return CUP_CUSTOMIZER_SHOW_PAPER_CUPS ? (["reusable_pp", "paper"] as const) : (["reusable_pp"] as const);
}

export function normalizeCustomizerCupTypeForUi(cupType: string | null | undefined): CupTypeId {
  const normalized = normalizeCupType(cupType);
  if (!CUP_CUSTOMIZER_SHOW_PAPER_CUPS && normalized === "paper") {
    return "reusable_pp";
  }
  return normalized;
}

export function isHiddenPaperCupSelection(cupType: string | null | undefined): boolean {
  return !CUP_CUSTOMIZER_SHOW_PAPER_CUPS && normalizeCupType(cupType) === "paper";
}

export function warnMissingCupCustomizerAsset(
  label: string,
  expectedPath: string,
  isDevelopment: boolean
): void {
  if (!isDevelopment) return;
  console.warn(`[cup-customizer] Missing ${label} asset at ${expectedPath}. Using fallback.`);
}
