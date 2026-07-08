import type { RevenuePoint } from "@/features/dashboard/metrics";
import { DashboardPanel } from "./dashboard-panel";

type RevenueChartProps = {
  title: string;
  points: RevenuePoint[];
  demoLabel?: string;
  isDemo?: boolean;
  estimatedLabel: string;
};

export function RevenueChart({
  title,
  points,
  demoLabel,
  isDemo,
  estimatedLabel
}: RevenueChartProps) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <DashboardPanel badge={isDemo ? demoLabel : undefined} title={title}>
      {isDemo ? (
        <p className="mt-2 text-xs text-[var(--forge-text-muted)]">{estimatedLabel}</p>
      ) : null}
      <div
        aria-label={`${title} chart`}
        className="mt-5 flex h-40 items-end gap-2 sm:gap-3"
        role="img"
      >
        {points.map((point) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={point.label}>
            <div
              className="w-full rounded-t bg-[var(--forge-accent-blue)]"
              style={{ height: `${Math.max(12, (point.value / max) * 100)}%` }}
            />
            <span className="text-[10px] text-[var(--forge-text-muted)]">{point.label}</span>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
