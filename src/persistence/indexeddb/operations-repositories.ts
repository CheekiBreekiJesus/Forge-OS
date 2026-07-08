import { createRecordId } from "@/domain/ids";
import type {
  CreateCustomerContactInput,
  CreateInventoryItemInput,
  CreateMachineInput,
  CustomerContact,
  InventoryItem,
  Machine,
  StockChangeInput,
  StockMovement,
  StockMovementType,
  UpdateInventoryItemInput,
  UpdateMachineInput
} from "@/domain/operations-types";
import type { Product } from "@/domain/product-types";
import { demoInventoryItems, demoMachines } from "@/demo/seed";
import { recordActivity } from "@/features/crud/activity-recorder";
import {
  createArchivePatch,
  createRestorePatch,
  filterByArchive,
  type ArchiveInput,
  type ListOptions
} from "@/persistence/archive-utils";
import type { ForgeOSDatabase } from "../db";
import {
  PersistenceError,
  type ActivityRepository,
  type CustomerContactRepository,
  type InventoryRepository,
  type MachineRepository
} from "../interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

function demoMachineStatus(
  status: string
): import("@/domain/operations-types").MachineStatus {
  if (status === "maintenance") return "maintenance";
  if (status === "offline" || status === "blocked") return "offline";
  if (status === "retired") return "retired";
  return "operational";
}

export function demoMachineToCreateInput(
  demo: (typeof demoMachines)[number],
  supportedProductIds: string[]
): CreateMachineInput {
  return {
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    capacityPerHour: demo.productionSpeedPerHour,
    code: demo.id.replace("machine_", "").toUpperCase(),
    location: "Main floor",
    machineType: demo.type,
    maintenanceNotes: "",
    name: demo.name,
    notes: "",
    setupNotes: `Loading bay capacity: ${demo.loadingBayCapacity}`,
    status: demoMachineStatus(demo.status),
    supportedProductIds
  };
}

export function demoInventoryToCreateInput(
  demo: (typeof demoInventoryItems)[number],
  productId: string | null
): CreateInventoryItemInput {
  return {
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    batch: null,
    category: "materials",
    name: demo.name,
    notes: "",
    productId,
    reorderLevel: demo.reorderPoint,
    sku: demo.sku,
    unit: demo.unit,
    warehouseLocation: "Warehouse A"
  };
}

export function createMachineRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): MachineRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.machines.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
    },
    async getById(tenantId, id) {
      const row = await db.machines.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getByCode(tenantId, code) {
      const rows = await db.machines
        .where("[tenantId+code]")
        .equals([tenantId, code])
        .toArray();
      return rows[0] ?? null;
    },
    async create(tenantId, input: CreateMachineInput) {
      const existing = await this.getByCode(tenantId, input.code);
      if (existing) throw new PersistenceError("duplicate", "Machine code already exists.");
      const timestamp = nowIso();
      const machine: Machine = {
        ...input,
        id: createRecordId("machine"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.machines.put(machine);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_created",
          entityId: machine.id,
          entityType: "machine",
          title: `Machine created: ${machine.name}`,
          metadata: { code: machine.code }
        });
      }
      return machine;
    },
    async update(tenantId, id, input: UpdateMachineInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Machine not found.");
      const updated: Machine = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.machines.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_updated",
          entityId: updated.id,
          entityType: "machine",
          title: `Machine updated: ${updated.name}`
        });
      }
      return updated;
    },
    async duplicate(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Machine not found.");
      const suffix = Date.now().toString().slice(-4);
      return this.create(tenantId, {
        ...existing,
        code: `${existing.code}-${suffix}`,
        name: `${existing.name} (copy)`,
        status: "operational"
      });
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Machine not found.");
      const updated: Machine = {
        ...existing,
        ...createArchivePatch(input),
        updatedAt: nowIso()
      };
      await db.machines.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_archived",
          entityId: id,
          entityType: "machine",
          title: `Machine archived: ${existing.name}`
        });
      }
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Machine not found.");
      const updated: Machine = {
        ...existing,
        ...createRestorePatch(),
        updatedAt: nowIso()
      };
      await db.machines.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_restored",
          entityId: id,
          entityType: "machine",
          title: `Machine restored: ${existing.name}`
        });
      }
      return updated;
    },
    async listForProduct(tenantId, productId, options?: ListOptions) {
      const rows = await this.list(tenantId, options);
      return rows.filter(
        (m) => m.supportedProductIds.length === 0 || m.supportedProductIds.includes(productId)
      );
    }
  };
}

export function createInventoryRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): InventoryRepository {
  async function applyMovement(
    tenantId: string,
    itemId: string,
    type: StockMovementType,
    input: StockChangeInput
  ): Promise<{ item: InventoryItem; movement: StockMovement }> {
    const item = await db.inventoryItems.get(itemId);
    if (!item || item.tenantId !== tenantId) {
      throw new PersistenceError("not_found", "Inventory item not found.");
    }
    const delta = type === "consumption" ? -Math.abs(input.quantity) : input.quantity;
    const nextQty = item.currentQuantity + delta;
    if (nextQty < 0 && !input.allowNegative) {
      throw new PersistenceError(
        "invalid_transition",
        "Stock cannot go negative without explicit override."
      );
    }
    const timestamp = nowIso();
    const movement: StockMovement = {
      allowNegative: Boolean(input.allowNegative),
      balanceAfter: nextQty,
      createdAt: timestamp,
      id: createRecordId("stock"),
      inventoryItemId: itemId,
      quantity: delta,
      reason: input.reason,
      referenceId: input.referenceId ?? null,
      tenantId,
      type
    };
    const updated: InventoryItem = {
      ...item,
      currentQuantity: nextQty,
      updatedAt: timestamp
    };
    await db.transaction("rw", [db.inventoryItems, db.stockMovements], async () => {
      await db.stockMovements.put(movement);
      await db.inventoryItems.put(updated);
    });
    const action =
      type === "receipt"
        ? "stock_received"
        : type === "consumption"
          ? "stock_consumed"
          : "stock_adjusted";
    if (activities) {
      await recordActivity(activities, tenantId, {
        action,
        entityId: itemId,
        entityType: "inventory",
        metadata: { balanceAfter: nextQty, quantity: delta },
        title: `Stock ${type}: ${item.name}`
      });
    }
    return { item: updated, movement };
  }

  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.inventoryItems.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
    },
    async getById(tenantId, id) {
      const row = await db.inventoryItems.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input: CreateInventoryItemInput) {
      const existing = await db.inventoryItems
        .where("[tenantId+sku]")
        .equals([tenantId, input.sku])
        .first();
      if (existing) throw new PersistenceError("duplicate", "SKU already exists.");
      const timestamp = nowIso();
      const item: InventoryItem = {
        ...input,
        currentQuantity: 0,
        id: createRecordId("inv"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.inventoryItems.put(item);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_created",
          entityId: item.id,
          entityType: "inventory",
          title: `Inventory item created: ${item.name}`
        });
      }
      return item;
    },
    async update(tenantId, id, input: UpdateInventoryItemInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Inventory item not found.");
      const updated: InventoryItem = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        currentQuantity: existing.currentQuantity,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.inventoryItems.put(updated);
      return updated;
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Inventory item not found.");
      const updated: InventoryItem = {
        ...existing,
        ...createArchivePatch(input),
        updatedAt: nowIso()
      };
      await db.inventoryItems.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_archived",
          entityId: id,
          entityType: "inventory",
          title: `Inventory archived: ${existing.name}`
        });
      }
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Inventory item not found.");
      const updated: InventoryItem = {
        ...existing,
        ...createRestorePatch(),
        updatedAt: nowIso()
      };
      await db.inventoryItems.put(updated);
      return updated;
    },
    async recordReceipt(tenantId, id, input: StockChangeInput) {
      return applyMovement(tenantId, id, "receipt", {
        ...input,
        quantity: Math.abs(input.quantity)
      });
    },
    async recordConsumption(tenantId, id, input: StockChangeInput) {
      return applyMovement(tenantId, id, "consumption", input);
    },
    async adjustStock(tenantId, id, input: StockChangeInput) {
      return applyMovement(tenantId, id, "adjustment", input);
    },
    async listMovements(tenantId, inventoryItemId) {
      const rows = await db.stockMovements
        .where("[tenantId+inventoryItemId]")
        .equals([tenantId, inventoryItemId])
        .toArray();
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  };
}

export function createCustomerContactRepository(
  db: ForgeOSDatabase
): CustomerContactRepository {
  return {
    async listForCustomer(tenantId, customerId, options?: ListOptions) {
      const rows = await db.customerContacts
        .where("[tenantId+customerId]")
        .equals([tenantId, customerId])
        .toArray();
      return filterByArchive(rows, options);
    },
    async create(tenantId, input: CreateCustomerContactInput) {
      const timestamp = nowIso();
      const contact: CustomerContact = {
        ...input,
        id: createRecordId("contact"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.customerContacts.put(contact);
      return contact;
    },
    async update(tenantId, id, input: Partial<CreateCustomerContactInput>) {
      const existing = await db.customerContacts.get(id);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Contact not found.");
      }
      const updated: CustomerContact = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.customerContacts.put(updated);
      return updated;
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await db.customerContacts.get(id);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Contact not found.");
      }
      const updated: CustomerContact = {
        ...existing,
        ...createArchivePatch(input),
        updatedAt: nowIso()
      };
      await db.customerContacts.put(updated);
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await db.customerContacts.get(id);
      if (!existing || existing.tenantId !== tenantId) {
        throw new PersistenceError("not_found", "Contact not found.");
      }
      const updated: CustomerContact = {
        ...existing,
        ...createRestorePatch(),
        updatedAt: nowIso()
      };
      await db.customerContacts.put(updated);
      return updated;
    }
  };
}

export async function seedOperationsDefaults(
  db: ForgeOSDatabase,
  tenantId: string,
  products: Product[]
): Promise<void> {
  const machineCount = await db.machines.where("tenantId").equals(tenantId).count();
  if (machineCount === 0) {
    const machines = createMachineRepository(db);
    for (const demo of demoMachines.filter((m) => m.tenantId === tenantId)) {
      const supportedProductIds = products
        .filter((p) => demo.compatibleProductCategories.includes(p.category))
        .map((p) => p.id);
      await machines.create(tenantId, demoMachineToCreateInput(demo, supportedProductIds));
    }
  }

  const inventoryCount = await db.inventoryItems.where("tenantId").equals(tenantId).count();
  if (inventoryCount === 0) {
    const inventory = createInventoryRepository(db);
    for (const demo of demoInventoryItems.filter((i) => i.tenantId === tenantId)) {
      const product = products.find((p) => p.sku.includes(demo.sku.replace("STOCK-", "")));
      const item = await inventory.create(
        tenantId,
        demoInventoryToCreateInput(demo, product?.id ?? null)
      );
      if (demo.quantityOnHand > 0) {
        await inventory.recordReceipt(tenantId, item.id, {
          quantity: demo.quantityOnHand,
          reason: "Initial seed stock"
        });
      }
    }
  }
}
