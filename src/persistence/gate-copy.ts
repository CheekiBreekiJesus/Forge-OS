import type { Locale } from "@/i18n/config";

export type PersistenceGateCopy = {
  loading: string;
  unavailable: string;
  activeDbName: string;
  recoverableHint: string;
  retry: string;
  resetDatabase: string;
  resetConfirmLabel: string;
  resetConfirmPhrase: string;
  resetDone: string;
};

const COPY: Record<Locale, PersistenceGateCopy> = {
  "pt-PT": {
    loading: "A carregar base de dados local…",
    unavailable: "Persistência local indisponível",
    activeDbName: "Base de dados IndexedDB ativa",
    recoverableHint:
      "Tente novamente primeiro. Se o arranque continuar a falhar, reinicie a base de dados local com a frase de confirmação abaixo. Isto remove os dados ForgeOS guardados no browser para esta demo.",
    retry: "Tentar arranque novamente",
    resetDatabase: "Reiniciar base de dados local",
    resetConfirmLabel: "Escreva a frase de confirmação para reiniciar os dados locais",
    resetConfirmPhrase: "RESET LOCAL DB",
    resetDone: "Reinício da base de dados local concluído. Os dados demo foram repovoados."
  },
  en: {
    loading: "Loading local database…",
    unavailable: "Local persistence unavailable",
    activeDbName: "Active IndexedDB database",
    recoverableHint:
      "Retry first. If startup still fails, reset the local database using the confirmation phrase below. This removes browser-stored ForgeOS data for this demo.",
    retry: "Retry startup",
    resetDatabase: "Reset local database",
    resetConfirmLabel: "Type the confirmation phrase to reset local data",
    resetConfirmPhrase: "RESET LOCAL DB",
    resetDone: "Local database reset completed. Demo data was reseeded."
  }
};

export function getPersistenceGateCopy(locale: Locale): PersistenceGateCopy {
  return COPY[locale];
}
