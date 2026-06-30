"use client";

import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import { toCustomerSummary } from "@/domain/mappers";
import {
  useCustomers as usePersistedCustomers,
  useTenantLeads
} from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";
import type { Opportunity } from "@/domain/types";
import { useEffect, useState } from "react";

type CustomersShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function CustomersShell({ dictionary, locale }: CustomersShellProps) {
  const copy = dictionary.customersModule;
  const loading = usePersistenceLoading();
  const { customers, loading: customersLoading } = usePersistedCustomers();
  const { leads } = useTenantLeads();
  const { state } = usePersistence();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.opportunities.list(state.tenantId).then(setOpportunities);
  }, [state, customers]);

  const summaries = customers.map((c) => toCustomerSummary(c, opportunities, leads));

  return (
    <AppFrame activeModule="customers" dictionary={dictionary} locale={locale}>
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

      {loading || customersLoading ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{copy.loading}</div>
      ) : summaries.length === 0 ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{copy.empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">{copy.table.company}</th>
                <th className="px-3 py-2">{copy.table.contact}</th>
                <th className="px-3 py-2">{copy.table.email}</th>
                <th className="px-3 py-2">{copy.table.sourceLead}</th>
                <th className="px-3 py-2">{copy.table.opportunities}</th>
                <th className="px-3 py-2">{copy.table.created}</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((customer) => (
                <tr className="border-t border-slate-800" key={customer.id}>
                  <td className="px-3 py-3 font-medium">{customer.companyName}</td>
                  <td className="px-3 py-3">{customer.contactName}</td>
                  <td className="px-3 py-3">{customer.email}</td>
                  <td className="px-3 py-3">{customer.sourceLeadCompany}</td>
                  <td className="px-3 py-3">{customer.opportunityCount}</td>
                  <td className="px-3 py-3">
                    {new Date(customer.createdAt).toLocaleString(locale)}
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
