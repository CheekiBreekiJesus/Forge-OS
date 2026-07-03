import type {
  CreateImportMappingProfileInput,
  ImportFieldMapping,
  ImportMappingProfile,
  ImportNormalizationOptions
} from "@/domain/import-types";

export const DEFAULT_NORMALIZATION_OPTIONS: ImportNormalizationOptions = {
  preserveLeadingZeros: true,
  defaultCountry: "Portugal",
  defaultLanguage: "pt-PT",
  appendAdditionalEmailsToNotes: true
};

export const BUILTIN_IMPORT_MAPPING_PROFILES: Array<
  Omit<CreateImportMappingProfileInput, "ignoredColumns" | "normalizationOptions"> & {
    headerMappings: ImportFieldMapping;
    ignoredColumns?: string[];
  }
> = [
  {
    label: "Event Companies",
    sourceLabel: "events",
    headerMappings: {
      companyName: "Name",
      email: "Email",
      phone: "Phone",
      website: "Website",
      region: "City",
      country: "Country",
      industry: "Category",
      notes: "Notes"
    },
    defaultCategory: "Events",
    defaultCountry: "Portugal",
    defaultSource: "Event Companies"
  },
  {
    label: "Municipalities",
    sourceLabel: "municipalities",
    headerMappings: {
      companyName: "Name",
      email: "Email",
      phone: "Telefono",
      website: "Website",
      region: "Ciudad",
      industry: "Tipo"
    },
    defaultCategory: "Municipality",
    defaultCountry: "Portugal",
    defaultSource: "Municipalities"
  },
  {
    label: "Associations",
    sourceLabel: "associations",
    headerMappings: {
      companyName: "Nombre",
      email: "Email",
      phone: "Telefono",
      website: "Website",
      region: "Ciudad",
      industry: "Tipo"
    },
    defaultCategory: "Association",
    defaultCountry: "Portugal",
    defaultSource: "Associations"
  },
  {
    label: "Sports Clubs",
    sourceLabel: "sports-clubs",
    headerMappings: {
      companyName: "Name",
      email: "Contact Email",
      phone: "Contact Phone Number",
      website: "Website",
      region: "City",
      country: "Country",
      industry: "Business Category",
      notes: "Notes"
    },
    defaultCategory: "Sports Club",
    defaultCountry: "Portugal",
    defaultSource: "Sports Clubs"
  },
  {
    label: "Hospitality",
    sourceLabel: "hospitality",
    headerMappings: {
      companyName: "Nombre",
      email: "Email",
      phone: "Telefono",
      website: "Website",
      region: "Ciudad",
      industry: "Tipo"
    },
    defaultCategory: "Hospitality",
    defaultCountry: "Portugal",
    defaultSource: "Hospitality"
  },
  {
    label: "Generic Portuguese Leads",
    sourceLabel: "generic-pt",
    headerMappings: {
      companyName: "Nome da Entidade",
      email: "Email",
      phone: "Telefone",
      website: "Website",
      region: "Concelho",
      industry: "Tipo de Entidade",
      sourceDatabase: "Origem"
    },
    defaultCategory: "General",
    defaultCountry: "Portugal",
    defaultSource: "Generic Portuguese Leads"
  }
];

export function applyMappingProfileDefaults(
  mapping: ImportFieldMapping,
  profile: Pick<
    ImportMappingProfile,
    "headerMappings" | "defaultCategory" | "defaultCountry" | "defaultSource"
  >
): ImportFieldMapping {
  return {
    ...profile.headerMappings,
    ...mapping
  };
}

export function mergeProfileOntoRowDefaults(
  row: import("@/features/leadops/import-deduplication").ParsedImportRowInput,
  profile: Pick<
    ImportMappingProfile,
    "defaultCategory" | "defaultCountry" | "defaultSource" | "normalizationOptions"
  >
): import("@/features/leadops/import-deduplication").ParsedImportRowInput {
  return {
    ...row,
    country: row.country || profile.defaultCountry || profile.normalizationOptions.defaultCountry,
    industry: row.industry || profile.defaultCategory,
    sourceDatabase: row.sourceDatabase || profile.defaultSource,
    language: row.language || profile.normalizationOptions.defaultLanguage
  };
}
