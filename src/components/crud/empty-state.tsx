import type { ReactNode } from "react";
import { panelClass } from "@/components/app-frame";
import { PrimaryActionButton } from "./primary-action-button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className={`${panelClass} p-8 text-center`} data-testid="crud-empty-state">
      {icon ? <div className="mb-3 flex justify-center text-slate-500">{icon}</div> : null}
      <h2 className="text-lg font-bold text-slate-200">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p> : null}
      {actionLabel && onAction ? (
        <div className="mt-4">
          <PrimaryActionButton onClick={onAction}>{actionLabel}</PrimaryActionButton>
        </div>
      ) : null}
    </div>
  );
}
