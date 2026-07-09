import { createRecordId } from "@/domain/ids";
import type { Product } from "@/domain/product-types";
import type {
  ProductImportBatch,
  ProductImportProposedAction,
  ProductImportRow,
  ProductImportValueMap,
  ProductSourceReference
} from "@/domain/product-import-types";
import type { CreateProductInput } from "@/domain/product-types";
import type { ProductRepository } from "@/persistence/interfaces";
import type { ProductImportRepositoryBundle } from "@/persistence/indexeddb/product-import-repositories";
import { resolveConflictWithPrecedence } from "@/features/product-import/duplicate-conflict";
import { isEmptyPlaceholder } from "@/features/product-import/normalize";

function nowIso(): string {
  return new Date().toISOString();
}

function mapCategory(raw: string | undefined): Product["category"] {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("plastic") || value.includes("plástico") || value.includes("plastico")) {
    return "reusable-cups";
  }
  if (value.includes("personaliz") || value.includes("cup") || value.includes("copo")) {
    return "personalized-cups";
  }
  return "accessories";
}

function buildProductInput(values: ProductImportValueMap, existing?: Product): CreateProductInput {
  const basePrice = values.salePrice ? Number(values.salePrice) : (existing?.basePrice ?? 0);
  return {
    active: values.status !== "inactive",
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    basePrice: Number.isNaN(basePrice) ? 0 : basePrice,
    capacity: existing?.capacity ?? "330ml",
    category: mapCategory(values.category),
    color: existing?.color ?? "white",
    compatibleLidsAccessories: existing?.compatibleLidsAccessories ?? [],
    customizerUrl: existing?.customizerUrl ?? "",
    defaultCtaLabel: existing?.defaultCtaLabel ?? "Customize",
    emailDescription: existing?.emailDescription ?? values.description ?? "",
    emailTitle: existing?.emailTitle ?? values.description ?? "",
    image: existing?.image ?? "",
    imageUrl: existing?.imageUrl ?? "",
    isEmailPromotable: existing?.isEmailPromotable ?? false,
    leadTimeDays: existing?.leadTimeDays ?? 14,
    material: existing?.material ?? "PP",
    name: values.description ?? existing?.name ?? "Imported product",
    personalizationAvailable: existing?.personalizationAvailable ?? false,
    printArea: existing?.printArea ?? "",
    productPageUrl: existing?.productPageUrl ?? "",
    screenCost: existing?.screenCost ?? 0,
    setupCost: existing?.setupCost ?? 0,
    sku: values.internalReference ?? existing?.sku ?? createRecordId("sku"),
    sourceUrl: existing?.sourceUrl ?? null,
    stacksPerBox: existing?.stacksPerBox ?? 10,
    thumbnailUrl: existing?.thumbnailUrl ?? "",
    unitsPerBox: existing?.unitsPerBox ?? 1000,
    unitsPerStack: existing?.unitsPerStack ?? 100
  };
}

export type CommitResult = {
  committed: number;
  skipped: number;
  errors: string[];
  productIds: string[];
};

export async function commitApprovedRows(
  tenantId: string,
  batchId: string,
  rowIds: string[],
  productRepo: ProductRepository,
  importRepos: ProductImportRepositoryBundle,
  operatorId: string | null
): Promise<CommitResult> {
  const batch = await importRepos.batches.getById(tenantId, batchId);
  if (!batch) throw new Error("Import batch not found.");

  const allRows = await importRepos.rows.listByBatch(tenantId, batchId);
  const selected = allRows.filter((row) => rowIds.includes(row.id));
  const existingProducts = await productRepo.list(tenantId);

  let committed = 0;
  let skipped = 0;
  const errors: string[] = [];
  const productIds: string[] = [];

  for (const row of selected) {
    if (row.status === "committed") {
      skipped += 1;
      continue;
    }

    const action = row.approvedAction ?? row.proposedAction;
    if (action === "skip") {
      await importRepos.rows.update(tenantId, row.id, { status: "skipped", approvedAction: "skip" });
      skipped += 1;
      continue;
    }

    if (action === "manual_review") {
      errors.push(`Row ${row.sourceRowNumber} requires manual review.`);
      skipped += 1;
      continue;
    }

    try {
      const productId = await commitSingleRow(
        tenantId,
        row,
        action,
        existingProducts,
        productRepo,
        importRepos,
        batch
      );
      if (productId) {
        productIds.push(productId);
        committed += 1;
        await importRepos.rows.update(tenantId, row.id, {
          approvedAction: action,
          committedProductId: productId,
          status: "committed"
        });
      } else {
        skipped += 1;
      }
    } catch (error) {
      errors.push(`Row ${row.sourceRowNumber}: ${error instanceof Error ? error.message : "Commit failed."}`);
      skipped += 1;
    }
  }

  await importRepos.batches.update(tenantId, batchId, {
    committedRows: batch.committedRows + committed,
    completedAt: nowIso(),
    skippedRows: batch.skippedRows + skipped,
    status: committed > 0 ? (committed === selected.length ? "committed" : "partially_committed") : batch.status
  });

  void operatorId;
  return { committed, errors, productIds, skipped };
}

async function commitSingleRow(
  tenantId: string,
  row: ProductImportRow,
  action: ProductImportProposedAction,
  existingProducts: Product[],
  productRepo: ProductRepository,
  importRepos: ProductImportRepositoryBundle,
  batch: ProductImportBatch
): Promise<string | null> {
  const values = applyConflictResolutions(row);
  const matchProductId = row.duplicateMatches.find((m) => m.productId)?.productId;
  const existing = matchProductId ? existingProducts.find((p) => p.id === matchProductId) : undefined;

  if (action === "preserve_existing" && existing) {
    await createSourceReference(tenantId, existing.id, values, batch, importRepos);
    return existing.id;
  }

  if ((action === "update_missing_only" || action === "use_incoming") && existing) {
    const patch: Partial<CreateProductInput> = {};
    if (action === "update_missing_only") {
      if (existing.basePrice === 0 && values.salePrice) {
        patch.basePrice = Number(values.salePrice);
      }
      if (!existing.name && values.description) {
        patch.name = values.description;
      }
    } else {
      Object.assign(patch, buildProductInput(values, existing));
    }
    const updated = await productRepo.update(tenantId, existing.id, patch);
    await createSourceReference(tenantId, updated.id, values, batch, importRepos);
    return updated.id;
  }

  if (action === "link_source_reference" && existing) {
    await createSourceReference(tenantId, existing.id, values, batch, importRepos);
    return existing.id;
  }

  const created = await productRepo.create(tenantId, buildProductInput(values));
  await createSourceReference(tenantId, created.id, values, batch, importRepos);
  return created.id;
}

function applyConflictResolutions(row: ProductImportRow): ProductImportValueMap {
  const values = { ...row.normalizedValues };
  for (const conflict of row.conflictFields) {
    const resolution = conflict.resolution ?? resolveConflictWithPrecedence(conflict);
    if (resolution === "preserve_existing") {
      delete values[conflict.field];
    }
  }
  return values;
}

async function createSourceReference(
  tenantId: string,
  productId: string,
  values: ProductImportValueMap,
  batch: ProductImportBatch,
  importRepos: ProductImportRepositoryBundle
): Promise<ProductSourceReference> {
  const sourceReference = values.internalReference ?? values.invoiceReference ?? "";
  return importRepos.sourceReferences.create(tenantId, {
    importBatchId: batch.id,
    importedAt: nowIso(),
    productId,
    sourceLabel: batch.sourceLabel,
    sourceReference,
    sourceType: batch.sourceType
  });
}

export function rowsByFilter(rows: ProductImportRow[], filter: string): ProductImportRow[] {
  switch (filter) {
    case "valid":
      return rows.filter((r) => r.status === "valid");
    case "warnings":
      return rows.filter((r) => r.warnings.length > 0);
    case "invalid":
      return rows.filter((r) => r.status === "invalid");
    case "duplicates":
      return rows.filter((r) => r.status === "duplicate" || r.duplicateMatches.length > 0);
    case "conflicts":
      return rows.filter((r) => r.status === "conflict" || r.conflictFields.length > 0);
    case "missing_reference":
      return rows.filter((r) => isEmptyPlaceholder(r.normalizedValues.internalReference));
    case "missing_price":
      return rows.filter((r) => isEmptyPlaceholder(r.normalizedValues.salePrice));
    case "missing_barcode":
      return rows.filter(
        (r) =>
          isEmptyPlaceholder(r.normalizedValues.barcode) && isEmptyPlaceholder(r.normalizedValues.ean)
      );
    default:
      return rows;
  }
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
