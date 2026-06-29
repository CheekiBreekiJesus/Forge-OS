import { cn } from "../lib/cn";

export function Progress({
  value,
  className,
  variant = "default",
}: {
  value: number;
  className?: string;
  variant?: "default" | "danger" | "warning";
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-forge-elevated", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          variant === "default" && "bg-forge-info",
          variant === "danger" && "bg-forge-danger",
          variant === "warning" && "bg-forge-primary"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
