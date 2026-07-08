import { panelClass } from "@/components/app-frame";
import { PrimaryActionButton } from "./primary-action-button";

type ErrorStateProps = {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <div className={`${panelClass} border-red-900/50 p-8 text-center`} data-testid="crud-error-state">
      <h2 className="text-lg font-bold text-red-300">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{message}</p>
      {retryLabel && onRetry ? (
        <div className="mt-4">
          <PrimaryActionButton onClick={onRetry}>{retryLabel}</PrimaryActionButton>
        </div>
      ) : null}
    </div>
  );
}
