import type { ProductImportFieldKey, ProductImportProposedAction } from "@/domain/product-import-types";
import type { ProductImportJobRow, ProductImportJobSummary } from "@/application/product-import-service";
import type { ProductImportMappingProfile } from "@/application/product-import-service";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Product import API request failed.");
  return payload;
}

export async function uploadProductImportJob(input: {
  file: File;
  worksheetName?: string;
}): Promise<ProductImportJobSummary> {
  const formData = new FormData();
  formData.set("file", input.file);
  if (input.worksheetName) formData.set("worksheetName", input.worksheetName);
  const response = await fetch("/api/products/import/jobs/create", {
    body: formData,
    credentials: "include",
    method: "POST"
  });
  const payload = await parseJson<{ job: ProductImportJobSummary }>(response);
  return payload.job;
}

export async function listProductImportJobsApi(): Promise<ProductImportJobSummary[]> {
  const response = await fetch("/api/products/import/jobs", { credentials: "include" });
  const payload = await parseJson<{ jobs: ProductImportJobSummary[] }>(response);
  return payload.jobs;
}

export async function parseProductImportJobApi(input: {
  jobId: string;
  parsedFileBase64: string;
  filename: string;
  worksheetName: string;
  columnMappings: Record<string, ProductImportFieldKey>;
}): Promise<{ job: ProductImportJobSummary; rows: ProductImportJobRow[] }> {
  const response = await fetch(`/api/products/import/jobs/${encodeURIComponent(input.jobId)}`, {
    body: JSON.stringify({
      action: "parse",
      columnMappings: input.columnMappings,
      filename: input.filename,
      parsedFileBase64: input.parsedFileBase64,
      worksheetName: input.worksheetName
    }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  return parseJson(response);
}

export async function approveProductImportJobApi(input: {
  jobId: string;
  rowApprovals: Array<{ rowId: string; approvedAction: ProductImportProposedAction }>;
}): Promise<ProductImportJobSummary> {
  const response = await fetch(`/api/products/import/jobs/${encodeURIComponent(input.jobId)}`, {
    body: JSON.stringify({ action: "approve", rowApprovals: input.rowApprovals }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{ job: ProductImportJobSummary }>(response);
  return payload.job;
}

export async function applyProductImportJobApi(input: {
  jobId: string;
  idempotencyKey?: string;
}): Promise<Record<string, unknown>> {
  const response = await fetch(`/api/products/import/jobs/${encodeURIComponent(input.jobId)}`, {
    body: JSON.stringify({ action: "apply", idempotencyKey: input.idempotencyKey }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{ result: Record<string, unknown> }>(response);
  return payload.result;
}

export async function fetchProductImportJobRows(
  jobId: string,
  offset = 0,
  limit = 50
): Promise<ProductImportJobRow[]> {
  const response = await fetch(
    `/api/products/import/jobs/${encodeURIComponent(jobId)}?offset=${offset}&limit=${limit}`,
    { credentials: "include" }
  );
  const payload = await parseJson<{ rows: ProductImportJobRow[] }>(response);
  return payload.rows;
}

export function productImportErrorReportUrl(jobId: string): string {
  return `/api/products/import/jobs/${encodeURIComponent(jobId)}/error-report`;
}

export async function listProductImportMappingProfilesApi(): Promise<ProductImportMappingProfile[]> {
  const response = await fetch("/api/products/import/mapping-profiles", { credentials: "include" });
  const payload = await parseJson<{ profiles: ProductImportMappingProfile[] }>(response);
  return payload.profiles;
}

export async function createProductImportMappingProfileApi(input: {
  name: string;
  columnMappings: Record<string, ProductImportFieldKey>;
  sourceType?: string;
  sourceLabel?: string;
  worksheetPattern?: string;
}): Promise<ProductImportMappingProfile> {
  const response = await fetch("/api/products/import/mapping-profiles", {
    body: JSON.stringify(input),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{ profile: ProductImportMappingProfile }>(response);
  return payload.profile;
}

export async function updateProductImportMappingProfileApi(input: {
  profileId: string;
  name?: string;
  columnMappings?: Record<string, ProductImportFieldKey>;
}): Promise<ProductImportMappingProfile> {
  const response = await fetch(`/api/products/import/mapping-profiles/${encodeURIComponent(input.profileId)}`, {
    body: JSON.stringify(input),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "PATCH"
  });
  const payload = await parseJson<{ profile: ProductImportMappingProfile }>(response);
  return payload.profile;
}

export async function deleteProductImportMappingProfileApi(profileId: string): Promise<void> {
  const response = await fetch(`/api/products/import/mapping-profiles/${encodeURIComponent(profileId)}`, {
    credentials: "include",
    method: "DELETE"
  });
  await parseJson(response);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
