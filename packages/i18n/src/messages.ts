import en from "../messages/en.json";
import esES from "../messages/es-ES.json";
import ptPT from "../messages/pt-PT.json";
import type { SupportedLocale } from "./index";

export type Messages = typeof en;

const catalogs: Record<SupportedLocale, Messages> = {
  en,
  "pt-PT": ptPT,
  "es-ES": esES,
};

export function getMessages(locale: SupportedLocale): Messages {
  return catalogs[locale] ?? catalogs.en;
}
