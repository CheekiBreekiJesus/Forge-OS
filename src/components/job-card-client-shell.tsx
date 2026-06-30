"use client";

import { JobCardShell } from "@/components/job-card-shell";
import { toDemoProductionOrder } from "@/domain/mappers";
import { demoMachines, demoProducts } from "@/demo/seed";
import { createDemoJobCard } from "@/demo/workflow";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import { AppFrame, panelClass } from "@/components/app-frame";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductionOrder } from "@/domain/types";

type JobCardClientShellProps = {
  dictionary: Dictionary;
  locale: Locale;
  orderId: string;
};

export function JobCardClientShell({
  dictionary,
  locale,
  orderId
}: JobCardClientShellProps) {
  const loading = usePersistenceLoading();
  const { state } = usePersistence();
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.productionOrders.getById(state.tenantId, orderId).then((row) => {
      setOrder(row);
      setNotFound(!row);
    });
  }, [state, orderId]);

  if (loading) {
    return (
      <AppFrame activeModule="production" dictionary={dictionary} locale={locale}>
        <div className={`${panelClass} p-8 text-center text-slate-400`}>
          {dictionary.demoWorkflow.persistence.loading}
        </div>
      </AppFrame>
    );
  }

  if (notFound || !order) {
    return (
      <AppFrame activeModule="production" dictionary={dictionary} locale={locale}>
        <div className={`${panelClass} p-8 text-center`}>
          <p className="text-slate-300">{dictionary.jobCard.notFound}</p>
          <Link className="mt-4 inline-block text-blue-300" href={`/${locale}/production`}>
            {dictionary.jobCard.backToProduction}
          </Link>
        </div>
      </AppFrame>
    );
  }

  const demoOrder = toDemoProductionOrder(order);
  const product = demoProducts.find((p) => p.id === order.productId) ?? demoProducts[0];
  const machine = demoMachines.find((m) => m.id === order.machineId) ?? demoMachines[0];
  const jobCard = createDemoJobCard({ locale, order: demoOrder, product });

  return (
    <JobCardShell
      dictionary={dictionary}
      jobCard={jobCard}
      locale={locale}
      machine={machine}
      order={demoOrder}
    />
  );
}
