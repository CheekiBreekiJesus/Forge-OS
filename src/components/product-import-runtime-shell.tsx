"use client";

import { ProductImportApiShell } from "@/components/product-import-api-shell";
import { ProductImportShell } from "@/components/product-import-shell";
import { readClientInventoryRuntimeMode } from "@/lib/inventory/runtime";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type ProductImportRuntimeShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function ProductImportRuntimeShell({ dictionary, locale }: ProductImportRuntimeShellProps) {
  const runtimeMode = readClientInventoryRuntimeMode();
  if (runtimeMode === "supabase") {
    return <ProductImportApiShell dictionary={dictionary} locale={locale} />;
  }
  return <ProductImportShell dictionary={dictionary} locale={locale} />;
}
