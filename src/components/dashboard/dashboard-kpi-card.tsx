import Link from "next/link";
import { panelClass, statusToneClasses, type StatusTone } from "@/theme/ui-classes";

type DashboardKpiCardProps = {
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down" | "flat";
  tone: StatusTone;
  isDemo?: boolean;
  demoLabel?: string;
  href?: string;
};

const trendIcons = {
  up: "↑",
  down: "↓",
  flat: "→"
};

export function DashboardKpiCard({
  label,
  value,
  trend,
  trendDirection,
  tone,
  isDemo,
  demoLabel,
  href
}: DashboardKpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--forge-text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--forge-text-primary)]">{value}</p>
        </div>
        <span
          className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusToneClasses[tone]}`}
        >
          {trendIcons[trendDirection]} {trend}
        </span>
      </div>
      {isDemo && demoLabel ? (
        <p className="mt-3 text-xs font-medium text-[var(--forge-text-muted)]">{demoLabel}</p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link className={`${panelClass} block p-4 transition hover:border-[var(--forge-accent-orange)]`} href={href}>
        {content}
      </Link>
    );
  }

  return <article className={`${panelClass} p-4`}>{content}</article>;
}
