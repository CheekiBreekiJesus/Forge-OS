import type { PrintAreaId } from "./cup-catalog";

const DEG_180_ALIASES = new Set([
  "deg_180",
  "180",
  "180deg",
  "180°",
  "180º",
  "half",
  "half_wrap",
  "half-wrap",
  "front",
  "back",
  "frente",
  "verso"
]);

const DEG_360_ALIASES = new Set([
  "deg_360",
  "360",
  "360deg",
  "360°",
  "360º",
  "wrap",
  "full",
  "full_wrap",
  "full-wrap",
  "volta-completa",
  "volta_completa",
  "volta completa"
]);

export const PRINT_AREA_OPTIONS: readonly PrintAreaId[] = ["deg_180", "deg_360"] as const;

export function normalizePrintArea(value: string | null | undefined): PrintAreaId {
  const normalized = (value ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  if (DEG_360_ALIASES.has(normalized)) return "deg_360";
  if (DEG_180_ALIASES.has(normalized)) return "deg_180";
  return "deg_180";
}

export function printAreaLabelKey(printArea: PrintAreaId): "deg180" | "deg360" {
  switch (printArea) {
    case "deg_180":
      return "deg180";
    case "deg_360":
      return "deg360";
    default: {
      const _exhaustive: never = printArea;
      return _exhaustive;
    }
  }
}

/** Printable band width as a fraction of the preview frame (0–1). */
export function printableWidthFraction(printArea: PrintAreaId): number {
  return printArea === "deg_360" ? 0.72 : 0.38;
}
