/**
 * Sanitized aggregate profiler for local lead files (never prints emails or row data).
 * Usage: npx tsx scripts/data-preparation/profile-lead-files.ts <directory>
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  extractSheetMatrix,
  loadSpreadsheetWorkbook
} from "../../src/features/shared/spreadsheet/spreadsheet-parser";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EXTENSIONS = new Set([".csv", ".xlsx"]);
const LEGACY_XLS = ".xls";

function sanitizeLabel(filePath: string): string {
  const base = path.basename(filePath);
  return base.replace(EMAIL_RE, "[email]").slice(0, 120);
}

function isValidEmailSyntax(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

function detectDelimiter(line: string): "," | ";" {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  if (semicolons > commas) return ";";
  return ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }
    if (character === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (character === delimiter && !inQuotes) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += character;
  }
  cells.push(cell.trim());
  return cells;
}

function profileCsv(buffer: Buffer) {
  let text = buffer.toString("utf8");
  if (text.includes("\uFFFD")) {
    text = buffer.toString("latin1");
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const delimiter = lines[0] ? detectDelimiter(lines[0]) : ",";
  const headers = lines[0] ? parseCsvLine(lines[0], delimiter) : [];
  const rows = lines.slice(1).map((line) => parseCsvLine(line, delimiter));
  return { sheets: [{ name: "csv", headers, rows }], delimiter, encoding: text.includes("\uFFFD") ? "latin1-fallback" : "utf-8" };
}

async function profileXlsx(buffer: ArrayBuffer) {
  const workbook = await loadSpreadsheetWorkbook(buffer);
  const sheets = workbook.sheetNames.map((name) => {
    const { matrix } = extractSheetMatrix(workbook, name);
    const headers = (matrix[0] ?? []).map((cell) => cell.trim());
    const rows = matrix.slice(1).filter((row) => row.some((cell) => cell.trim().length > 0));
    return { name, headers, rows };
  });
  return { sheets, delimiter: null, encoding: "binary" };
}

function findEmailColumn(headers: string[]): number {
  const normalized = headers.map((header) =>
    header
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .trim()
  );
  const aliases = ["email", "e-mail", "correio eletronico", "mail"];
  return normalized.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

async function profileFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === LEGACY_XLS) {
    return {
      sourceLabel: sanitizeLabel(filePath),
      format: "xls",
      skipped: true,
      reason: "Legacy XLS is not supported by the ForgeOS spreadsheet adapter."
    };
  }

  const buffer = fs.readFileSync(filePath);
  const parsed =
    ext === ".csv"
      ? profileCsv(buffer)
      : await profileXlsx(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);

  const sheetProfiles = parsed.sheets.map((sheet) => {
    const emailCol = findEmailColumn(sheet.headers);
    let missingEmail = 0;
    let invalidEmail = 0;
    let withEmail = 0;
    const emailsSeen = new Set<string>();
    let possibleDupes = 0;
    const categories: Record<string, number> = {};

    for (const row of sheet.rows) {
      const emailRaw = emailCol >= 0 ? String(row[emailCol] ?? "").trim() : "";
      const emails = emailRaw.match(EMAIL_RE) ?? [];
      if (emails.length === 0) {
        missingEmail += 1;
      } else {
        withEmail += 1;
        const primary = emails[0]?.toLowerCase() ?? "";
        if (primary && !isValidEmailSyntax(primary)) invalidEmail += 1;
        if (primary && emailsSeen.has(primary)) possibleDupes += 1;
        if (primary) emailsSeen.add(primary);
      }
      const categoryColumn = sheet.headers.findIndex((header) =>
        /categoria|category|tipo|setor|sector/i.test(header)
      );
      if (categoryColumn >= 0) {
        const category = String(row[categoryColumn] ?? "").trim() || "(blank)";
        categories[category] = (categories[category] ?? 0) + 1;
      }
    }

    const topCategories = Object.entries(categories)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.slice(0, 60), count }));

    return {
      sheetName: sheet.name,
      rowCount: sheet.rows.length,
      headerCount: sheet.headers.length,
      headers: sheet.headers.map((header) => header.slice(0, 80)),
      missingEmailCount: missingEmail,
      invalidEmailCount: invalidEmail,
      rowsWithEmail: withEmail,
      possibleDuplicateEmails: possibleDupes,
      categoryDistribution: topCategories,
      blankRowSkipped: 0
    };
  });

  return {
    sourceLabel: sanitizeLabel(filePath),
    format: ext.slice(1),
    fileSizeBytes: buffer.length,
    sheetCount: sheetProfiles.length,
    csvDelimiter: parsed.delimiter,
    encodingHint: parsed.encoding,
    sheets: sheetProfiles
  };
}

async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: npx tsx scripts/data-preparation/profile-lead-files.ts <directory-or-file>");
    process.exit(1);
  }

  const files: string[] = [];
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      const full = path.join(target, entry.name);
      if (entry.isDirectory()) {
        for (const sub of fs.readdirSync(full)) {
          const subPath = path.join(full, sub);
          if (fs.statSync(subPath).isFile() && EXTENSIONS.has(path.extname(sub).toLowerCase())) {
            files.push(subPath);
          }
        }
      } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(full);
      }
    }
  } else {
    files.push(target);
  }

  const profiles = [];
  for (const filePath of files) {
    profiles.push(await profileFile(filePath));
  }

  console.log(
    JSON.stringify({ generatedAt: new Date().toISOString(), fileCount: profiles.length, profiles }, null, 2)
  );
}

void main();
