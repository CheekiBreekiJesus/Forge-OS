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
    "nome da entidade",
    "entidade",
    "company",
    "company name",
    "organization",
    "name",
    "nombre",
    "nome",
    "instituicao",
    "instituição",
    "associacao",
    "associação",
    "clube",
    "municipio",
    "município",
    "municipality",
    "freguesia"
  ],
  contactName: [
    "pessoa de contacto",
    "contacto principal",
    "contact person",
    "contact name",
    "contact",
    "contacto",
    "pessoa contacto",
    "responsavel",
    "responsável",
    "gerente",
    "manager"
  ],
  email: [
    "email",
    "e-mail",
    "correio eletronico",
    "correio eletrónico",
    "mail",
    "contact email",
    "e mail",
    "endereco de email",
    "endereço de email"
  ],
  phone: [
    "telefone",
    "telemovel",
    "telemóvel",
    "phone",
    "mobile",
    "telefono",
    "contact phone",
    "contact phone number",
    "numero de telefone",
    "número de telefone",
    "tel"
  ],
  website: [
    "website",
    "site",
    "pagina web",
    "página web",
    "url",
    "link",
    "web",
    "facebook",
    "pagina facebook",
    "página facebook"
  ],
  region: [
    "regiao",
    "região",
    "distrito",
    "concelho",
    "region",
    "district",
    "localidade",
    "cidade",
    "city",
    "ciudad",
    "municipio",
    "município",
    "concelho/municipio",
    "endereco",
    "endereço",
    "address",
    "location"
  ],
  country: ["pais", "país", "country", "nacao", "nação"],
  industry: [
    "categoria",
    "tipo",
    "category",
    "organization type",
    "industry",
    "setor",
    "sector",
    "business category",
    "company sector",
    "type",
    "tipo de entidade",
    "business category"
  ],
  notes: ["notas", "observacoes", "observações", "notes", "comments", "comentarios", "comentários"],
  sourceDatabase: [
    "fonte",
    "origem",
    "source",
    "database",
    "source database",
    "base de dados",
    "source file",
    "ficheiro"
  ],
  status: ["estado", "status", "situacao", "situação"],
  language: ["language", "idioma", "locale", "lingua", "língua"]
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
