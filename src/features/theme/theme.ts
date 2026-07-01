"use client";

export type ForgeThemeMode = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "forgeos:theme";

export function isForgeThemeMode(value: string | null | undefined): value is ForgeThemeMode {
  return value === "dark" || value === "light" || value === "system";
}

export function getStoredThemeMode(): ForgeThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isForgeThemeMode(stored) ? stored : "dark";
}

export function resolveThemeMode(mode: ForgeThemeMode): Exclude<ForgeThemeMode, "system"> {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyThemeMode(mode: ForgeThemeMode): void {
  if (typeof document === "undefined") return;
  const resolved = resolveThemeMode(mode);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.style.colorScheme = resolved;
}

export function persistThemeMode(mode: ForgeThemeMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeMode(mode);
}

export function nextThemeMode(mode: ForgeThemeMode): ForgeThemeMode {
  if (mode === "dark") return "light";
  if (mode === "light") return "system";
  return "dark";
}
