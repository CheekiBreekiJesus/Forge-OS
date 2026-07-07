import type { InventoryItem, StockMovement } from "@/domain/operations-types";
import type { InventoryRepository } from "@/persistence/interfaces";

export type StockTransactionType = "receipt" | "consumption" | "adjustment";

export type AdjustmentMode = "delta" | "target";

export type StockTransactionInput = {
  type: StockTransactionType;
  quantity: number;
  reason: string;
  referenceId?: string | null;
  adjustmentMode?: AdjustmentMode;
  currentQuantity?: number;
};

export function computeAdjustmentDelta(
  mode: AdjustmentMode,
  quantity: number,
  currentQuantity: number
): number {
  if (mode === "target") {
    return quantity - currentQuantity;
  }
  return quantity;
}

export function validateStockTransaction(
  input: StockTransactionInput,
  item: InventoryItem
): string | null {
  if (!input.reason.trim() && input.type === "adjustment") {
    return "reason_required";
  }
  if (input.type === "receipt" || input.type === "consumption") {
    if (input.quantity <= 0) return "quantity_required";
  }
  if (input.type === "adjustment") {
    const mode = input.adjustmentMode ?? "delta";
    const delta = computeAdjustmentDelta(mode, input.quantity, item.currentQuantity);
    if (mode === "delta" && delta === 0) return "quantity_required";
    if (mode === "target" && input.quantity < 0) return "quantity_required";
  }
  if (input.type === "consumption" && input.quantity > item.currentQuantity) {
    return "negative_stock";
  }
  if (input.type === "adjustment") {
    const mode = input.adjustmentMode ?? "delta";
    const delta = computeAdjustmentDelta(mode, input.quantity, item.currentQuantity);
    if (item.currentQuantity + delta < 0) return "negative_stock";
  }
  return null;
}

export async function postStockTransaction(
  repo: InventoryRepository,
  tenantId: string,
  itemId: string,
  input: StockTransactionInput,
  item: InventoryItem
): Promise<{ item: InventoryItem; movement: StockMovement }> {
  const payload = {
    quantity: input.quantity,
    reason: input.reason.trim() || defaultReason(input.type),
    referenceId: input.referenceId ?? null
  };

  if (input.type === "receipt") {
    return repo.recordReceipt(tenantId, itemId, payload);
  }

  if (input.type === "consumption") {
    return repo.recordConsumption(tenantId, itemId, payload);
  }

  const mode = input.adjustmentMode ?? "delta";
  const delta = computeAdjustmentDelta(mode, input.quantity, item.currentQuantity);
  return repo.adjustStock(tenantId, itemId, {
    ...payload,
    quantity: delta,
    reason: payload.reason
  });
}

function defaultReason(type: StockTransactionType): string {
  switch (type) {
    case "receipt":
      return "Mobile receipt";
    case "consumption":
      return "Mobile consumption";
    case "adjustment":
      return "Mobile adjustment";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
