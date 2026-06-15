export const supportedLocales = ["pt-PT", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "pt-PT";

export const futureLocales = ["es"] as const;

export function isSupportedLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale as Locale);
}
