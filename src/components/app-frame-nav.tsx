"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getLocalizedModuleHref,
  navIcons,
  primaryNavKeys,
  type ModuleKey
} from "@/modules/config";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { canAccessLeadOps, canViewModule } from "@/features/crud/role-preview";
import { usePreviewRole } from "@/features/crud/role-preview";
import { navLinkActiveClass, navLinkClass } from "@/theme/ui-classes";

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
  const hasHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const effectiveRole = hasHydrated ? previewRole : "owner";
  const visibleModules = primaryNavKeys.filter((key) => canViewModule(effectiveRole, key));

  return (
    <nav aria-label={dictionary.app.name} className={`space-y-1 ${className}`}>
      {visibleModules.map((key) => {
        const isActive = key === activeModule && !isLeadOpsActive;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={isActive ? navLinkActiveClass : navLinkClass}
            href={getLocalizedModuleHref(locale, key)}
            key={key}
            onClick={onNavigate}
          >
            <span className="grid size-6 place-items-center rounded-md border border-[var(--forge-border)] text-xs">
              {navIcons[key]}
            </span>
            {dictionary.navigation[key]}
          </Link>
        );
      })}
      {canAccessLeadOps(effectiveRole) ? (
        <Link
          aria-current={isLeadOpsActive ? "page" : undefined}
          className={isLeadOpsActive ? navLinkActiveClass : navLinkClass}
          href={leadOpsHref}
          onClick={onNavigate}
        >
          <span className="grid size-6 place-items-center rounded-md border border-[var(--forge-border)] text-xs">
            ✉
          </span>
          {dictionary.navigation.leadops}
        </Link>
      ) : null}
    </nav>
  );
}
