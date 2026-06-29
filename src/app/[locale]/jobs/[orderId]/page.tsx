import { notFound } from "next/navigation";
import { JobCardShell } from "@/components/job-card-shell";
import {
  demoMachines,
  demoProductionOrders,
  demoProducts
} from "@/demo/seed";
import { createDemoJobCard } from "@/demo/workflow";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return ["pt-PT", "en"].flatMap((locale) =>
    demoProductionOrders.map((order) => ({
      locale,
      orderId: order.id
    }))
  );
}

export default async function JobCardPage({
  params
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const order = demoProductionOrders.find((item) => item.id === orderId);

  if (!order) {
    notFound();
  }

  const product = demoProducts.find((item) => item.id === order.productId);
  const machine = demoMachines.find((item) => item.id === order.machineId);

  if (!product || !machine) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const jobCard = createDemoJobCard({ locale, order, product });

  return (
    <JobCardShell
      dictionary={dictionary}
      jobCard={jobCard}
      locale={locale}
      machine={machine}
      order={order}
    />
  );
}
