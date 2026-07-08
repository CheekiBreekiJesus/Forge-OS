const PT_CATEGORY_LABELS: Record<string, string> = {
  Municipality: "Município",
  "Event Company": "Empresa de eventos",
  Association: "Associação",
  "Sports Club": "Clube desportivo",
  Hospitality: "Restauração e hotelaria",
  "Parish Council": "Junta de Freguesia",
  "Student Association": "Associação de estudantes"
};

const EN_CATEGORY_LABELS: Record<string, string> = {
  Municipality: "Municipality",
  "Event Company": "Event company",
  Association: "Association",
  "Sports Club": "Sports club",
  Hospitality: "Hospitality",
  "Parish Council": "Parish council",
  "Student Association": "Student association"
};

export function localizeCategoryLabel(category: string, locale: string): string {
  const code = category.trim();
  if (!code) return "";
  if (locale.startsWith("pt")) {
    return PT_CATEGORY_LABELS[code] ?? code;
  }
  return EN_CATEGORY_LABELS[code] ?? code;
}

export function isKnownCategoryCode(category: string): boolean {
  return category.trim() in PT_CATEGORY_LABELS;
}
