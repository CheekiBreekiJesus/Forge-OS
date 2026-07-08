export {
  createForgeOSCustomizerBridge,
  CupPreview,
  estimateCupPricing,
  resolveQuotationRuleForProduct
} from "./adapters/forgeos";
export type {
  CupConfiguration,
  CupCustomizerAdapterInput,
  CupCustomizerAdapterOutput,
  CupPricingEstimate
} from "./domain/types";
export {
  CUP_TYPE_OPTIONS,
  defaultSizeForCupType,
  formatCupSizeLabel,
  cupTypeFromProductCategory,
  materialForCupType,
  normalizeCupSize,
  normalizeCupType,
  PAPER_CUP_SIZES_ML,
  REUSABLE_PP_SIZES_ML,
  sizesForCupType,
  type CupMaterialId,
  type CupSizeMl,
  type CupTypeId,
  type PrintAreaId
} from "./config/cup-catalog";
export {
  normalizePrintArea,
  PRINT_AREA_OPTIONS,
  printAreaLabelKey,
  printableWidthFraction
} from "./config/print-area";
export {
  buildCupBackgroundCandidateUrls,
  CUP_BACKGROUND_BASE_PATH,
  resolveCupBackgroundAssets,
  type CupBackgroundResolveResult
} from "./config/background-assets";
export {
  CUP_CUSTOMIZER_SHOW_PAPER_CUPS,
  CUP_PLACEMENT_BY_SIZE,
  DEFAULT_PREVIEW_BACKGROUND,
  isHiddenPaperCupSelection,
  normalizeCustomizerCupTypeForUi,
  normalizePreviewBackground,
  previewBackgrounds,
  reusablePPCups,
  resolvePreviewSceneAssetPath,
  resolveReusablePPCupAssetPath,
  visibleCupTypesInCustomizer,
  type CupPlacementConfig,
  type CupSizeSlug,
  type PreviewBackground
} from "./config/visual-assets";
export { buildPreviewExportBlob, buildPreviewExportSvg, loadImageAsDataUrl } from "./rendering/preview-export";
export { estimateInkCoverage } from "./rendering/ink-coverage";
