"use client";

import type { ReactNode } from "react";
import { PersistenceProvider } from "@/persistence/provider";

export function PersistenceRoot({ children }: { children: ReactNode }) {
  return <PersistenceProvider>{children}</PersistenceProvider>;
}
