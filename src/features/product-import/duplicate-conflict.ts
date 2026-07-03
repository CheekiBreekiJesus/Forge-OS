import type { Product } from "@/domain/product-types";
import type {
  ProductImportConflictField,
  ProductImportDuplicateMatch,
  ProductImportFieldKey,
  ProductImportProposedAction,
  ProductImportRow,
  ProductImportRowStatus,
  ProductImportValueMap,
  SourcePrecedencePolicy,
  SourcePrecedenceTier
} from "@/domain/product-import-types";
import { DEFAULT_SOURCE_PRECEDENCE } from "@/domain/product-import-types";
import { descriptionsSimilar, isEmptyPlaceholder } from "@/features/product-import/normalize";

export type DuplicateAnalysisContext = {
  existingProducts: Product[];
  stagedRows: ProductImportRow[];
  sourceLabel: string;
};

const COMMERCIAL_FIELDS: ProductImportFieldKey[] = [
  "salePrice",
  "purchaseCost",
  "vatRate",
  "margin",
  "markup"
];

export function analyzeDuplicatesAndConflicts(
  normalizedValues: ProductImportValueMap,
  context: DuplicateAnalysisContext
): {
  duplicateMatches: ProductImportDuplicateMatch[];
  conflictFields: ProductImportConflictField[];
  proposedAction: ProductImportProposedAction;
  status: ProductImportRowStatus;
} {
  const duplicateMatches = findDuplicateMatches(normalizedValues, context);
  const conflictFields = findConflicts(normalizedValues, duplicateMatches, context);

  let proposedAction: ProductImportProposedAction = "create_new";
  let status: ProductImportRowStatus = "valid";

  const strongMatch = duplicateMatches.find((m) => m.confidence === "strong");
  if (strongMatch?.productId) {
    if (conflictFields.length > 0) {
      proposedAction = "manual_review";
      status = "conflict";
    } else {
      proposedAction = "update_missing_only";
      status = "duplicate";
    }
  } else if (duplicateMatches.some((m) => m.confidence === "possible")) {
    proposedAction = "manual_review";
    status = "duplicate";
  }

  if (conflictFields.some((c) => COMMERCIAL_FIELDS.includes(c.field))) {
    proposedAction = "manual_review";
    status = "conflict";
  }

  return { conflictFields, duplicateMatches, proposedAction, status };
}

function findDuplicateMatches(
  values: ProductImportValueMap,
  context: DuplicateAnalysisContext
): ProductImportDuplicateMatch[] {
  const matches: ProductImportDuplicateMatch[] = [];
  const ref = values.internalReference?.trim();
  const barcode = values.barcode?.trim() || values.ean?.trim();

  for (const product of context.existingProducts) {
    if (ref && product.sku.toUpperCase() === ref.toUpperCase()) {
      matches.push({
        confidence: "strong",
        label: `Exact reference match: ${product.sku}`,
        matchType: "exact_reference",
        productId: product.id
      });
    }
  }

  if (barcode) {
    for (const product of context.existingProducts) {
      if (product.sku === barcode) {
        matches.push({
          confidence: "strong",
          label: `Barcode matches product SKU: ${product.sku}`,
          matchType: "exact_barcode",
          productId: product.id
        });
      }
    }
  }

  const sourceRef = values.invoiceReference ?? values.internalReference;
  if (sourceRef) {
    for (const row of context.stagedRows) {
      const rowRef = row.normalizedValues.invoiceReference ?? row.normalizedValues.internalReference;
      if (rowRef && rowRef === sourceRef) {
        matches.push({
          confidence: "strong",
          label: `Same source reference in batch row ${row.sourceRowNumber}`,
          matchType: "exact_source_reference",
          stagedRowId: row.id
        });
      }
    }
  }

  if (values.description && values.baseUnit) {
    for (const product of context.existingProducts) {
      if (descriptionsSimilar(values.description, product.name)) {
        matches.push({
          confidence: "possible",
          label: `Similar description: ${product.name.slice(0, 40)}…`,
          matchType: "possible_description",
          productId: product.id
        });
      }
    }
  }

  return dedupeMatches(matches);
}

function dedupeMatches(matches: ProductImportDuplicateMatch[]): ProductImportDuplicateMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.matchType}:${match.productId ?? ""}:${match.stagedRowId ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findConflicts(
  values: ProductImportValueMap,
  matches: ProductImportDuplicateMatch[],
  context: DuplicateAnalysisContext
): ProductImportConflictField[] {
  const productId = matches.find((m) => m.productId)?.productId;
  if (!productId) return [];

  const product = context.existingProducts.find((p) => p.id === productId);
  if (!product) return [];

  const conflicts: ProductImportConflictField[] = [];

  if (values.salePrice && product.basePrice > 0) {
    const incoming = Number(values.salePrice);
    if (!Number.isNaN(incoming) && Math.abs(incoming - product.basePrice) > 0.001) {
      conflicts.push({
        existingSource: "forgeos_approved",
        existingValue: String(product.basePrice),
        field: "salePrice",
        incomingSource: context.sourceLabel,
        incomingValue: values.salePrice
      });
    }
  }

  if (values.description && product.name && values.description !== product.name) {
    if (!descriptionsSimilar(values.description, product.name, 0.95)) {
      conflicts.push({
        existingSource: "forgeos_approved",
        existingValue: product.name,
        field: "description",
        incomingSource: context.sourceLabel,
        incomingValue: values.description
      });
    }
  }

  if (values.baseUnit && values.baseUnit !== "unit") {
    conflicts.push({
      existingSource: "forgeos_approved",
      existingValue: "unit",
      field: "baseUnit",
      incomingSource: context.sourceLabel,
      incomingValue: values.baseUnit
    });
  }

  return conflicts;
}

export function resolveConflictWithPrecedence(
  conflict: ProductImportConflictField,
  policy: SourcePrecedencePolicy = DEFAULT_SOURCE_PRECEDENCE
): ProductImportConflictField["resolution"] {
  const order = policy.fieldOverrides[conflict.field] ?? policy.defaultOrder;
  const existingTier = tierFromSource(conflict.existingSource);
  const incomingTier = tierFromSource(conflict.incomingSource);
  const existingRank = order.indexOf(existingTier);
  const incomingRank = order.indexOf(incomingTier);

  if (existingRank >= 0 && incomingRank >= 0 && existingRank < incomingRank) {
    return "preserve_existing";
  }
  if (incomingRank >= 0 && existingRank >= 0 && incomingRank < existingRank) {
    return "use_incoming";
  }
  return "manual_review";
}

function tierFromSource(source: string): SourcePrecedenceTier {
  if (source.includes("forgeos")) return "forgeos_approved";
  if (source.includes("curated") || source.includes("workbook")) return "curated_workbook";
  if (source.includes("invoice") || source.includes("artigos")) return "invoice_export";
  return "inferred_default";
}

export function validateRowRequiredFields(values: ProductImportValueMap): string[] {
  const errors: string[] = [];
  if (isEmptyPlaceholder(values.internalReference)) {
    errors.push("Missing internal reference.");
  }
  if (isEmptyPlaceholder(values.description)) {
    errors.push("Missing description.");
  }
  return errors;
}

export function countDuplicateReferences(rows: ProductImportValueMap[]): number {
  const refs = rows.map((r) => r.internalReference?.toUpperCase()).filter(Boolean);
  return refs.length - new Set(refs).size;
}

export function countDuplicateBarcodes(rows: ProductImportValueMap[]): number {
  const codes = rows.map((r) => r.barcode ?? r.ean).filter(Boolean);
  return codes.length - new Set(codes).size;
}
