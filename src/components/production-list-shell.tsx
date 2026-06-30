"use client";

import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import { usePersistenceLoading } from "@/persistence/provider";
import { useProductionOrders } from "@/persistence/hooks";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type ProductionListShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function ProductionListShell({ dictionary, locale }: ProductionListShellProps) {
  const copy = dictionary.productionModule;
  const loading = usePersistenceLoading();
  const { orders, loading: ordersLoading } = useProductionOrders();

  return (
    <AppFrame activeModule="production" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <Link
          className="text-sm font-semibold text-blue-300 hover:text-blue-200"
          href={getLocalizedModuleHref(locale, "dashboard")}
        >
          {dictionary.modulePage.backToDashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{copy.description}</p>
      </section>

      {loading || ordersLoading ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{copy.loading}</div>
      ) : orders.length === 0 ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{copy.empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">{copy.table.number}</th>
                <th className="px-3 py-2">{copy.table.customer}</th>
                <th className="px-3 py-2">{copy.table.product}</th>
                <th className="px-3 py-2">{copy.table.quantity}</th>
                <th className="px-3 py-2">{copy.table.machine}</th>
                <th className="px-3 py-2">{copy.table.status}</th>
                <th className="px-3 py-2">{copy.table.created}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr className="border-t border-slate-800" key={order.id}>
                  <td className="px-3 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-3 py-3">{order.customerName}</td>
                  <td className="px-3 py-3">{order.productName}</td>
                  <td className="px-3 py-3">{order.quantity.toLocaleString(locale)}</td>
                  <td className="px-3 py-3">{order.machineName}</td>
                  <td className="px-3 py-3">{copy.statuses[order.status]}</td>
                  <td className="px-3 py-3">
                    {new Date(order.createdAt).toLocaleString(locale)}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      className="text-blue-300 hover:text-blue-200"
                      href={`/${locale}/jobs/${order.id}`}
                    >
                      {copy.openJobCard}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppFrame>
  );
}
