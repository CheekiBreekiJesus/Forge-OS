/** Canonical cup customizer options — single source of truth for UI and asset resolution. */

export type CupTypeId = "reusable_pp" | "paper";

export type CupMaterialId = "polypropylene" | "paper";

export type PrintAreaId = "deg_180" | "deg_360";

export type CupSizeMl = 250 | 330 | 430 | 500;

export type CupCatalogEntry = {
  cupType: CupTypeId;
  material: CupMaterialId;
  sizeMl: CupSizeMl;
  label: string;
  slug: string;
};

/** Reusable PP sizes required for JH Gomes customizer (430 ml included per product spec). */
export const REUSABLE_PP_SIZES_ML: readonly CupSizeMl[] = [250, 330, 430, 500] as const;

/**
 * Verified paper-cup sizes from product catalog (`src/demo/seed.ts`, `supabase/seed.sql`).
 * Only 250 ml is present in the current catalog; structure supports more when confirmed.
 */
export const PAPER_CUP_SIZES_ML: readonly CupSizeMl[] = [250] as const;

export const CUP_TYPE_OPTIONS: ReadonlyArray<{
  id: CupTypeId;
  material: CupMaterialId;
}> = [
  { id: "reusable_pp", material: "polypropylene" },
  { id: "paper", material: "paper" }
] as const;

export function cupSizeToSlug(sizeMl: number): string {
  return `${sizeMl}ml`;
}

export function cupSizeFromLabel(label: string): CupSizeMl | null {
  const match = label.trim().match(/^(\d+)\s*ml$/i);
  if (!match) return null;
  const value = Number(match[1]);
  return isValidCupSize(value) ? value : null;
}

export function isValidCupSize(value: number): value is CupSizeMl {
  return REUSABLE_PP_SIZES_ML.includes(value as CupSizeMl) || PAPER_CUP_SIZES_ML.includes(value as CupSizeMl);
}

export function sizesForCupType(cupType: CupTypeId): readonly CupSizeMl[] {
  switch (cupType) {
    case "reusable_pp":
      return REUSABLE_PP_SIZES_ML;
    case "paper":
      return PAPER_CUP_SIZES_ML;
    default: {
      const _exhaustive: never = cupType;
      return _exhaustive;
    }
  }
}

export function materialForCupType(cupType: CupTypeId): CupMaterialId {
  switch (cupType) {
    case "reusable_pp":
      return "polypropylene";
    case "paper":
      return "paper";
    default: {
      const _exhaustive: never = cupType;
      return _exhaustive;
    }
  }
}

export function defaultSizeForCupType(cupType: CupTypeId): CupSizeMl {
  const sizes = sizesForCupType(cupType);
  return sizes.includes(330) ? 330 : sizes[0];
}

/** Map legacy product categories to customizer cup types. */
export function cupTypeFromProductCategory(category: string): CupTypeId {
  if (category === "paper-cups") return "paper";
  return "reusable_pp";
}

export function normalizeCupType(value: string | null | undefined): CupTypeId {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized === "paper" ||
    normalized === "paper-cups" ||
    normalized === "paper_cup" ||
    normalized === "paperboard"
  ) {
    return "paper";
  }
  return "reusable_pp";
}

export function normalizeCupSize(value: string | number | null | undefined, cupType: CupTypeId): CupSizeMl {
  if (typeof value === "number" && isValidCupSize(value)) {
    return clampSizeToCupType(value, cupType);
  }
  const fromLabel = cupSizeFromLabel(String(value ?? ""));
  if (fromLabel) {
    return clampSizeToCupType(fromLabel, cupType);
  }
  return defaultSizeForCupType(cupType);
}

function clampSizeToCupType(sizeMl: CupSizeMl, cupType: CupTypeId): CupSizeMl {
  const allowed = sizesForCupType(cupType);
  if (allowed.includes(sizeMl)) return sizeMl;
  return defaultSizeForCupType(cupType);
}

export function formatCupSizeLabel(sizeMl: CupSizeMl, locale: string): string {
  const formatted = new Intl.NumberFormat(locale).format(sizeMl);
  return `${formatted} ml`;
}
