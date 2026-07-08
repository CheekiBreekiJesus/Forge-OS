export type OrganizationCategory =
  | "Municipality"
  | "Event Company"
  | "Association"
  | "Sports Club"
  | "Hospitality"
  | "Parish Council"
  | "Student Association"
  | string;

const MUNICIPALITY_PREFIXES = [
  /^munic[ií]pio de\s+/i,
  /^c[aâ]mara municipal de\s+/i
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function hasMunicipalityPrefix(organizationName: string): boolean {
  const trimmed = normalizeWhitespace(organizationName);
  return MUNICIPALITY_PREFIXES.some((pattern) => pattern.test(trimmed));
}

export function formatOrganizationDisplayName(
  organizationName: string,
  category: string,
  locale: string
): string {
  const name = normalizeWhitespace(organizationName);
  if (!name) return "";

  if (locale.startsWith("pt") && category === "Municipality") {
    if (hasMunicipalityPrefix(name)) return name;
    return `Município de ${name}`;
  }

  if (locale.startsWith("pt") && category === "Parish Council") {
    if (/^junta de freguesia de\s+/i.test(name)) return name;
    return `Junta de Freguesia de ${name}`;
  }

  return name;
}

export function formatSubjectOrganizationTarget(
  organizationDisplayName: string,
  category: string,
  locale: string
): string {
  const display = normalizeWhitespace(organizationDisplayName);
  if (!display) return "";

  if (locale.startsWith("pt") && category === "Municipality") {
    if (/^munic[ií]pio de\s+/i.test(display)) return `o ${display}`;
    if (/^c[aâ]mara municipal de\s+/i.test(display)) return `a ${display}`;
    return `o ${display}`;
  }

  if (locale.startsWith("pt") && category === "Parish Council") {
    if (/^junta de freguesia de\s+/i.test(display)) return `a ${display}`;
    return `a ${display}`;
  }

  return display;
}
