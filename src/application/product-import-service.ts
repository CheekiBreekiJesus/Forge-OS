import type {
  ImportExistingItem,
  ProductImportBatchStatus,
  ProductImportFieldKey,
  ProductImportProposedAction,
  ProductImportRow,
  ProductImportValueMap
} from "@/domain/product-import-types";
import type { Product } from "@/domain/product-types";
import { requireProductImportPermission } from "@/features/product-import/auth";
import {
  analyzeDuplicatesAndConflicts,
  validateRowRequiredFields
} from "@/features/product-import/duplicate-conflict";
import { applyColumnMapping, rawRowToRecord } from "@/features/product-import/field-mapping";
import { normalizeMappedValues } from "@/features/product-import/normalize";
import {
  fingerprintFile,
  inferSourceType,
  type ParsedSpreadsheet
} from "@/features/product-import/parse-spreadsheet";
import type { ForgeOSSession } from "@/lib/auth/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { PersistenceError } from "@/persistence/interfaces";

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export type ProductImportJobSummary = {
  id: string;
  tenantId: string;
  filename: string;
  fileFormat: string;
  worksheetName: string;
  status: ProductImportBatchStatus;
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateRows: number;
  conflictRows: number;
  appliedRows: number;
  skippedRows: number;
  failedRows: number;
  createdAt: string;
  completedAt: string | null;
  resultSummary: Record<string, unknown>;
};

export type ProductImportJobRow = {
  id: string;
  sourceRowNumber: number;
  originalValues: Record<string, string>;
  normalizedValues: ProductImportValueMap;
  validationErrors: string[];
  warnings: string[];
  duplicateMatches: ProductImportRow["duplicateMatches"];
  conflictFields: ProductImportRow["conflictFields"];
  proposedAction: ProductImportProposedAction;
  approvedAction: ProductImportProposedAction | null;
  status: ProductImportRow["status"];
};

function nowIso(): string {
  return new Date().toISOString();
}

function assertFileSize(byteLength: number): void {
  if (byteLength > MAX_IMPORT_FILE_BYTES) {
    throw new PersistenceError("invalid_transition", "Import file exceeds the 10 MB limit.");
  }
}

function assertFileFormat(filename: string): "csv" | "xlsx" | "xls" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  throw new PersistenceError("invalid_transition", "Unsupported file format. Use CSV or XLSX.");
}

export async function listProductImportJobs(
  session: ForgeOSSession
): Promise<ProductImportJobSummary[]> {
  requireProductImportPermission(session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("prod_import_jobs")
    .select(
      "id, tenant_id, filename, file_format, worksheet_name, status, total_rows, valid_rows, warning_rows, invalid_rows, duplicate_rows, conflict_rows, applied_rows, skipped_rows, failed_rows, created_at, completed_at, result_summary"
    )
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new PersistenceError("unavailable", "Failed to list import jobs.");
  }

  return (data ?? []).map(mapJobSummary);
}

export async function createProductImportJob(input: {
  session: ForgeOSSession;
  filename: string;
  fileBuffer: ArrayBuffer;
  worksheetName?: string;
}): Promise<ProductImportJobSummary> {
  requireProductImportPermission(input.session);
  assertFileSize(input.fileBuffer.byteLength);
  const fileFormat = assertFileFormat(input.filename);
  const fingerprint = await fingerprintFile(input.fileBuffer);
  const idempotencyKey = `import:${fingerprint}:${input.session.userId}`;

  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("prod_import_jobs")
    .insert({
      column_mappings: {},
      file_fingerprint: fingerprint,
      file_format: fileFormat,
      filename: input.filename,
      idempotency_key: idempotencyKey,
      operator_id: input.session.userId,
      source_label: input.filename,
      source_type: inferSourceType(input.filename, input.worksheetName ?? ""),
      status: "uploaded",
      tenant_id: input.session.tenantId,
      worksheet_name: input.worksheetName ?? ""
    })
    .select(
      "id, tenant_id, filename, file_format, worksheet_name, status, total_rows, valid_rows, warning_rows, invalid_rows, duplicate_rows, conflict_rows, applied_rows, skipped_rows, failed_rows, created_at, completed_at, result_summary"
    )
    .single();

  if (error || !data) {
    throw new PersistenceError("unavailable", "Failed to create import job.");
  }

  return mapJobSummary(data);
}

export async function parseProductImportJob(input: {
  session: ForgeOSSession;
  jobId: string;
  parsed: ParsedSpreadsheet;
  worksheetName: string;
  columnMappings: Record<string, ProductImportFieldKey>;
  existingProducts: Product[];
  existingInventoryItems?: ImportExistingItem[];
}): Promise<{ job: ProductImportJobSummary; rows: ProductImportJobRow[] }> {
  requireProductImportPermission(input.session);
  const client = createSupabaseServiceClient();
  const worksheet = input.parsed.worksheets.find((ws) => ws.name === input.worksheetName);
  if (!worksheet) {
    throw new PersistenceError("not_found", "Worksheet not found.");
  }

  const stagedRows: ProductImportJobRow[] = [];
  const priorRows: ProductImportRow[] = [];
  let validRows = 0;
  let warningRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;
  let conflictRows = 0;

  for (let index = 0; index < worksheet.rows.length; index++) {
    const rawRow = worksheet.rows[index];
    const originalValues = rawRowToRecord(worksheet.headers, rawRow);
    const mapped = applyColumnMapping(worksheet.headers, rawRow, input.columnMappings);
    const { values: normalizedValues, warnings: normalizeWarnings } = normalizeMappedValues(mapped);
    const validationErrors = validateRowRequiredFields(normalizedValues);
    const analysis = analyzeDuplicatesAndConflicts(normalizedValues, {
      existingInventoryItems: input.existingInventoryItems ?? [],
      existingProducts: input.existingProducts,
      sourceLabel: input.parsed.filename,
      stagedRows: priorRows
    });

    let status: ProductImportRow["status"] = analysis.status;
    if (validationErrors.length > 0) status = "invalid";
    else if (normalizeWarnings.length > 0 && status === "valid") status = "warning";

    if (status === "valid") validRows += 1;
    else if (status === "warning") warningRows += 1;
    else if (status === "invalid") invalidRows += 1;
    if (status === "duplicate") duplicateRows += 1;
    if (status === "conflict") conflictRows += 1;

    const rowId = crypto.randomUUID();
    const row: ProductImportJobRow = {
      approvedAction: null,
      conflictFields: analysis.conflictFields,
      duplicateMatches: analysis.duplicateMatches,
      id: rowId,
      normalizedValues,
      originalValues,
      proposedAction: validationErrors.length > 0 ? "manual_review" : analysis.proposedAction,
      sourceRowNumber: index + 1,
      status,
      validationErrors,
      warnings: normalizeWarnings
    };

    priorRows.push({
      approvedAction: null,
      batchId: input.jobId,
      classification: null,
      committedProductId: null,
      conflictFields: analysis.conflictFields,
      createdAt: nowIso(),
      duplicateMatches: analysis.duplicateMatches,
      id: rowId,
      normalizedValues,
      originalValues,
      proposedAction: row.proposedAction,
      sourceRowNumber: row.sourceRowNumber,
      status,
      tenantId: input.session.tenantId,
      updatedAt: nowIso(),
      validationErrors,
      warnings: normalizeWarnings
    });
    stagedRows.push(row);
  }

  await client.from("prod_import_rows").delete().eq("job_id", input.jobId);
  await client.from("prod_import_validation_issues").delete().eq("job_id", input.jobId);

  if (stagedRows.length > 0) {
    const { error: rowError } = await client.from("prod_import_rows").insert(
      stagedRows.map((row) => ({
        approved_action: row.approvedAction,
        conflict_fields: row.conflictFields,
        duplicate_matches: row.duplicateMatches,
        id: row.id,
        job_id: input.jobId,
        normalized_values: row.normalizedValues,
        original_values: row.originalValues,
        proposed_action: row.proposedAction,
        resolution_status: row.status,
        source_row_number: row.sourceRowNumber,
        tenant_id: input.session.tenantId
      }))
    );
    if (rowError) {
      throw new PersistenceError("unavailable", "Failed to stage import rows.");
    }

    const issues = stagedRows.flatMap((row) => [
      ...row.validationErrors.map((message) => ({
        code: "validation_error",
        field_key: null,
        job_id: input.jobId,
        message,
        row_id: row.id,
        severity: "error",
        tenant_id: input.session.tenantId
      })),
      ...row.warnings.map((message) => ({
        code: "validation_warning",
        field_key: null,
        job_id: input.jobId,
        message,
        row_id: row.id,
        severity: "warning",
        tenant_id: input.session.tenantId
      }))
    ]);

    if (issues.length > 0) {
      const { error: issueError } = await client.from("prod_import_validation_issues").insert(issues);
      if (issueError) {
        throw new PersistenceError("unavailable", "Failed to store validation issues.");
      }
    }
  }

  const { data: job, error: jobError } = await client
    .from("prod_import_jobs")
    .update({
      column_mappings: input.columnMappings,
      conflict_rows: conflictRows,
      duplicate_rows: duplicateRows,
      invalid_rows: invalidRows,
      status: Object.keys(input.columnMappings).length > 0 ? "validated" : "needs_mapping",
      total_rows: stagedRows.length,
      updated_at: nowIso(),
      valid_rows: validRows,
      warning_rows: warningRows,
      worksheet_name: input.worksheetName
    })
    .eq("id", input.jobId)
    .eq("tenant_id", input.session.tenantId)
    .select(
      "id, tenant_id, filename, file_format, worksheet_name, status, total_rows, valid_rows, warning_rows, invalid_rows, duplicate_rows, conflict_rows, applied_rows, skipped_rows, failed_rows, created_at, completed_at, result_summary"
    )
    .single();

  if (jobError || !job) {
    throw new PersistenceError("unavailable", "Failed to update import job.");
  }

  return { job: mapJobSummary(job), rows: stagedRows };
}

export async function approveProductImportJob(input: {
  session: ForgeOSSession;
  jobId: string;
  rowApprovals: Array<{ rowId: string; approvedAction: ProductImportProposedAction }>;
}): Promise<ProductImportJobSummary> {
  requireProductImportPermission(input.session);
  const client = createSupabaseServiceClient();

  for (const approval of input.rowApprovals) {
    const { error } = await client
      .from("prod_import_rows")
      .update({
        approved_action: approval.approvedAction,
        updated_at: nowIso()
      })
      .eq("id", approval.rowId)
      .eq("job_id", input.jobId)
      .eq("tenant_id", input.session.tenantId);
    if (error) {
      throw new PersistenceError("unavailable", "Failed to save row approvals.");
    }
  }

  const { data, error } = await client
    .from("prod_import_jobs")
    .update({
      approved_at: nowIso(),
      approved_by: input.session.userId,
      status: "approved",
      updated_at: nowIso()
    })
    .eq("id", input.jobId)
    .eq("tenant_id", input.session.tenantId)
    .select(
      "id, tenant_id, filename, file_format, worksheet_name, status, total_rows, valid_rows, warning_rows, invalid_rows, duplicate_rows, conflict_rows, applied_rows, skipped_rows, failed_rows, created_at, completed_at, result_summary"
    )
    .single();

  if (error || !data) {
    throw new PersistenceError("unavailable", "Failed to approve import job.");
  }

  return mapJobSummary(data);
}

export async function applyProductImportJob(input: {
  session: ForgeOSSession;
  jobId: string;
  idempotencyKey?: string;
}): Promise<Record<string, unknown>> {
  requireProductImportPermission(input.session);
  const client = createSupabaseServiceClient();
  const key = input.idempotencyKey ?? `apply:${input.jobId}:${input.session.userId}`;

  const { data, error } = await client.rpc("apply_product_import_job", {
    p_idempotency_key: key,
    p_job_id: input.jobId,
    p_operator_id: input.session.userId
  });

  if (error) {
    throw new PersistenceError("unavailable", error.message);
  }

  return (data as Record<string, unknown>) ?? {};
}

export async function getProductImportJobRows(input: {
  session: ForgeOSSession;
  jobId: string;
  offset?: number;
  limit?: number;
}): Promise<ProductImportJobRow[]> {
  requireProductImportPermission(input.session);
  const client = createSupabaseServiceClient();
  const from = input.offset ?? 0;
  const to = from + (input.limit ?? 50) - 1;

  const { data, error } = await client
    .from("prod_import_rows")
    .select(
      "id, source_row_number, original_values, normalized_values, duplicate_matches, conflict_fields, proposed_action, approved_action, resolution_status"
    )
    .eq("job_id", input.jobId)
    .eq("tenant_id", input.session.tenantId)
    .order("source_row_number", { ascending: true })
    .range(from, to);

  if (error) {
    throw new PersistenceError("unavailable", "Failed to load import rows.");
  }

  const rowIds = (data ?? []).map((row) => row.id as string);
  const issuesByRow = new Map<string, { errors: string[]; warnings: string[] }>();
  if (rowIds.length > 0) {
    const { data: issues } = await client
      .from("prod_import_validation_issues")
      .select("row_id, severity, message")
      .eq("job_id", input.jobId)
      .in("row_id", rowIds);

    for (const issue of issues ?? []) {
      const bucket = issuesByRow.get(issue.row_id as string) ?? { errors: [], warnings: [] };
      if (issue.severity === "error") bucket.errors.push(issue.message as string);
      else bucket.warnings.push(issue.message as string);
      issuesByRow.set(issue.row_id as string, bucket);
    }
  }

  return (data ?? []).map((row) => {
    const issueBucket = issuesByRow.get(row.id as string) ?? { errors: [], warnings: [] };
    return {
      approvedAction: (row.approved_action as ProductImportProposedAction | null) ?? null,
      conflictFields: (row.conflict_fields as ProductImportRow["conflictFields"]) ?? [],
      duplicateMatches: (row.duplicate_matches as ProductImportRow["duplicateMatches"]) ?? [],
      id: row.id as string,
      normalizedValues: (row.normalized_values as ProductImportValueMap) ?? {},
      originalValues: (row.original_values as Record<string, string>) ?? {},
      proposedAction: row.proposed_action as ProductImportProposedAction,
      sourceRowNumber: row.source_row_number as number,
      status: row.resolution_status as ProductImportRow["status"],
      validationErrors: issueBucket.errors,
      warnings: issueBucket.warnings
    };
  });
}

function mapJobSummary(row: Record<string, unknown>): ProductImportJobSummary {
  return {
    appliedRows: Number(row.applied_rows ?? 0),
    completedAt: (row.completed_at as string | null) ?? null,
    conflictRows: Number(row.conflict_rows ?? 0),
    createdAt: row.created_at as string,
    duplicateRows: Number(row.duplicate_rows ?? 0),
    failedRows: Number(row.failed_rows ?? 0),
    fileFormat: row.file_format as string,
    filename: row.filename as string,
    id: row.id as string,
    invalidRows: Number(row.invalid_rows ?? 0),
    resultSummary: (row.result_summary as Record<string, unknown>) ?? {},
    skippedRows: Number(row.skipped_rows ?? 0),
    status: row.status as ProductImportBatchStatus,
    tenantId: row.tenant_id as string,
    totalRows: Number(row.total_rows ?? 0),
    validRows: Number(row.valid_rows ?? 0),
    warningRows: Number(row.warning_rows ?? 0),
    worksheetName: (row.worksheet_name as string) ?? ""
  };
}
