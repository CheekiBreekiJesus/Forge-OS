"use client";

import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import { toQuoteSummary } from "@/domain/mappers";
import { useCustomers, useQuotes } from "@/persistence/hooks";
import { usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type QuotationsShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function QuotationsShell({ dictionary, locale }: QuotationsShellProps) {
  const copy = dictionary.quotationsModule;
  const loading = usePersistenceLoading();
  const { quotes, loading: quotesLoading } = useQuotes();
  const { customers } = useCustomers();
  const summaries = quotes.map((q) => toQuoteSummary(q, customers));

  return (
    <AppFrame activeModule="orders" dictionary={dictionary} locale={locale}>
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

      {loading || quotesLoading ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{copy.loading}</div>
      ) : summaries.length === 0 ? (
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
                <th className="px-3 py-2">{copy.table.status}</th>
                <th className="px-3 py-2">{copy.table.total}</th>
                <th className="px-3 py-2">{copy.table.created}</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((quote) => (
                <tr className="border-t border-slate-800" key={quote.id}>
                  <td className="px-3 py-3 font-medium">{quote.quoteNumber}</td>
                  <td className="px-3 py-3">{quote.customerName}</td>
                  <td className="px-3 py-3">{quote.productName}</td>
                  <td className="px-3 py-3">{quote.quantity.toLocaleString(locale)}</td>
                  <td className="px-3 py-3">{copy.statuses[quote.status]}</td>
                  <td className="px-3 py-3">
                    {new Intl.NumberFormat(locale, {
                      currency: "EUR",
                      style: "currency"
                    }).format(quote.total)}
                  </td>
                  <td className="px-3 py-3">
                    {new Date(quote.createdAt).toLocaleString(locale)}
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
