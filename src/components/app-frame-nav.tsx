"use client";

import Link from "next/link";
import { getLocalizedModuleHref, moduleKeys, type ModuleKey } from "@/modules/config";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { canAccessLeadOps, canViewModule } from "@/features/crud/role-preview";
import { usePreviewRole } from "@/components/app-frame-client";

type AppFrameNavProps = {
  activeModule: ModuleKey;
  dictionary: Dictionary;
  isLeadOpsActive: boolean;
  leadOpsHref: string;
  locale: Locale;
  onNavigate?: () => void;
  className?: string;
};

const moduleIcons: Record<ModuleKey, string> = {
  dashboard: "D",
  crm: "CRM",
  customers: "C",
  products: "P",
  orders: "O",
  production: "PR",
  inventory: "I",
  machines: "M",
  maintenance: "MT",
  molds: "MD",
  quality: "Q",
  purchasing: "PO",
  suppliers: "S",
  sales: "V",
  billing: "B",
  reports: "R",
  marketing: "MK",
  settings: "ST"
};

export function AppFrameNav({
  activeModule,
  dictionary,
  isLeadOpsActive,
  leadOpsHref,
  locale,
  onNavigate,
  className = ""
}: AppFrameNavProps) {
  const previewRole = usePreviewRole();
  const visibleModules = moduleKeys.filter((key) => canViewModule(previewRole, key));

  return (
    <nav className={`space-y-1 ${className}`}>
      {visibleModules.map((key) => (
          <Link
            className={
              key === activeModule && !isLeadOpsActive
                ? "flex items-center gap-3 rounded-lg border-l-2 border-orange-400 bg-[var(--forge-selected)] px-3 py-2.5 text-sm font-semibold text-orange-400"
                : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover)] hover:text-[var(--forge-text)]"
            }
            href={getLocalizedModuleHref(locale, key)}
            key={key}
            onClick={onNavigate}
          >
            <span className="grid h-6 min-w-6 place-items-center rounded-md border border-[var(--forge-border)] px-1 text-[10px] font-bold">
              {moduleIcons[key]}
            </span>
            {dictionary.navigation[key]}
          </Link>
      ))}
      {canAccessLeadOps(previewRole) ? (
        <Link
          className={
            isLeadOpsActive
              ? "flex items-center gap-3 rounded-lg border-l-2 border-orange-400 bg-[var(--forge-selected)] px-3 py-2.5 text-sm font-semibold text-orange-400"
              : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover)] hover:text-[var(--forge-text)]"
          }
          href={leadOpsHref}
          onClick={onNavigate}
        >
          <span className="grid h-6 min-w-6 place-items-center rounded-md border border-[var(--forge-border)] px-1 text-[10px] font-bold">
            L
          </span>
          {dictionary.navigation.leadops}
        </Link>
      ) : null}
    </nav>
  );
}
