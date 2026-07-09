import type { InventoryReservation } from "@/domain/inventory-product-types";
import type { InventoryMovementKind, StockMovementRequest } from "@/features/inventory-product/operations";
import {
  postInventoryDesktopMovement,
  postInventoryReservation,
  releaseInventoryReservation
} from "@/lib/inventory/api-client";
import type { InventoryProductSnapshot, InventoryProductRepository } from "@/persistence/interfaces";
import type { LocalRepositoryBundle } from "@/persistence/registry";

type ReadyPersistenceState = {
  status: "ready";
  repos: LocalRepositoryBundle;
  tenantId: string;
};

export type DesktopWorkflowRequest = Omit<StockMovementRequest, "tenantId">;

export type DesktopWorkflowHandlers = {
  runWorkflow: (
    kind: InventoryMovementKind,
    request: DesktopWorkflowRequest,
    direction?: "increase" | "decrease"
  ) => Promise<void>;
  createReservation: (input: {
    itemId: string;
    quantity: number;
    sourceDocumentId: string;
    sourceDocumentType: InventoryReservation["sourceDocumentType"];
    unitOfMeasureId: string;
    warehouseId: string;
    locationId?: string | null;
    lotId?: string | null;
  }) => Promise<void>;
  releaseReservation: (reservationId: string) => Promise<void>;
};

function mapMovementKind(
  kind: InventoryMovementKind,
  direction?: "increase" | "decrease"
): "receipt" | "issue" | "transfer" | "adjust_increase" | "adjust_decrease" {
  if (kind === "receipt") return "receipt";
  if (kind === "issue") return "issue";
  if (kind === "transfer") return "transfer";
  return direction === "decrease" ? "adjust_decrease" : "adjust_increase";
}

export function createSupabaseDesktopWorkflows(input: {
  reloadSnapshot: () => Promise<InventoryProductSnapshot>;
  onReservationCreated: (reservation: InventoryReservation) => void;
  onReservationReleased: (reservationId: string) => void;
}): DesktopWorkflowHandlers {
  return {
    async createReservation(reservationInput) {
      const result = await postInventoryReservation({
        idempotencyKey: `desktop:reservation:${Date.now()}`,
        itemId: reservationInput.itemId,
        locationId: reservationInput.locationId ?? reservationInput.warehouseId,
        lotId: reservationInput.lotId,
        quantity: reservationInput.quantity,
        sourceDocumentId: reservationInput.sourceDocumentId,
        sourceDocumentType: reservationInput.sourceDocumentType,
        unitCode: reservationInput.unitOfMeasureId,
        warehouseId: reservationInput.warehouseId
      });
      const now = new Date().toISOString();
      input.onReservationCreated({
        baseQuantity: reservationInput.quantity,
        createdAt: now,
        id: result.reservationId,
        itemId: reservationInput.itemId,
        locationId: reservationInput.locationId ?? null,
        lotId: reservationInput.lotId ?? null,
        productVariantId: null,
        quantity: reservationInput.quantity,
        sourceDocumentId: reservationInput.sourceDocumentId,
        sourceDocumentType: reservationInput.sourceDocumentType,
        status: "active",
        tenantId: "server",
        unitOfMeasureId: reservationInput.unitOfMeasureId,
        updatedAt: now,
        warehouseId: reservationInput.warehouseId
      });
      await input.reloadSnapshot();
    },
    async releaseReservation(reservationId) {
      await releaseInventoryReservation({ reservationId });
      input.onReservationReleased(reservationId);
      await input.reloadSnapshot();
    },
    async runWorkflow(kind, request, direction) {
      await postInventoryDesktopMovement({
        destinationLocationId: request.destinationLocationId,
        idempotencyKey: request.idempotencyKey,
        itemId: request.itemId,
        kind: mapMovementKind(kind, direction),
        locationId: request.locationId,
        lotId: request.lotId,
        notes: request.notes,
        quantity: request.quantity,
        reasonCode: request.reasonCode,
        unitCode: request.unitOfMeasureId,
        warehouseId: request.warehouseId
      });
      await input.reloadSnapshot();
    }
  };
}

export function createDemoDesktopWorkflows(input: {
  persistenceState: ReadyPersistenceState;
  tenantId: string;
  reloadSnapshot: () => Promise<InventoryProductSnapshot>;
  notifyDataChanged: () => void;
}): DesktopWorkflowHandlers {
  const repo: InventoryProductRepository = input.persistenceState.repos.inventoryProduct;

  return {
    async createReservation(reservationInput) {
      await repo.createReservation(input.tenantId, reservationInput);
      await input.reloadSnapshot();
      input.notifyDataChanged();
    },
    async releaseReservation(reservationId) {
      await repo.releaseReservation(input.tenantId, reservationId);
      await input.reloadSnapshot();
      input.notifyDataChanged();
    },
    async runWorkflow(kind, request, direction) {
      const fullRequest = { ...request, tenantId: input.tenantId };
      if (kind === "receipt") await repo.receiveStock(input.tenantId, fullRequest);
      if (kind === "issue") await repo.issueStock(input.tenantId, fullRequest);
      if (kind === "transfer") await repo.transferStock(input.tenantId, fullRequest);
      if (kind === "adjustment") {
        await repo.adjustStock(input.tenantId, fullRequest, direction ?? "increase");
      }
      await input.reloadSnapshot();
      input.notifyDataChanged();
    }
  };
}
