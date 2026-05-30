"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Factory,
  Wrench,
  Settings,
  Sparkles,
  ShoppingCart,
  Receipt,
  BarChart3,
  Megaphone,
  ClipboardList,
  Boxes,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@forgeos/ui";
import { DEMO_TENANT } from "@forgeos/shared";
import { useShellStore } from "@/stores/shell-store";

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "crm", href: "/crm", icon: Users },
  { key: "customers", href: "/customers", icon: Users },
  { key: "quotations", href: "/quotations", icon: FileText },
  { key: "orders", href: "/orders", icon: ClipboardList },
  { key: "production", href: "/production", icon: Factory },
  { key: "inventory", href: "/inventory", icon: Package },
  { key: "maintenance", href: "/maintenance", icon: Wrench },
  { key: "molds", href: "/molds", icon: Boxes },
  { key: "quality", href: "/quality", icon: ShieldCheck },
  { key: "purchasing", href: "/purchasing", icon: ShoppingCart },
  { key: "sales", href: "/sales", icon: Receipt },
  { key: "invoicing", href: "/invoicing", icon: FileText },
  { key: "reports", href: "/reports", icon: BarChart3 },
  { key: "marketing", href: "/marketing", icon: Megaphone },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const tShell = useTranslations("shell");
  const locale = useLocale();
  const pathname = usePathname();
  const collapsed = useShellStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-forge-border bg-forge-surface transition-all",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 border-b border-forge-border px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forge-primary font-bold text-white">
          F
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-forge-foreground">ForgeOS</span>
        )}
      </div>

      {!collapsed && (
        <div className="border-b border-forge-border px-3 py-3">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg bg-forge-elevated px-3 py-2 text-sm text-forge-foreground"
          >
            <span className="font-medium">{DEMO_TENANT.name}</span>
            <ChevronDown className="h-4 w-4 text-forge-muted" />
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const fullHref = `/${locale}${href}`;
          const active = pathname.startsWith(fullHref);
          return (
            <Link
              key={key}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-forge-primary/15 font-medium text-forge-primary"
                  : "text-forge-muted hover:bg-forge-elevated hover:text-forge-foreground"
              )}
              title={collapsed ? t(key) : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t(key)}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-forge-border p-3">
        {!collapsed && (
          <Link
            href={`/${locale}/whats-new`}
            className="mb-3 flex items-center gap-2 text-xs text-forge-info hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("whatsNew")}
          </Link>
        )}
        {!collapsed && (
          <div className="rounded-lg bg-forge-elevated p-3">
            <p className="text-xs font-semibold text-forge-foreground">{DEMO_TENANT.name}</p>
            <p className="text-xs text-forge-muted">
              {tShell("tenantPlan", { tenant: DEMO_TENANT.name })}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
