import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type BadgeVariant = "default" | "primary" | "success" | "danger" | "info";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-forge-elevated text-forge-muted",
        variant === "primary" && "bg-forge-primary/20 text-forge-primary",
        variant === "success" && "bg-forge-success/20 text-forge-success",
        variant === "danger" && "bg-forge-danger/20 text-forge-danger",
        variant === "info" && "bg-forge-info/20 text-forge-info",
        className
      )}
      {...props}
    />
  );
}
