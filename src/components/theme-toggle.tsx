"use client";

import { useTheme } from "@/theme/theme-provider";

type ThemeToggleProps = {
  labelLight: string;
  labelDark: string;
};

export function ThemeToggle({ labelLight, labelDark }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? labelLight : labelDark;

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-elevated)] text-[var(--forge-text-secondary)] transition hover:bg-[var(--forge-hover-bg)] hover:text-[var(--forge-text-primary)]"
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {isDark ? (
        <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
          <path
            d="M21 14.5A8.5 8.5 0 0 1 9.5 3 6.5 6.5 0 1 0 21 14.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      )}
    </button>
  );
}
