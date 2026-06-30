import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function PrimaryActionButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: PrimaryActionButtonProps) {
  const base =
    variant === "primary"
      ? "rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400 disabled:opacity-50"
      : "rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50";

  return (
    <button className={`${base} ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}
