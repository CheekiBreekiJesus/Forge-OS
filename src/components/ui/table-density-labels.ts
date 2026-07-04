import type { Locale } from "@/i18n/config";

export type TableDensityLabels = {
  showMore: string;
  showLess: string;
  showingCount: (visible: number, total: number) => string;
};

const LABELS: Record<Locale, TableDensityLabels> = {
  en: {
    showMore: "Show more",
    showLess: "Show less",
    showingCount: (visible, total) => `Showing ${visible} of ${total}`
  },
  "pt-PT": {
    showMore: "Mostrar mais",
    showLess: "Mostrar menos",
    showingCount: (visible, total) => `A mostrar ${visible} de ${total}`
  }
};

export function getTableDensityLabels(locale: Locale): TableDensityLabels {
  return LABELS[locale];
}
