import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "ghost" | "outline";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        variant === "primary" &&
          "bg-forge-primary text-white hover:bg-forge-primary/90",
        variant === "ghost" &&
          "text-forge-muted hover:bg-forge-elevated hover:text-forge-foreground",
        variant === "outline" &&
          "border border-forge-border text-forge-foreground hover:bg-forge-elevated",
        className
      )}
      {...props}
    />
  );
}
