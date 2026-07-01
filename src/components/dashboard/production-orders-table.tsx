import Link from "next/link";
import type { ProductionOrderRow } from "@/features/dashboard/metrics";
import { DashboardPanel } from "./dashboard-panel";

type ProductionOrdersTableProps = {
  title: string;
  viewAllLabel: string;
  viewHref: string;
  headers: {
    order: string;
    product: string;
    quantity: string;
    progress: string;
    delivery: string;
  };
  rows: ProductionOrderRow[];
  demoLabel?: string;
  isDemo?: boolean;
};

export function ProductionOrdersTable({
  title,
  viewAllLabel,
  viewHref,
  headers,
  rows,
  demoLabel,
  isDemo
}: ProductionOrdersTableProps) {
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
      <div className="mt-4 max-w-full overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs text-[var(--forge-text-muted)]">
            <tr>
              <th className="pb-3 font-medium">{headers.order}</th>
              <th className="pb-3 font-medium">{headers.product}</th>
              <th className="pb-3 font-medium">{headers.quantity}</th>
              <th className="pb-3 font-medium">{headers.progress}</th>
              <th className="pb-3 font-medium text-right">{headers.delivery}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-[var(--forge-border-subtle)]" key={row.id}>
                <td className="py-3">
                  <Link className="font-semibold text-[var(--forge-accent-blue)]" href={row.href}>
                    {row.orderNumber}
                  </Link>
                </td>
                <td className="py-3 text-[var(--forge-text-secondary)]">{row.product}</td>
                <td className="py-3 text-[var(--forge-text-secondary)]">{row.quantityLabel}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-[var(--forge-hover-bg)]">
                      <div
                        className="h-1.5 rounded-full bg-[var(--forge-accent-blue)]"
                        style={{ width: `${row.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--forge-text-muted)]">{row.progress}%</span>
                  </div>
                </td>
                <td className="py-3 text-right text-[var(--forge-text-muted)]">
                  {row.deliveryLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
