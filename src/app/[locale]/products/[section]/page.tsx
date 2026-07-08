import { notFound } from "next/navigation";
import {
  InventoryProductWorkspaceShell,
  type InventoryProductSection
} from "@/components/inventory-product-workspace-shell";
import { isSupportedLocale, supportedLocales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const productSections = [
  "overview",
  "products",
  "items",
  "variants",
  "references",
  "packaging",
  "barcodes",
  "labels",
  "imports"
] as const satisfies readonly InventoryProductSection[];

function isProductSection(section: string): section is (typeof productSections)[number] {
  return productSections.includes(section as (typeof productSections)[number]);
}

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) =>
    productSections.map((section) => ({
      locale,
      section
    }))
  );
}

export default async function ProductSectionPage({
  params
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  if (!isSupportedLocale(locale)) notFound();
  if (!isProductSection(section)) notFound();

  const dictionary = await getDictionary(locale);

  return (
    <InventoryProductWorkspaceShell
      dictionary={dictionary}
      locale={locale}
      mode="products"
      section={section}
    />
  );
}
