/**
 * Sanitized aggregate profiler for local lead files (never prints emails or row data).
 * Usage: node scripts/data-preparation/profile-lead-files.mjs <directory>
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EXTENSIONS = new Set([".csv", ".xlsx", ".xls"]);

function sanitizeLabel(filePath) {
  const base = path.basename(filePath);
  return base.replace(EMAIL_RE, "[email]").slice(0, 120);
}

function isValidEmailSyntax(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

function detectDelimiter(line) {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  if (semicolons > commas) return ";";
  return ",";
}

function parseCsvLine(line, delimiter) {
  const cells = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}

function profileCsv(filePath, buffer) {
  let text = buffer.toString("utf8");
  if (text.includes("\uFFFD")) {
    text = buffer.toString("latin1");
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const delimiter = lines[0] ? detectDelimiter(lines[0]) : ",";
  const headers = lines[0] ? parseCsvLine(lines[0], delimiter) : [];
  const rows = lines.slice(1).map((line) => parseCsvLine(line, delimiter));
  return { sheets: [{ name: "csv", headers, rows }], delimiter, encoding: text.includes("\uFFFD") ? "latin1-fallback" : "utf-8" };
}

function profileXlsx(filePath, buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: false, cellHTML: false });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
    const headers = (matrix[0] ?? []).map((c) => String(c ?? "").trim());
    const rows = matrix.slice(1).filter((row) => row.some((c) => String(c ?? "").trim()));
    return { name, headers, rows };
  });
  return { sheets, delimiter: null, encoding: "binary" };
}

function findEmailColumn(headers) {
  const normalized = headers.map((h) =>
    h
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .trim()
  );
  const aliases = ["email", "e-mail", "correio eletronico", "mail"];
  return normalized.findIndex((h) => aliases.some((a) => h.includes(a)));
}

function profileFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  const parsed = ext === ".csv" ? profileCsv(filePath, buffer) : profileXlsx(filePath, buffer);

  const sheetProfiles = parsed.sheets.map((sheet) => {
    const emailCol = findEmailColumn(sheet.headers);
    let missingEmail = 0;
    let invalidEmail = 0;
    let withEmail = 0;
    const emailsSeen = new Set();
    let possibleDupes = 0;
    const categories = {};

    for (const row of sheet.rows) {
      const emailRaw = emailCol >= 0 ? String(row[emailCol] ?? "").trim() : "";
      const emails = emailRaw.match(EMAIL_RE) ?? [];
      if (emails.length === 0) {
        missingEmail += 1;
      } else {
        withEmail += 1;
        const primary = emails[0].toLowerCase();
        if (!isValidEmailSyntax(primary)) invalidEmail += 1;
        if (emailsSeen.has(primary)) possibleDupes += 1;
        emailsSeen.add(primary);
      }
      const catCol = sheet.headers.findIndex((h) =>
        /categoria|category|tipo|setor|sector/i.test(h)
      );
      if (catCol >= 0) {
        const cat = String(row[catCol] ?? "").trim() || "(blank)";
        categories[cat] = (categories[cat] ?? 0) + 1;
      }
    }

    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.slice(0, 60), count }));

    return {
      sheetName: sheet.name,
      rowCount: sheet.rows.length,
      headerCount: sheet.headers.length,
      headers: sheet.headers.map((h) => h.slice(0, 80)),
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

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node profile-lead-files.mjs <directory-or-file>");
    process.exit(1);
  }
  const files = [];
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

  const profiles = files.map(profileFile);
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), fileCount: profiles.length, profiles }, null, 2));
}

main();
