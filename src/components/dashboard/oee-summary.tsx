import Link from "next/link";
import type { OeeMetrics } from "@/features/dashboard/metrics";
import { DashboardPanel } from "./dashboard-panel";

type OeeSummaryProps = {
  title: string;
  availabilityLabel: string;
  performanceLabel: string;
  qualityLabel: string;
  days: string[];
  demoLabel?: string;
  metrics: OeeMetrics;
  viewHref: string;
  viewAllLabel: string;
};

export function OeeSummary({
  title,
  availabilityLabel,
  performanceLabel,
  qualityLabel,
  days,
  demoLabel,
  metrics,
  viewHref,
  viewAllLabel
}: OeeSummaryProps) {
  return (
    <DashboardPanel
      action={
        <Link className="text-sm font-semibold text-[var(--forge-accent-blue)]" href={viewHref}>
          {viewAllLabel}
        </Link>
      }
      badge={metrics.isDemo ? demoLabel : undefined}
      title={title}
    >
      <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_1fr]">
        <div className="grid aspect-square place-items-center rounded-full border-[18px] border-[var(--forge-success)] bg-[var(--forge-surface-muted)] text-center">
          <div>
            <div className="text-3xl font-bold text-[var(--forge-text-primary)]">
              {metrics.score.toFixed(1)}%
            </div>
            <div className="text-xs text-[var(--forge-text-muted)]">OEE</div>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <MetricLine label={availabilityLabel} tone="blue" value={`${metrics.availability}%`} />
          <MetricLine label={performanceLabel} tone="amber" value={`${metrics.performance}%`} />
          <MetricLine label={qualityLabel} tone="green" value={`${metrics.quality}%`} />
        </div>
      </div>
      <div
        aria-label={`OEE weekly chart ${metrics.score}%`}
        className="mt-6 flex h-28 items-end gap-2 border-t border-[var(--forge-border-subtle)] pt-4 sm:gap-4"
        role="img"
      >
        {metrics.weeklyValues.map((value, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={days[index] ?? index}>
            <div
              className="w-full rounded-t bg-[var(--forge-accent-blue)]"
              style={{ height: `${value}%` }}
            />
            <span className="text-xs text-[var(--forge-text-muted)]">{days[index]}</span>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function MetricLine({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green";
}) {
  const toneColor =
    tone === "blue"
      ? "var(--forge-accent-blue)"
      : tone === "amber"
        ? "var(--forge-warning)"
        : "var(--forge-success)";

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--forge-text-secondary)]">{label}</span>
      <span className="font-semibold" style={{ color: toneColor }}>
        {value}
      </span>
    </div>
  );
}
