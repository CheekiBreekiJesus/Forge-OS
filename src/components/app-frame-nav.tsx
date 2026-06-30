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
      {visibleModules.map((key, mapIndex) => (
          <Link
            className={
              key === activeModule && !isLeadOpsActive
                ? "flex items-center gap-3 rounded-lg border-l-2 border-orange-400 bg-orange-500/10 px-3 py-3 text-sm font-semibold text-orange-300"
                : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            }
            href={getLocalizedModuleHref(locale, key)}
            key={key}
            onClick={onNavigate}
          >
            <span className="grid size-6 place-items-center rounded-md border border-slate-700 text-xs">
              {mapIndex + 1}
            </span>
            {dictionary.navigation[key]}
          </Link>
      ))}
      {canAccessLeadOps(previewRole) ? (
        <Link
          className={
            isLeadOpsActive
              ? "flex items-center gap-3 rounded-lg border-l-2 border-orange-400 bg-orange-500/10 px-3 py-3 text-sm font-semibold text-orange-300"
              : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          }
          href={leadOpsHref}
          onClick={onNavigate}
        >
          <span className="grid size-6 place-items-center rounded-md border border-slate-700 text-xs">
            L
          </span>
          {dictionary.navigation.leadops}
        </Link>
      ) : null}
    </nav>
  );
}
