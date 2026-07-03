import type { ProductClassification } from "@/domain/product-import-types";

export type ClassificationSuggestion = {
  classification: ProductClassification;
  confidence: "explicit" | "inferred";
  reason: string;
};

const EXPLICIT_KEYWORDS: Array<{ keywords: string[]; classification: ProductClassification }> = [
  { classification: "PRINTED_CUP", keywords: ["copo personalizado", "printed cup", "personaliz"] },
  { classification: "FLOW_PACK", keywords: ["flow pack", "flow-pack", "flowpack"] },
  { classification: "SHRINK_WRAP", keywords: ["shrink", "termo", "termoshrink"] },
  { classification: "RELABEL", keywords: ["relabel", "re-etiqueta", "etiqueta"] },
  { classification: "REPACKAGE", keywords: ["repackage", "reembala"] },
  { classification: "MANUFACTURED", keywords: ["manufactured", "fabricado", "produzido"] }
];

/** Never auto-apply inferred classifications — suggestions only. */
export function suggestClassification(description: string): ClassificationSuggestion | null {
  const lower = description.toLowerCase();
  for (const rule of EXPLICIT_KEYWORDS) {
    const match = rule.keywords.find((keyword) => lower.includes(keyword));
    if (match) {
      return {
        classification: rule.classification,
        confidence: "explicit",
        reason: `Keyword match: ${match}`
      };
    }
  }
  if (lower.includes("copo") || lower.includes("cup")) {
    return {
      classification: "DIRECT_SALE",
      confidence: "inferred",
      reason: "Cup product — default direct sale unless user confirms otherwise."
    };
  }
  return {
    classification: "REVIEW_REQUIRED",
    confidence: "inferred",
    reason: "No explicit classification signal."
  };
}

export function bulkClassifyRows(
  rowIds: string[],
  classification: ProductClassification
): Array<{ rowId: string; classification: ProductClassification }> {
  return rowIds.map((rowId) => ({ classification, rowId }));
}

export const CLASSIFICATION_LABELS: Record<ProductClassification, { en: string; pt: string }> = {
  DIRECT_SALE: { en: "Direct sale", pt: "Venda direta" },
  RELABEL: { en: "Relabel required", pt: "Re-etiquetagem necessária" },
  REPACKAGE: { en: "Repackaging required", pt: "Reembalagem necessária" },
  MANUFACTURED: { en: "Manufactured / printed", pt: "Fabricado / impresso" },
  FLOW_PACK: { en: "Flow-pack required", pt: "Flow-pack necessário" },
  SHRINK_WRAP: { en: "Shrink-wrap required", pt: "Termoencolhimento necessário" },
  PRINTED_CUP: { en: "Printed cup", pt: "Copo personalizado" },
  REVIEW_REQUIRED: { en: "Review required", pt: "Revisão necessária" }
};
