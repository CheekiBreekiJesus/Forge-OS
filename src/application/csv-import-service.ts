import type { ParsedLeadImportRow } from "@/features/leadops/import";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

const MAX_CSV_ROWS = 5000;
const MAX_CSV_BYTES = 2 * 1024 * 1024;

export function validateCsvFile(file: File): string | null {
  if (file.size > MAX_CSV_BYTES) {
    return "File exceeds 2 MB limit.";
  }
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    return "Only CSV files are supported.";
  }
  return null;
}

export async function persistImportedLeads(
  repos: LocalRepositoryBundle,
  tenantId: string,
  rows: ParsedLeadImportRow[],
  sourceDatabase: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  if (rows.length > MAX_CSV_ROWS) {
    throw new PersistenceError("invalid_transition", "Import exceeds maximum row count.");
  }

  const validRows = rows.filter((row) => row.status === "valid");
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of validRows) {
    try {
      await repos.leads.create(tenantId, {
        companyName: row.companyName,
        contactName: row.contactName || row.companyName,
        email: row.email,
        phone: row.phone,
        website: row.website || null,
        location: row.region,
        industry: row.industry || "General",
        source: "csv-import",
        sourceDatabase: row.sourceDatabase || sourceDatabase,
        language: row.language || "pt-PT",
        notes: row.notes
      });
      imported += 1;

      await repos.activities.append(tenantId, {
        entityType: "lead",
        entityId: row.email,
        action: "lead_created",
        title: `Imported lead: ${row.companyName}`,
        metadata: { source: "csv-import", sourceDatabase }
      });
    } catch (error) {
      if (error instanceof PersistenceError && error.code === "duplicate") {
        skipped += 1;
      } else {
        errors.push(
          `${row.email}: ${error instanceof Error ? error.message : "Import failed"}`
        );
      }
    }
  }

  return { imported, skipped, errors };
}
