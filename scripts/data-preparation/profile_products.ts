/**
 * Local-only product file profiler. Output is gitignored.
 * Usage: npx tsx scripts/data-preparation/profile_products.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseSpreadsheet } from "../../src/features/product-import/parse-spreadsheet";
import { countDuplicateBarcodes, countDuplicateReferences } from "../../src/features/product-import/duplicate-conflict";
import { normalizeMappedValues } from "../../src/features/product-import/normalize";
import { suggestFieldMapping, applyColumnMapping } from "../../src/features/product-import/field-mapping";

const PRODUCTS_DIR = resolve("C:/Users/J35U5/Desktop/JH Gomes/Databases/Products");
const OUTPUT = resolve(process.cwd(), "scripts/data-preparation/reports/product-private-profile.json");

const TARGETS = [
  "artigos csv.csv",
  "artigos xls.xls",
  "ForgeOS_Product_Catalog_Draft_2026-07-01.xlsx"
];

async function profileFile(name: string) {
  const path = resolve(PRODUCTS_DIR, name);
  const buffer = readFileSync(path);
  const parsed = await parseSpreadsheet({
    data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    filename: name
  });

  return parsed.worksheets.map((ws) => {
    const mappings = suggestFieldMapping(ws.headers);
    const normalizedRows = ws.rows.map((row) => {
      const mapped = applyColumnMapping(ws.headers, row, mappings);
      return normalizeMappedValues(mapped).values;
    });
    const populated: Record<string, number> = {};
    for (const header of ws.headers) {
      const count = ws.rows.filter((row) => {
        const idx = ws.headers.indexOf(header);
        return (row[idx] ?? "").trim().length > 0;
      }).length;
      populated[header.replace(/[^\w]/g, "_").toLowerCase()] = ws.rows.length
        ? Math.round((count / ws.rows.length) * 100)
        : 0;
    }
    return {
      columnHeaders: ws.headers.map((h) => h.replace(/[^\w\s]/g, "").trim().toLowerCase().replace(/\s+/g, "_")),
      duplicateBarcodeCount: countDuplicateBarcodes(normalizedRows),
      duplicateReferenceCount: countDuplicateReferences(normalizedRows),
      error: undefined as string | undefined,
      format: parsed.format,
      formulaWarnings: ws.formulaWarnings,
      hidden: ws.hidden,
      populatedColumnPercentages: populated,
      rowCount: ws.rows.length,
      sourceLabel: `${name} / ${ws.name}`,
      worksheet: ws.name
    };
  });
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    sources: (await Promise.all(TARGETS.map((name) => profileFileSafe(name)))).flat()
  };
  const dir = resolve(process.cwd(), "scripts/data-preparation/reports");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Wrote ${OUTPUT}`);
}

async function profileFileSafe(name: string): Promise<Awaited<ReturnType<typeof profileFile>>> {
  try {
    return await profileFile(name);
  } catch (error) {
    return [
      {
        columnHeaders: [],
        duplicateBarcodeCount: 0,
        duplicateReferenceCount: 0,
        error: String(error),
        format: "csv" as const,
        formulaWarnings: 0,
        hidden: false,
        populatedColumnPercentages: {},
        rowCount: 0,
        sourceLabel: name,
        worksheet: "error"
      }
    ];
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
