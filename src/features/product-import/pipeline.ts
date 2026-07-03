import { createRecordId } from "@/domain/ids";
import type {
  ProductImportBatch,
  ProductImportRow,
  ProductImportRowStatus,
  ProductMappingProfile
} from "@/domain/product-import-types";
import type { Product } from "@/domain/product-types";
import type { ProductImportRepositoryBundle } from "@/persistence/indexeddb/product-import-repositories";
import { suggestClassification } from "@/features/product-import/classification";
import {
  analyzeDuplicatesAndConflicts,
  validateRowRequiredFields
} from "@/features/product-import/duplicate-conflict";
import {
  applyColumnMapping,
  rawRowToRecord,
  suggestFieldMapping
} from "@/features/product-import/field-mapping";
import { normalizeMappedValues } from "@/features/product-import/normalize";
import { fingerprintFile, inferSourceType, type ParsedSpreadsheet } from "@/features/product-import/parse-spreadsheet";

function nowIso(): string {
  return new Date().toISOString();
}

export async function createBatchFromSpreadsheet(
  tenantId: string,
  parsed: ParsedSpreadsheet,
  worksheetName: string,
  fileBuffer: ArrayBuffer,
  importRepos: ProductImportRepositoryBundle,
  operatorId: string | null
): Promise<ProductImportBatch> {
  const worksheet = parsed.worksheets.find((ws) => ws.name === worksheetName);
  if (!worksheet) throw new Error("Worksheet not found.");

  const fingerprint = await fingerprintFile(fileBuffer);
  const sourceType = inferSourceType(parsed.filename, worksheetName);

  return importRepos.batches.create(tenantId, {
    completedAt: null,
    committedRows: 0,
    conflictRows: 0,
    duplicateRows: 0,
    fileFingerprint: fingerprint,
    filename: parsed.filename,
    invalidRows: 0,
    mappingProfileId: null,
    operatorId,
    skippedRows: 0,
    sourceLabel: `${parsed.filename} / ${worksheetName}`,
    sourceType,
    stagedRows: 0,
    status: "parsed",
    totalRows: worksheet.rows.length,
    validRows: 0,
    warningRows: 0,
    worksheet: worksheetName
  });
}

export function buildSuggestedProfile(
  tenantId: string,
  parsed: ParsedSpreadsheet,
  worksheetName: string
): Omit<ProductMappingProfile, "id" | "createdAt" | "updatedAt"> {
  const worksheet = parsed.worksheets.find((ws) => ws.name === worksheetName);
  const mappings = suggestFieldMapping(worksheet?.headers ?? []);
  return {
    columnMappings: mappings,
    name: `${parsed.filename} — ${worksheetName}`,
    sourceLabel: `${parsed.filename} / ${worksheetName}`,
    sourceType: inferSourceType(parsed.filename, worksheetName),
    tenantId,
    worksheetPattern: worksheetName
  };
}

export async function processAndStageRows(
  tenantId: string,
  batch: ProductImportBatch,
  parsed: ParsedSpreadsheet,
  columnMappings: Record<string, import("@/domain/product-import-types").ProductImportFieldKey>,
  existingProducts: Product[],
  importRepos: ProductImportRepositoryBundle
): Promise<ProductImportBatch> {
  const worksheet = parsed.worksheets.find((ws) => ws.name === batch.worksheet);
  if (!worksheet) throw new Error("Worksheet not found.");

  const stagedRows: ProductImportRow[] = [];
  const priorRows: ProductImportRow[] = [];

  let validRows = 0;
  let warningRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;
  let conflictRows = 0;

  for (let index = 0; index < worksheet.rows.length; index++) {
    const rawRow = worksheet.rows[index];
    const originalValues = rawRowToRecord(worksheet.headers, rawRow);
    const mapped = applyColumnMapping(worksheet.headers, rawRow, columnMappings);
    const { values: normalizedValues, warnings: normalizeWarnings } = normalizeMappedValues(mapped);
    const validationErrors = validateRowRequiredFields(normalizedValues);

    const analysis = analyzeDuplicatesAndConflicts(normalizedValues, {
      existingProducts,
      sourceLabel: batch.sourceLabel,
      stagedRows: priorRows
    });

    for (const conflict of analysis.conflictFields) {
      conflict.resolution = undefined;
    }

    let status: ProductImportRowStatus = analysis.status;
    if (validationErrors.length > 0) {
      status = "invalid";
    } else if (normalizeWarnings.length > 0 && status === "valid") {
      status = "warning";
    }

    if (status === "valid") validRows += 1;
    else if (status === "warning") warningRows += 1;
    else if (status === "invalid") invalidRows += 1;
    if (status === "duplicate") duplicateRows += 1;
    if (status === "conflict") conflictRows += 1;

    const classificationSuggestion = normalizedValues.description
      ? suggestClassification(normalizedValues.description)
      : null;

    const timestamp = nowIso();
    const row: ProductImportRow = {
      approvedAction: null,
      batchId: batch.id,
      classification:
        classificationSuggestion?.confidence === "explicit"
          ? classificationSuggestion.classification
          : null,
      committedProductId: null,
      conflictFields: analysis.conflictFields,
      createdAt: timestamp,
      duplicateMatches: analysis.duplicateMatches,
      id: createRecordId("pimprow"),
      normalizedValues,
      originalValues,
      proposedAction: validationErrors.length > 0 ? "manual_review" : analysis.proposedAction,
      sourceRowNumber: index + 1,
      status,
      tenantId,
      updatedAt: timestamp,
      validationErrors,
      warnings: [
        ...normalizeWarnings,
        ...(worksheet.formulaWarnings > 0 ? ["Some cells contain formulas; displayed values were used."] : []),
        ...(classificationSuggestion?.confidence === "inferred"
          ? [`Classification suggestion: ${classificationSuggestion.classification}`]
          : [])
      ]
    };

    priorRows.push(row);
    stagedRows.push(row);
  }

  await importRepos.rows.createMany(tenantId, stagedRows);

  return importRepos.batches.update(tenantId, batch.id, {
    conflictRows,
    duplicateRows,
    invalidRows,
    stagedRows: stagedRows.length,
    status: "staged",
    validRows,
    warningRows
  });
}

export async function confirmStaging(
  tenantId: string,
  batchId: string,
  rowIds: string[],
  importRepos: ProductImportRepositoryBundle
): Promise<void> {
  for (const rowId of rowIds) {
    await importRepos.rows.update(tenantId, rowId, { status: "staged" });
  }
  await importRepos.batches.update(tenantId, batchId, { status: "staged" });
}
