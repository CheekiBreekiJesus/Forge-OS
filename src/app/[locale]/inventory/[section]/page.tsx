import { notFound } from "next/navigation";
import {
  InventoryProductWorkspaceShell,
  type InventoryProductSection
} from "@/components/inventory-product-workspace-shell";
import { isSupportedLocale, supportedLocales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const inventorySections = [
  "overview",
  "stock",
  "receipts",
  "transfers",
  "adjustments",
  "reservations",
  "barcodes",
  "labels",
  "imports"
] as const satisfies readonly InventoryProductSection[];

function isInventorySection(section: string): section is (typeof inventorySections)[number] {
  return inventorySections.includes(section as (typeof inventorySections)[number]);
}

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) =>
    inventorySections.map((section) => ({
      locale,
      section
    }))
  );
}

export default async function InventorySectionPage({
  params
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  if (!isSupportedLocale(locale)) notFound();
  if (!isInventorySection(section)) notFound();

  const dictionary = await getDictionary(locale);

  return (
    <InventoryProductWorkspaceShell
      dictionary={dictionary}
      locale={locale}
      mode="inventory"
      section={section}
    />
  );
}
