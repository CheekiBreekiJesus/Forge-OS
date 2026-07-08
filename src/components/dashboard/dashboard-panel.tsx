import type { ReactNode } from "react";
import { panelClass } from "@/theme/ui-classes";

type DashboardPanelProps = {
  title: string;
  action?: ReactNode;
  badge?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardPanel({ title, action, badge, children, className = "" }: DashboardPanelProps) {
  return (
    <article className={`${panelClass} p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">{title}</h2>
          {badge ? (
            <span className="rounded-md border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--forge-text-muted)]">
              {badge}
            </span>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </article>
  );
}
