"use client";

import { useEffect } from "react";
import { useShellStore } from "@/stores/shell-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useShellStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
