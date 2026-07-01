import type { ImportFieldKey, ImportFieldMapping } from "@/domain/import-types";
import { collapseWhitespace } from "@/features/leadops/import-normalization";

export const IMPORT_FIELD_KEYS: ImportFieldKey[] = [
  "companyName",
  "contactName",
  "email",
  "phone",
  "website",
  "region",
  "country",
  "industry",
  "notes",
  "sourceDatabase",
  "status",
  "language"
];

const fieldAliases: Record<ImportFieldKey, string[]> = {
  companyName: [
    "empresa",
    "organizacao",
    "organização",
    "nome da empresa",
    "nome empresa",
    "company",
    "company name",
    "organization",
    "name"
  ],
  contactName: [
    "pessoa de contacto",
    "contacto principal",
    "contact person",
    "contact name",
    "contact",
    "contacto",
    "nome",
    "pessoa contacto"
  ],
  email: ["email", "e-mail", "correio eletronico", "correio eletrónico", "mail"],
  phone: ["telefone", "telemovel", "telemóvel", "phone", "mobile"],
  website: ["website", "site", "pagina web", "página web", "url"],
  region: ["regiao", "região", "distrito", "concelho", "region", "district", "localidade", "cidade"],
  country: ["pais", "país", "country"],
  industry: ["categoria", "tipo", "category", "organization type", "industry", "setor", "sector"],
  notes: ["notas", "observacoes", "observações", "notes", "comments"],
  sourceDatabase: ["fonte", "origem", "source", "database", "source database", "base de dados"],
  status: ["estado", "status"],
  language: ["language", "idioma", "locale"]
};

function normalizeHeader(value: string): string {
  return collapseWhitespace(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function detectFieldMapping(headers: string[]): ImportFieldMapping {
  const normalizedHeaders = headers.map(normalizeHeader);
  const mapping: ImportFieldMapping = {};
  const usedHeaders = new Set<string>();

  for (const field of IMPORT_FIELD_KEYS) {
    const aliases = fieldAliases[field];
    const index = normalizedHeaders.findIndex(
      (header, idx) => !usedHeaders.has(headers[idx]) && aliases.includes(header)
    );
    if (index >= 0) {
      mapping[field] = headers[index];
      usedHeaders.add(headers[index]);
    }
  }

  return mapping;
}

export function applyFieldMapping(
  headers: string[],
  row: string[],
  mapping: ImportFieldMapping
): Record<ImportFieldKey, string> {
  const result = {} as Record<ImportFieldKey, string>;
  for (const field of IMPORT_FIELD_KEYS) {
    const header = mapping[field];
    if (!header) {
      result[field] = "";
      continue;
    }
    const index = headers.indexOf(header);
    result[field] = index >= 0 ? (row[index] ?? "") : "";
  }
  return result;
}

export function mergeFieldMapping(
  detected: ImportFieldMapping,
  overrides: ImportFieldMapping
): ImportFieldMapping {
  return { ...detected, ...overrides };
}

export { fieldAliases, normalizeHeader };
