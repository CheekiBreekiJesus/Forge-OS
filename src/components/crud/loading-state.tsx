import { panelClass } from "@/components/app-frame";

type LoadingStateProps = {
  message: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className={`${panelClass} p-8 text-center text-slate-400`} data-testid="crud-loading-state">
      {message}
    </div>
  );
}
