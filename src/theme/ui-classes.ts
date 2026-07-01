export const panelClass =
  "rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] shadow-[var(--forge-shadow-soft)]";

export const panelMutedClass =
  "rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-surface-muted)]";

export const inputClass =
  "rounded-lg border border-[var(--forge-border)] bg-[var(--forge-input-bg)] px-3 py-2 text-sm text-[var(--forge-text-primary)] outline-none focus:border-[var(--forge-accent-orange)]";

export const navLinkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--forge-text-secondary)] transition hover:bg-[var(--forge-hover-bg)] hover:text-[var(--forge-text-primary)]";

export const navLinkActiveClass =
  "flex items-center gap-3 rounded-lg border-l-2 border-[var(--forge-nav-active-border)] bg-[var(--forge-selected-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--forge-nav-active-text)]";

export const statusToneClasses = {
  green:
    "text-[var(--forge-success)] bg-[var(--forge-success-soft)] border-[color-mix(in_srgb,var(--forge-success)_25%,transparent)]",
  blue: "text-[var(--forge-accent-blue)] bg-[var(--forge-accent-blue-soft)] border-[color-mix(in_srgb,var(--forge-accent-blue)_25%,transparent)]",
  amber:
    "text-[var(--forge-warning)] bg-[var(--forge-warning-soft)] border-[color-mix(in_srgb,var(--forge-warning)_25%,transparent)]",
  red: "text-[var(--forge-danger)] bg-[var(--forge-danger-soft)] border-[color-mix(in_srgb,var(--forge-danger)_25%,transparent)]",
  cyan: "text-[var(--forge-info)] bg-[var(--forge-info-soft)] border-[color-mix(in_srgb,var(--forge-info)_25%,transparent)]"
} as const;

export type StatusTone = keyof typeof statusToneClasses;
