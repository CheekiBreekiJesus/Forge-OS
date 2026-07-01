import Link from "next/link";
import type { InventorySummaryRow } from "@/features/dashboard/metrics";
import { statusToneClasses } from "@/theme/ui-classes";
import { DashboardPanel } from "./dashboard-panel";

type InventorySummaryProps = {
  title: string;
  viewAllLabel: string;
  viewHref: string;
  items: InventorySummaryRow[];
  emptyLabel: string;
  demoLabel?: string;
  isDemo?: boolean;
};

export function InventorySummary({
  title,
  viewAllLabel,
  viewHref,
  items,
  emptyLabel,
  demoLabel,
  isDemo
}: InventorySummaryProps) {
  return (
    <DashboardPanel
      action={
        <Link className="text-sm font-semibold text-[var(--forge-accent-blue)]" href={viewHref}>
          {viewAllLabel}
        </Link>
      }
      badge={isDemo ? demoLabel : undefined}
      title={title}
    >
      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--forge-text-muted)]">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <Link
              className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--forge-border-subtle)] pb-3 last:border-0"
              href={item.href ?? viewHref}
              key={item.id}
            >
              <div>
                <div className="font-semibold text-[var(--forge-text-primary)]">{item.name}</div>
                <div className="text-xs text-[var(--forge-text-muted)]">{item.category}</div>
              </div>
              <div className="min-w-0 text-right sm:min-w-36">
                <div className="text-sm font-semibold text-[var(--forge-text-primary)]">
                  {item.quantityLabel}
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">{item.minimumLabel}</div>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--forge-hover-bg)]">
                  <div
                    className={`h-1.5 rounded-full ${statusToneClasses[item.tone].split(" ")[0] ? "" : ""}`}
                    style={{
                      width: `${item.fillPercent}%`,
                      background:
                        item.tone === "red"
                          ? "var(--forge-danger)"
                          : item.tone === "amber"
                            ? "var(--forge-warning)"
                            : "var(--forge-success)"
                    }}
                  />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}
