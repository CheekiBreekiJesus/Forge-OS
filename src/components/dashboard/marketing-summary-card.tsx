"use client";

import Link from "next/link";
import { panelClass } from "@/theme/ui-classes";

type MarketingSummaryCardProps = {
  title: string;
  leadsReadyLabel: string;
  draftsLabel: string;
  approvedLabel: string;
  openedLabel: string;
  suppressedLabel: string;
  outreachHref: string;
  marketingHref: string;
  openOutreachLabel: string;
  openMarketingLabel: string;
  demoLabel?: string;
  isDemo?: boolean;
  summary: {
    leadsReady: number;
    draftsAwaitingReview: number;
    approvedEmails: number;
    externallyOpened: number;
    suppressedLeads: number;
  };
};

export function MarketingSummaryCard({
  title,
  leadsReadyLabel,
  draftsLabel,
  approvedLabel,
  openedLabel,
  suppressedLabel,
  outreachHref,
  marketingHref,
  openOutreachLabel,
  openMarketingLabel,
  demoLabel,
  isDemo,
  summary
}: MarketingSummaryCardProps) {
  const stats = [
    { label: leadsReadyLabel, value: summary.leadsReady },
    { label: draftsLabel, value: summary.draftsAwaitingReview },
    { label: approvedLabel, value: summary.approvedEmails },
    { label: openedLabel, value: summary.externallyOpened },
    { label: suppressedLabel, value: summary.suppressedLeads }
  ];

  return (
    <article className={`${panelClass} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">{title}</h2>
        {isDemo && demoLabel ? (
          <span className="text-xs font-semibold text-[var(--forge-text-muted)]">{demoLabel}</span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            className="rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-surface-muted)] p-3"
            key={stat.label}
          >
            <p className="text-xs text-[var(--forge-text-muted)]">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-[var(--forge-text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-bold text-white"
          href={outreachHref}
        >
          {openOutreachLabel}
        </Link>
        <Link
          className="rounded-lg border border-[var(--forge-border)] px-4 py-2 text-sm font-semibold text-[var(--forge-text-secondary)]"
          href={marketingHref}
        >
          {openMarketingLabel}
        </Link>
      </div>
    </article>
  );
}
