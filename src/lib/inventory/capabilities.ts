import type { InventoryRuntimeMode } from "@/lib/inventory/runtime";

export type InventoryDesktopCapability =
  | "read_snapshot"
  | "seed_demo"
  | "stock_movements"
  | "reservations"
  | "barcode_resolve"
  | "barcode_link"
  | "label_preview"
  | "label_persist"
  | "import_preview";

const SUPABASE_CAPABILITIES: ReadonlySet<InventoryDesktopCapability> = new Set([
  "read_snapshot",
  "stock_movements",
  "reservations",
  "barcode_resolve",
  "barcode_link",
  "label_preview"
]);

const DEMO_CAPABILITIES: ReadonlySet<InventoryDesktopCapability> = new Set([
  "read_snapshot",
  "seed_demo",
  "stock_movements",
  "reservations",
  "barcode_resolve",
  "barcode_link",
  "label_preview",
  "label_persist",
  "import_preview"
]);

export function resolveInventoryDesktopCapabilities(
  mode: InventoryRuntimeMode
): ReadonlySet<InventoryDesktopCapability> {
  return mode === "supabase" ? SUPABASE_CAPABILITIES : DEMO_CAPABILITIES;
}

export function hasInventoryDesktopCapability(
  mode: InventoryRuntimeMode,
  capability: InventoryDesktopCapability
): boolean {
  return resolveInventoryDesktopCapabilities(mode).has(capability);
}
