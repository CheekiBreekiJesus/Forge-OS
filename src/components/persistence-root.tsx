"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/theme/theme-provider";
import { PersistenceProvider } from "@/persistence/provider";

export function PersistenceRoot({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PersistenceProvider>{children}</PersistenceProvider>
    </ThemeProvider>
  );
}
