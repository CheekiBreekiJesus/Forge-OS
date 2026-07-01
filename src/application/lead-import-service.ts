import type {
  ImportFieldMapping,
  ImportRow,
  ImportRowValues
} from "@/domain/import-types";
import type { Lead } from "@/domain/types";
import {
  analyzeImportRow,
  computeFileFingerprint,
  findFileDuplicateEmails,
  type ParsedImportRowInput
} from "@/features/leadops/import-deduplication";
import {
  mapRowsToInput,
  MAX_IMPORT_ROWS,
  parseImportFile,
  validateImportFile
} from "@/features/leadops/import-file-parser";
import {
  normalizePhone,
  normalizeWebsite
} from "@/features/leadops/import-normalization";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

export type ImportPreviewRow = ImportRow & { displayIndex: number };

export type ImportPreviewResult = {
  batchId: string;
  filename: string;
  fileType: "csv" | "xlsx";
  headers: string[];
  mapping: ImportFieldMapping;
  fileFingerprint: string;
  repeatImportWarning: boolean;
  rows: ImportPreviewRow[];
  counts: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    possibleDuplicateRows: number;
    missingEmailRows: number;
  };
};

export type ImportConfirmOptions = {
  attachStrongDuplicates?: boolean;
  approvePossibleDuplicates?: Set<number>;
  allowRepeatImport?: boolean;
};

export type ImportConfirmResult = {
  importedOrganizations: number;
  importedContacts: number;
  skippedRows: number;
  errors: string[];
};

function toRowValues(row: ParsedImportRowInput): ImportRowValues {
  return { ...row };
}

export async function buildImportPreview(
  repos: LocalRepositoryBundle,
  tenantId: string,
  file: File,
  mappingOverride?: ImportFieldMapping
): Promise<ImportPreviewResult> {
  const validationError = validateImportFile(file);
  if (validationError) {
    throw new PersistenceError("invalid_transition", validationError);
  }

  const parsed = await parseImportFile(file, mappingOverride);
  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    throw new PersistenceError("invalid_transition", "Import exceeds maximum row count.");
  }

  const mappedRows = mapRowsToInput(parsed.headers, parsed.rows, parsed.detectedMapping);
  const fingerprint = await computeFileFingerprint(JSON.stringify(mappedRows));
  const previousBatch = await repos.importBatches.findCompletedByFingerprint(tenantId, fingerprint);

  const [leads, contacts] = await Promise.all([
    repos.leads.list(tenantId),
    repos.leadContacts.list(tenantId)
  ]);
  const fileDuplicateEmails = findFileDuplicateEmails(mappedRows);
  const seenFileEmails = new Set<string>();

  const batch = await repos.importBatches.create(tenantId, {
    filename: file.name,
    fileType: parsed.fileType,
    source: "lead-import",
    fileFingerprint: fingerprint,
    mapping: parsed.detectedMapping,
    totalRows: mappedRows.length,
    validRows: 0,
    invalidRows: 0,
    duplicateRows: 0,
    possibleDuplicateRows: 0,
    missingEmailRows: 0,
    importedOrganizations: 0,
    importedContacts: 0,
    skippedRows: 0
  });

  const previewRows: ImportPreviewRow[] = mappedRows.map((row, index) => {
    const email = row.email.toLowerCase();
    const isRepeatInFile =
      email.length > 0 && seenFileEmails.has(email) && fileDuplicateEmails.has(email);
    if (email) seenFileEmails.add(email);

    let analysis = analyzeImportRow(row, { leads, contacts }, fileDuplicateEmails);
    if (isRepeatInFile && analysis.status === "valid") {
      analysis = {
        ...analysis,
        status: "duplicate",
        proposedAction: "skip_duplicate",
        warnings: [...analysis.warnings, "Duplicate email within import file."]
      };
    }
    return {
      id: `preview_${index}`,
      tenantId,
      importBatchId: batch.id,
      rowIndex: index,
      originalValues: toRowValues(row),
      normalizedValues: toRowValues(row),
      validationErrors: analysis.validationErrors,
      warnings: analysis.warnings,
      duplicateMatches: analysis.duplicateMatches,
      proposedAction: analysis.proposedAction,
      status: analysis.status,
      resultLeadId: null,
      resultContactId: null,
      createdAt: new Date().toISOString(),
      displayIndex: index + 1
    };
  });

  const storedRows = await repos.importRows.createMany(
    tenantId,
    previewRows.map(({ displayIndex: _displayIndex, id: _id, createdAt: _createdAt, ...row }) => row)
  );

  const rowsWithDisplay = storedRows.map((row) => ({
    ...row,
    displayIndex: row.rowIndex + 1
  }));

  const counts = summarizeRows(rowsWithDisplay);
  await repos.importBatches.update(tenantId, batch.id, {
    ...counts,
    status: "preview"
  });

  return {
    batchId: batch.id,
    filename: file.name,
    fileType: parsed.fileType,
    headers: parsed.headers,
    mapping: parsed.detectedMapping,
    fileFingerprint: fingerprint,
    repeatImportWarning: Boolean(previousBatch),
    rows: rowsWithDisplay,
    counts
  };
}

export async function confirmLeadImport(
  repos: LocalRepositoryBundle,
  tenantId: string,
  batchId: string,
  options: ImportConfirmOptions = {}
): Promise<ImportConfirmResult> {
  const batch = await repos.importBatches.getById(tenantId, batchId);
  if (!batch) {
    throw new PersistenceError("not_found", "Import batch not found.");
  }
  if (batch.status === "completed") {
    throw new PersistenceError("invalid_transition", "Import already completed.");
  }

  if (!options.allowRepeatImport) {
    const previous = await repos.importBatches.findCompletedByFingerprint(
      tenantId,
      batch.fileFingerprint
    );
    if (previous) {
      throw new PersistenceError(
        "invalid_transition",
        "This file was previously imported. Confirm re-import to continue."
      );
    }
  }

  const rows = await repos.importRows.listForBatch(tenantId, batchId);
  let importedOrganizations = 0;
  let importedContacts = 0;
  let skippedRows = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const result = await persistImportRow(repos, tenantId, batchId, row, options);
      if (result.skipped) skippedRows += 1;
      if (result.organizationCreated) importedOrganizations += 1;
      if (result.contactCreated) importedContacts += 1;
    } catch (error) {
      skippedRows += 1;
      errors.push(
        `Row ${row.rowIndex + 1}: ${error instanceof Error ? error.message : "Import failed"}`
      );
    }
  }

  await repos.importBatches.update(tenantId, batchId, {
    status: "completed",
    importedOrganizations,
    importedContacts,
    skippedRows,
    completedAt: new Date().toISOString()
  });

  await repos.activities.append(tenantId, {
    entityType: "lead",
    entityId: batchId,
    action: "lead_created",
    title: `Import completed: ${batch.filename}`,
    metadata: {
      importedOrganizations,
      importedContacts,
      skippedRows
    }
  });

  return { importedOrganizations, importedContacts, skippedRows, errors };
}

async function persistImportRow(
  repos: LocalRepositoryBundle,
  tenantId: string,
  batchId: string,
  row: ImportRow,
  options: ImportConfirmOptions
): Promise<{ skipped: boolean; organizationCreated: boolean; contactCreated: boolean }> {
  const values = row.normalizedValues;

  if (row.status === "invalid") {
    await repos.importRows.update(tenantId, row.id, {
      proposedAction: "skip_invalid",
      resultLeadId: null,
      resultContactId: null
    });
    return { skipped: true, organizationCreated: false, contactCreated: false };
  }

  if (row.status === "duplicate" && row.proposedAction === "skip_duplicate") {
    await repos.importRows.update(tenantId, row.id, { proposedAction: "skip_duplicate" });
    return { skipped: true, organizationCreated: false, contactCreated: false };
  }

  if (row.status === "possible_duplicate" && !options.approvePossibleDuplicates?.has(row.rowIndex)) {
    await repos.importRows.update(tenantId, row.id, { proposedAction: "review" });
    return { skipped: true, organizationCreated: false, contactCreated: false };
  }

  if (row.proposedAction === "attach_to_existing") {
    if (!options.attachStrongDuplicates) {
      return { skipped: true, organizationCreated: false, contactCreated: false };
    }
    const match = row.duplicateMatches.find((item) => item.kind === "organization_strong");
    if (!match) return { skipped: true, organizationCreated: false, contactCreated: false };
    await mergeLeadFields(repos, tenantId, match.existingLeadId, values);
    await repos.importRows.update(tenantId, row.id, {
      resultLeadId: match.existingLeadId,
      proposedAction: "attach_to_existing"
    });
    return { skipped: false, organizationCreated: false, contactCreated: false };
  }

  const website = normalizeWebsite(values.website);
  const phone = normalizePhone(values.phone);
  const lead = await repos.leads.create(tenantId, {
    companyName: values.companyName,
    contactName: values.contactName || values.companyName,
    email: values.email,
    phone: phone.display,
    website: website.display,
    location: values.region,
    country: values.country,
    industry: values.industry || "General",
    source: "file-import",
    sourceDatabase: values.sourceDatabase || batchId,
    sourceImportId: batchId,
    language: values.language || "pt-PT",
    notes: values.notes
  });

  let contactCreated = false;
  if (values.email) {
    await repos.leadContacts.create(tenantId, {
      leadId: lead.id,
      name: values.contactName || values.companyName,
      normalizedEmail: values.email.toLowerCase(),
      email: values.email,
      phone: phone.display,
      role: "",
      isPrimary: true,
      emailStatus: "valid_syntax",
      lastContactedAt: null
    });
    contactCreated = true;
  }

  await repos.importRows.update(tenantId, row.id, {
    resultLeadId: lead.id,
    proposedAction: contactCreated ? "create_contact" : "create_organization"
  });

  return { skipped: false, organizationCreated: true, contactCreated };
}

async function mergeLeadFields(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string,
  values: ImportRowValues
): Promise<Lead> {
  const existing = await repos.leads.getById(tenantId, leadId);
  if (!existing) {
    throw new PersistenceError("not_found", "Existing organization not found.");
  }
  const patch: Partial<Lead> = {};
  if (!existing.phone && values.phone) {
    const phone = normalizePhone(values.phone);
    patch.phone = phone.display;
    patch.normalizedPhone = phone.normalized;
  }
  if (!existing.website && values.website) {
    const website = normalizeWebsite(values.website);
    patch.website = website.display;
    patch.websiteDomain = website.domain;
  }
  if (!existing.location && values.region) patch.location = values.region;
  if (!existing.industry && values.industry) patch.industry = values.industry;
  if (!existing.notes && values.notes) patch.notes = values.notes;
  if (Object.keys(patch).length === 0) return existing;
  return repos.leads.update(tenantId, leadId, patch);
}

function summarizeRows(rows: ImportPreviewRow[]) {
  return {
    totalRows: rows.length,
    validRows: rows.filter((row) => row.status === "valid").length,
    invalidRows: rows.filter((row) => row.status === "invalid").length,
    duplicateRows: rows.filter((row) => row.status === "duplicate").length,
    possibleDuplicateRows: rows.filter((row) => row.status === "possible_duplicate").length,
    missingEmailRows: rows.filter((row) => row.status === "missing_email").length
  };
}

export { validateImportFile, parseImportFile, mapRowsToInput };
