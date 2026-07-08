/** Backward-compatible CSV import API — delegates to the modular import pipeline. */

import type { ImportFieldMapping } from "@/domain/import-types";
import { detectFieldMapping, applyFieldMapping } from "@/features/leadops/import-mapping";
import {
  analyzeImportRow,
  findFileDuplicateEmails,
  type ParsedImportRowInput
} from "@/features/leadops/import-deduplication";
import { mapRowsToInput, parseCsvText } from "@/features/leadops/import-file-parser";
import { isValidEmailSyntax } from "@/features/leadops/import-normalization";

export type LeadImportRowStatus = "valid" | "review" | "invalid";

export type ParsedLeadImportRow = {
  companyName: string;
  contactName: string;
  email: string;
  facebookUrl: string;
  industry: string;
  language: string;
  notes: string;
  phone: string;
  region: string;
  sourceDatabase: string;
  status: LeadImportRowStatus;
  validationMessages: string[];
  website: string;
};

export type LeadImportResult = {
  duplicateEmails: string[];
  headers: string[];
  invalidRows: ParsedLeadImportRow[];
  reviewRows: ParsedLeadImportRow[];
  validRows: ParsedLeadImportRow[];
};

export function parseLeadCsv(csv: string, mapping?: ImportFieldMapping): LeadImportResult {
  const { headers, rows } = parseCsvText(csv);
  const detectedMapping = mapping ?? detectFieldMapping(headers);
  const mappedRows = mapRowsToInput(headers, rows, detectedMapping);
  const fileDuplicateEmails = findFileDuplicateEmails(mappedRows);
  const duplicateEmails = [...fileDuplicateEmails].sort();

  const classifiedRows = mappedRows.map((row) =>
    toLegacyRow(row, fileDuplicateEmails, { leads: [], contacts: [] })
  );

  return {
    duplicateEmails,
    headers,
    invalidRows: classifiedRows.filter((row) => row.status === "invalid"),
    reviewRows: classifiedRows.filter((row) => row.status === "review"),
    validRows: classifiedRows.filter((row) => row.status === "valid")
  };
}

function toLegacyRow(
  row: ParsedImportRowInput,
  fileDuplicateEmails: Set<string>,
  existing: { leads: []; contacts: [] }
): ParsedLeadImportRow {
  const analysis = analyzeImportRow(row, existing, fileDuplicateEmails);
  let status: LeadImportRowStatus = "valid";
  if (analysis.status === "invalid") status = "invalid";
  else if (
    analysis.status === "duplicate" ||
    analysis.status === "possible_duplicate" ||
    analysis.status === "missing_email" ||
    fileDuplicateEmails.has(row.email)
  ) {
    status = "review";
  } else if (!row.industry || !row.region) {
    status = "review";
  }

  return {
    companyName: row.companyName,
    contactName: row.contactName,
    email: row.email,
    facebookUrl: "",
    industry: row.industry,
    language: row.language,
    notes: row.notes,
    phone: row.phone,
    region: row.region,
    sourceDatabase: row.sourceDatabase,
    status,
    validationMessages: [...analysis.validationErrors, ...analysis.warnings],
    website: row.website
  };
}

export { isValidEmailSyntax, applyFieldMapping, detectFieldMapping };
