import Link from "next/link";
import type { DashboardAlertItem } from "@/features/dashboard/metrics";
import { statusToneClasses } from "@/theme/ui-classes";
import { DashboardPanel } from "./dashboard-panel";

type AlertsActivityPanelProps = {
  title: string;
  viewAllLabel: string;
  viewHref: string;
  items: DashboardAlertItem[];
  emptyLabel: string;
};

export function AlertsActivityPanel({
  title,
  viewAllLabel,
  viewHref,
  items,
  emptyLabel
}: AlertsActivityPanelProps) {
  return (
    <DashboardPanel
      action={
        <Link className="text-sm font-semibold text-[var(--forge-accent-blue)]" href={viewHref}>
          {viewAllLabel}
        </Link>
      }
      title={title}
    >
      <div className="mt-4 max-h-52 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--forge-text-muted)]">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <Link
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--forge-border-subtle)] pb-3 last:border-0"
              href={item.href}
              key={item.id}
            >
              <div>
                <div className="text-sm font-semibold text-[var(--forge-text-primary)]">
                  {item.title}
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">{item.detail}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--forge-text-muted)]">{item.timeLabel}</div>
                <div
                  className={`mt-1 rounded-md border px-2 py-1 text-xs font-bold ${statusToneClasses[item.tone]}`}
                >
                  {item.priority}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}
