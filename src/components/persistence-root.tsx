"use client";

import type { ReactNode } from "react";
import { PersistenceGate } from "@/components/persistence-gate";
import { ThemeProvider } from "@/theme/theme-provider";
import { PersistenceProvider } from "@/persistence/provider";

export function PersistenceRoot({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PersistenceProvider>
        <PersistenceGate>{children}</PersistenceGate>
      </PersistenceProvider>
    </ThemeProvider>
  );
}
