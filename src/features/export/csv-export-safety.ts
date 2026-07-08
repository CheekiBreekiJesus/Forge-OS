const FORMULA_PREFIX = /^[=+\-@]/;

export function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  const prefixed = FORMULA_PREFIX.test(raw.trim()) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(prefixed)) {
    return `"${prefixed.replace(/"/g, '""')}"`;
  }
  return prefixed;
}

export function buildCsvRow(values: Array<string | number | null | undefined>): string {
  return values.map((value) => escapeCsvCell(value)).join(",");
}
