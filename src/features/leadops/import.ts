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

const fieldAliases = {
  companyName: ["company name", "company", "empresa", "nome empresa", "nome da empresa"],
  contactName: ["contact name", "contact", "nome", "pessoa contacto", "contacto"],
  email: ["email", "e-mail", "mail"],
  facebookUrl: ["facebook", "facebook url", "facebook_url", "fb"],
  industry: ["industry", "category", "categoria", "setor", "sector"],
  language: ["language", "idioma", "locale"],
  notes: ["notes", "notas", "observacoes", "observações"],
  phone: ["phone", "telefone", "telemovel", "telemóvel"],
  region: ["region", "municipality", "localidade", "regiao", "região", "cidade"],
  sourceDatabase: ["source database", "source", "origem", "base dados", "base de dados"],
  website: ["website", "site", "url"]
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseLeadCsv(csv: string): LeadImportResult {
  const rows = parseCsv(csv);
  const headers = rows[0]?.map(normalizeHeader) ?? [];
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim().length > 0));
  const mappedRows = dataRows.map((row) => mapImportRow(headers, row));
  const duplicateEmails = findDuplicateEmails(mappedRows);
  const duplicateEmailSet = new Set(duplicateEmails);
  const classifiedRows = mappedRows.map((row) =>
    duplicateEmailSet.has(row.email.toLowerCase()) && row.status === "valid"
      ? {
          ...row,
          status: "review" as const,
          validationMessages: [...row.validationMessages, "Duplicate email detected."]
        }
      : row
  );

  return {
    duplicateEmails,
    headers,
    invalidRows: classifiedRows.filter((row) => row.status === "invalid"),
    reviewRows: classifiedRows.filter((row) => row.status === "review"),
    validRows: classifiedRows.filter((row) => row.status === "valid")
  };
}

function mapImportRow(headers: string[], row: string[]): ParsedLeadImportRow {
  const get = (field: keyof typeof fieldAliases) => {
    const aliases = fieldAliases[field];
    const index = headers.findIndex((header) => aliases.includes(header as never));
    return index >= 0 ? sanitizeCell(row[index] ?? "") : "";
  };
  const companyName = get("companyName");
  const email = get("email");
  const messages: string[] = [];

  if (!companyName) {
    messages.push("Company name is required.");
  }

  if (!email || !emailPattern.test(email)) {
    messages.push("Valid email is required.");
  }

  const status: LeadImportRowStatus =
    messages.length > 0 ? "invalid" : get("industry") && get("region") ? "valid" : "review";

  return {
    companyName,
    contactName: get("contactName"),
    email,
    facebookUrl: get("facebookUrl"),
    industry: get("industry"),
    language: get("language") || "pt-PT",
    notes: get("notes"),
    phone: get("phone"),
    region: get("region"),
    sourceDatabase: get("sourceDatabase"),
    status,
    validationMessages: status === "review" ? [...messages, "Missing enrichment fields."] : messages,
    website: get("website")
  };
}

function findDuplicateEmails(rows: ParsedLeadImportRow[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of rows) {
    const email = row.email.toLowerCase();

    if (!email || !emailPattern.test(email)) {
      continue;
    }

    if (seen.has(email)) {
      duplicates.add(email);
    }

    seen.add(email);
  }

  return [...duplicates].sort();
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      currentCell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  return rows;
}

function normalizeHeader(value: string): string {
  return sanitizeCell(value).toLowerCase();
}

function sanitizeCell(value: string): string {
  return value.replace(/\p{C}/gu, "").trim();
}
