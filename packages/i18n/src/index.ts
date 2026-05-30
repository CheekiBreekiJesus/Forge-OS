export type SupportedLocale = "pt-PT" | "en" | "es-ES";

export const DEFAULT_LOCALE: SupportedLocale = "pt-PT";
export const GLOBAL_DEFAULT_LOCALE: SupportedLocale = "en";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["pt-PT", "en", "es-ES"];

export const LOCALE_COOKIE = "FORGEOS_LOCALE";

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function resolveLocale(
  preferred?: string | null,
  tenantDefault?: SupportedLocale
): SupportedLocale {
  if (preferred && isSupportedLocale(preferred)) return preferred;
  if (tenantDefault) return tenantDefault;
  return DEFAULT_LOCALE;
}

/** Format currency per locale (EUR default for JH Gomes). */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale,
  currency = "EUR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format percentage with sign for deltas. */
export function formatPercent(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/** Format relative change label e.g. "+6.4% vs last week" — caller supplies translated suffix. */
export function formatDeltaPercent(
  value: number,
  locale: SupportedLocale
): string {
  const formatted = new Intl.NumberFormat(locale, {
    signDisplay: "exceptZero",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted}%`;
}

export function formatNumber(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(
  date: Date,
  locale: SupportedLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
