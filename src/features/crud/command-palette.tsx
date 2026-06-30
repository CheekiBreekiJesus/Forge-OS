"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { panelClass } from "@/components/app-frame";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  getLocalizedModuleHref,
  moduleKeys,
  moduleRoutes,
  type ModuleKey
} from "@/modules/config";
import { usePersistence } from "@/persistence/provider";
import {
  canCreateEntity,
  canViewModule,
  type PreviewRole
} from "./role-preview";

export type CommandPaletteItem = {
  id: string;
  group: string;
  label: string;
  href?: string;
  keywords?: string;
  action?: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  dictionary: Dictionary;
  locale: Locale;
  previewRole: PreviewRole;
  onQuickCreate?: (entity: string) => void;
};

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
      if (event.key === "Escape") {
        onOpen();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}

export function CommandPalette({
  open,
  onClose,
  dictionary,
  locale,
  previewRole,
  onQuickCreate
}: CommandPaletteProps) {
  const copy = dictionary.crudModule.commandPalette;
  const { state, tenantId } = usePersistence();
  const [query, setQuery] = useState("");
  const [entityItems, setEntityItems] = useState<CommandPaletteItem[]>([]);

  const loadEntities = useCallback(async () => {
    if (state.status !== "ready") return;
    const repos = state.repos;
    const [leads, customers, products, quotes, orders, machines, inventory] = await Promise.all([
      repos.leads.list(tenantId),
      repos.customers.list(tenantId),
      repos.products.list(tenantId),
      repos.quotes.list(tenantId),
      repos.productionOrders.list(tenantId),
      repos.machines.list(tenantId),
      repos.inventory.list(tenantId)
    ]);

    const items: CommandPaletteItem[] = [
      ...leads.slice(0, 20).map((l) => ({
        id: `lead-${l.id}`,
        group: copy.groups.leads,
        label: l.companyName,
        href: `/${locale}/leadops/${l.id}`,
        keywords: `${l.contactName} ${l.email}`
      })),
      ...customers.slice(0, 20).map((c) => ({
        id: `customer-${c.id}`,
        group: copy.groups.customers,
        label: c.companyName || c.tradingName,
        href: getLocalizedModuleHref(locale, "customers"),
        keywords: `${c.contactName} ${c.email}`
      })),
      ...products.slice(0, 20).map((p) => ({
        id: `product-${p.id}`,
        group: copy.groups.products,
        label: p.name,
        href: getLocalizedModuleHref(locale, "products"),
        keywords: p.sku
      })),
      ...quotes.slice(0, 20).map((q) => ({
        id: `quote-${q.id}`,
        group: copy.groups.quotes,
        label: q.quoteNumber,
        href: getLocalizedModuleHref(locale, "orders"),
        keywords: q.productName
      })),
      ...orders.slice(0, 20).map((o) => ({
        id: `order-${o.id}`,
        group: copy.groups.production,
        label: o.orderNumber,
        href: `/${locale}/jobs/${o.id}`,
        keywords: o.productName
      })),
      ...machines.slice(0, 20).map((m) => ({
        id: `machine-${m.id}`,
        group: copy.groups.machines,
        label: m.name,
        href: getLocalizedModuleHref(locale, "machines"),
        keywords: m.code
      })),
      ...inventory.slice(0, 20).map((i) => ({
        id: `inventory-${i.id}`,
        group: copy.groups.inventory,
        label: i.name,
        href: getLocalizedModuleHref(locale, "inventory"),
        keywords: i.sku
      }))
    ];
    setEntityItems(items);
  }, [copy.groups, locale, state, tenantId]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset palette query when opened
    setQuery("");
    void loadEntities();
  }, [open, loadEntities]);

  const navigationItems = useMemo((): CommandPaletteItem[] => {
    const items: CommandPaletteItem[] = moduleKeys
      .filter((key) => key !== "dashboard" && canViewModule(previewRole, key))
      .map((key) => ({
        id: `nav-${key}`,
        group: copy.groups.navigation,
        label: dictionary.navigation[key],
        href: getLocalizedModuleHref(locale, key)
      }));

    if (previewRole === "owner" || previewRole === "sales") {
      items.push({
        id: "nav-leadops",
        group: copy.groups.navigation,
        label: dictionary.navigation.leadops,
        href: `/${locale}/leadops`
      });
    }

    return items;
  }, [copy.groups.navigation, dictionary.navigation, locale, previewRole]);

  const createItems = useMemo((): CommandPaletteItem[] => {
    const entities: { key: string; label: string; module: ModuleKey }[] = [
      { key: "lead", label: copy.create.lead, module: "marketing" },
      { key: "customer", label: copy.create.customer, module: "customers" },
      { key: "product", label: copy.create.product, module: "products" },
      { key: "quote", label: copy.create.quote, module: "orders" },
      { key: "customizer", label: copy.create.customizer, module: "orders" },
      { key: "production", label: copy.create.production, module: "production" },
      { key: "machine", label: copy.create.machine, module: "machines" },
      { key: "inventory", label: copy.create.inventory, module: "inventory" }
    ];

    return entities
      .filter((e) => canCreateEntity(previewRole, e.key) && canViewModule(previewRole, e.module))
      .map((e) => ({
        id: `create-${e.key}`,
        group: copy.groups.create,
        label: e.label,
        keywords: e.key,
        action: () => onQuickCreate?.(e.key)
      }));
  }, [copy.create, copy.groups.create, onQuickCreate, previewRole]);

  const allItems = useMemo(
    () => [...navigationItems, ...createItems, ...entityItems],
    [navigationItems, createItems, entityItems]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 30);
    return allItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q) ||
          item.keywords?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [allItems, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-start p-4 pt-[10vh]" data-testid="command-palette">
      <button aria-label={copy.close} className="absolute inset-0 bg-black/70" onClick={onClose} type="button" />
      <div className={`${panelClass} relative w-full max-w-xl overflow-hidden`} role="dialog">
        <input
          autoFocus
          className="w-full border-b border-slate-700 bg-transparent px-4 py-3 text-sm text-slate-100 outline-none"
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.placeholder}
          value={query}
        />
        <ul className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">{copy.noResults}</li>
          ) : (
            filtered.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    className="flex flex-col px-4 py-2 hover:bg-slate-800"
                    href={item.href}
                    onClick={onClose}
                  >
                    <span className="text-sm font-medium text-slate-100">{item.label}</span>
                    <span className="text-xs text-slate-500">{item.group}</span>
                  </Link>
                ) : (
                  <button
                    className="flex w-full flex-col px-4 py-2 text-left hover:bg-slate-800"
                    onClick={() => {
                      item.action?.();
                      onClose();
                    }}
                    type="button"
                  >
                    <span className="text-sm font-medium text-slate-100">{item.label}</span>
                    <span className="text-xs text-slate-500">{item.group}</span>
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export function buildModuleSearchHref(locale: Locale, moduleKey: ModuleKey): string {
  return getLocalizedModuleHref(locale, moduleKey);
}

export function moduleKeyFromRouteSlug(slug: string): ModuleKey | null {
  const entry = Object.entries(moduleRoutes).find(([, route]) => route === slug);
  return (entry?.[0] as ModuleKey | undefined) ?? null;
}
