export const THEME_STORAGE_KEY = "forgeos:theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "dark";
}

export function writeStoredThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function resolveThemePreference(preference: ThemePreference): ResolvedTheme {
  if (preference === "light" || preference === "dark") return preference;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function getInitialResolvedTheme(): ResolvedTheme {
  return resolveThemePreference(readStoredThemePreference());
}
