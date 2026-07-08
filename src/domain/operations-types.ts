/** Shared archive fields for soft-delete entities. */
export type Archivable = {
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
};

export type MachineStatus = "operational" | "maintenance" | "offline" | "retired";

export type Machine = Archivable & {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  machineType: string;
  status: MachineStatus;
  capacityPerHour: number;
  supportedProductIds: string[];
  location: string;
  notes: string;
  setupNotes: string;
  maintenanceNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMachineInput = Omit<Machine, "id" | "tenantId" | "createdAt" | "updatedAt">;
export type UpdateMachineInput = Partial<CreateMachineInput>;

export type InventoryItem = Archivable & {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  productId: string | null;
  currentQuantity: number;
  reorderLevel: number;
  warehouseLocation: string;
  batch: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryItemInput = Omit<
  InventoryItem,
  "id" | "tenantId" | "currentQuantity" | "createdAt" | "updatedAt"
>;

export type UpdateInventoryItemInput = Partial<
  Omit<CreateInventoryItemInput, "sku"> & { currentQuantity?: never }
>;

export type StockMovementType = "receipt" | "consumption" | "adjustment";

export type StockMovement = {
  id: string;
  tenantId: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  reason: string;
  referenceId: string | null;
  allowNegative: boolean;
  createdAt: string;
};

export type CustomerContact = Archivable & {
  id: string;
  tenantId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerContactInput = Omit<
  CustomerContact,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export type CustomerStatus = "active" | "prospect" | "inactive";

export type StockChangeInput = {
  quantity: number;
  reason: string;
  referenceId?: string | null;
  allowNegative?: boolean;
};
