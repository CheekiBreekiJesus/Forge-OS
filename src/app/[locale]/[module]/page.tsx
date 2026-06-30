import { notFound } from "next/navigation";
import { ModulePageShell } from "@/components/module-page-shell";
import { CustomersShell } from "@/components/customers-shell";
import { InventoryShell } from "@/components/inventory-shell";
import { MachinesShell } from "@/components/machines-shell";
import { ProductionListShell } from "@/components/production-list-shell";
import { ProductCatalogShell } from "@/components/product-catalog-shell";
import { QuotationsShell } from "@/components/quotations-shell";
import { SettingsShell } from "@/components/settings-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getModuleKeyFromSlug,
  moduleRoutes,
  routedModuleKeys
} from "@/modules/config";

export function generateStaticParams() {
  return ["pt-PT", "en"].flatMap((locale) =>
    routedModuleKeys.map((moduleKey) => ({
      locale,
      module: moduleRoutes[moduleKey]
    }))
  );
}

export default async function ModulePage({
  params
}: {
  params: Promise<{ locale: string; module: string }>;
}) {
  const { locale, module } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const moduleKey = getModuleKeyFromSlug(module);

  if (!moduleKey || moduleKey === "dashboard") {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  if (moduleKey === "products") {
    return <ProductCatalogShell dictionary={dictionary} locale={locale} />;
  }

  if (moduleKey === "customers") {
    return <CustomersShell dictionary={dictionary} locale={locale} />;
  }

  if (moduleKey === "production") {
    return <ProductionListShell dictionary={dictionary} locale={locale} />;
  }

  if (moduleKey === "orders") {
    return <QuotationsShell dictionary={dictionary} locale={locale} />;
  }

  if (moduleKey === "machines") {
    return <MachinesShell dictionary={dictionary} locale={locale} />;
  }

  if (moduleKey === "inventory") {
    return <InventoryShell dictionary={dictionary} locale={locale} />;
  }

  if (moduleKey === "settings") {
    return <SettingsShell dictionary={dictionary} locale={locale} />;
  }

  return (
    <ModulePageShell
      dictionary={dictionary}
      locale={locale}
      moduleKey={moduleKey}
    />
  );
}
