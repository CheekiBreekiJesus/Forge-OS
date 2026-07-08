import { createRecordId } from "@/domain/ids";
import { createInventoryProductDemoState } from "@/features/inventory-product/demo";
import {
  postInventoryTransaction,
  reverseInventoryTransaction,
  validateBarcodeRecord,
  validateUnitConversions
} from "@/features/inventory-product/ledger";
import type { ForgeOSDatabase } from "@/persistence/db";
import type {
  InventoryProductRepository,
  InventoryProductSnapshot
} from "@/persistence/interfaces";

function inventoryProductTables(db: ForgeOSDatabase) {
  return [
    db.unitOfMeasures,
    db.unitConversions,
    db.inventoryItemMasters,
    db.productMasters,
    db.productVariants,
    db.packagingConfigurations,
    db.warehouses,
    db.stockLocations,
    db.inventoryLots,
    db.inventoryTransactions,
    db.inventoryLedgerEntries,
    db.inventoryReservations,
    db.stockCountSessions,
    db.barcodeRecords,
    db.labelTemplates,
    db.labelPrintJobs,
    db.inventoryProductImportBatches,
    db.inventoryProductImportStagedRows
  ];
}

async function bulkPutIfAny<T>(table: { bulkPut(rows: T[]): Promise<unknown> }, rows: T[]) {
  if (rows.length > 0) {
    await table.bulkPut(rows);
  }
}

export async function clearInventoryProductTenant(
  db: ForgeOSDatabase,
  tenantId: string
): Promise<void> {
  await Promise.all(
    inventoryProductTables(db).map((table) => table.where("tenantId").equals(tenantId).delete())
  );
}

export async function writeInventoryProductSnapshot(
  db: ForgeOSDatabase,
  tenantId: string,
  snapshot: InventoryProductSnapshot
): Promise<void> {
  await db.transaction("rw", inventoryProductTables(db), async () => {
    await clearInventoryProductTenant(db, tenantId);
    await bulkPutIfAny(db.unitOfMeasures, snapshot.unitOfMeasures);
    await bulkPutIfAny(db.unitConversions, snapshot.conversions);
    await bulkPutIfAny(db.inventoryItemMasters, snapshot.items);
    await bulkPutIfAny(db.productMasters, snapshot.products);
    await bulkPutIfAny(db.productVariants, snapshot.variants);
    await bulkPutIfAny(db.packagingConfigurations, snapshot.packaging);
    await bulkPutIfAny(db.warehouses, snapshot.warehouses);
    await bulkPutIfAny(db.stockLocations, snapshot.locations);
    await bulkPutIfAny(db.inventoryLots, snapshot.lots);
    await bulkPutIfAny(db.inventoryTransactions, snapshot.transactions);
    await bulkPutIfAny(db.inventoryLedgerEntries, snapshot.entries);
    await bulkPutIfAny(db.inventoryReservations, snapshot.reservations);
    await bulkPutIfAny(db.stockCountSessions, snapshot.stockCounts);
    await bulkPutIfAny(db.barcodeRecords, snapshot.barcodes);
    await bulkPutIfAny(db.labelTemplates, snapshot.labelTemplates);
    await bulkPutIfAny(db.labelPrintJobs, snapshot.labelPrintJobs);
    await bulkPutIfAny(db.inventoryProductImportBatches, snapshot.importBatch ? [snapshot.importBatch] : []);
    await bulkPutIfAny(db.inventoryProductImportStagedRows, snapshot.importRows);
  });
}

export async function readInventoryProductSnapshot(
  db: ForgeOSDatabase,
  tenantId: string
): Promise<InventoryProductSnapshot> {
  const [
    unitOfMeasures,
    conversions,
    items,
    products,
    variants,
    packaging,
    warehouses,
    locations,
    lots,
    transactions,
    entries,
    reservations,
    stockCounts,
    barcodes,
    labelTemplates,
    labelPrintJobs,
    importBatches,
    importRows
  ] = await Promise.all([
    db.unitOfMeasures.where("tenantId").equals(tenantId).toArray(),
    db.unitConversions.where("tenantId").equals(tenantId).toArray(),
    db.inventoryItemMasters.where("tenantId").equals(tenantId).toArray(),
    db.productMasters.where("tenantId").equals(tenantId).toArray(),
    db.productVariants.where("tenantId").equals(tenantId).toArray(),
    db.packagingConfigurations.where("tenantId").equals(tenantId).toArray(),
    db.warehouses.where("tenantId").equals(tenantId).toArray(),
    db.stockLocations.where("tenantId").equals(tenantId).toArray(),
    db.inventoryLots.where("tenantId").equals(tenantId).toArray(),
    db.inventoryTransactions.where("tenantId").equals(tenantId).toArray(),
    db.inventoryLedgerEntries.where("tenantId").equals(tenantId).toArray(),
    db.inventoryReservations.where("tenantId").equals(tenantId).toArray(),
    db.stockCountSessions.where("tenantId").equals(tenantId).toArray(),
    db.barcodeRecords.where("tenantId").equals(tenantId).toArray(),
    db.labelTemplates.where("tenantId").equals(tenantId).toArray(),
    db.labelPrintJobs.where("tenantId").equals(tenantId).toArray(),
    db.inventoryProductImportBatches.where("tenantId").equals(tenantId).toArray(),
    db.inventoryProductImportStagedRows.where("tenantId").equals(tenantId).toArray()
  ]);

  return {
    barcodes,
    conversions,
    entries: entries.sort((a, b) => a.id.localeCompare(b.id)),
    importBatch: importBatches.sort((a, b) => a.id.localeCompare(b.id))[0] ?? null,
    importRows: importRows.sort((a, b) => a.sourceRowNumber - b.sourceRowNumber),
    items,
    labelPrintJobs,
    labelTemplates,
    locations,
    lots,
    packaging,
    products,
    reservations,
    stockCounts,
    transactions: transactions.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    unitOfMeasures,
    variants,
    warehouses
  };
}

export async function seedInventoryProductDefaults(
  db: ForgeOSDatabase,
  tenantId: string
): Promise<void> {
  const existing = await db.inventoryItemMasters.where("tenantId").equals(tenantId).count();
  if (existing > 0) return;
  const demo = createInventoryProductDemoState(tenantId);
  await writeInventoryProductSnapshot(db, tenantId, demo);
}

export function createInventoryProductRepository(
  db: ForgeOSDatabase
): InventoryProductRepository {
  return {
    async getSnapshot(tenantId) {
      return readInventoryProductSnapshot(db, tenantId);
    },
    async replaceSnapshot(tenantId, snapshot) {
      await writeInventoryProductSnapshot(db, tenantId, snapshot);
    },
    async seedDemoFoundation(tenantId) {
      await seedInventoryProductDefaults(db, tenantId);
    },
    async postTransaction(tenantId, input) {
      const snapshot = await readInventoryProductSnapshot(db, tenantId);
      const existing = snapshot.transactions.find(
        (transaction) =>
          transaction.tenantId === tenantId && transaction.idempotencyKey === input.idempotencyKey
      );
      if (existing) {
        return {
          entries: snapshot.entries.filter((entry) => entry.transactionId === existing.id),
          transaction: existing
        };
      }

      const next = postInventoryTransaction(snapshot, input, createRecordId);
      const newEntries = next.entries.filter((entry) => entry.transactionId === next.transaction.id);
      await db.transaction("rw", [db.inventoryTransactions, db.inventoryLedgerEntries], async () => {
        await db.inventoryTransactions.put(next.transaction);
        await db.inventoryLedgerEntries.bulkPut(newEntries);
      });
      return { entries: newEntries, transaction: next.transaction };
    },
    async reverseTransaction(tenantId, transactionId, operatorId, reasonCode) {
      const snapshot = await readInventoryProductSnapshot(db, tenantId);
      const next = reverseInventoryTransaction(
        snapshot,
        transactionId,
        tenantId,
        operatorId,
        reasonCode,
        createRecordId
      );
      const newEntries = next.entries.filter((entry) => entry.transactionId === next.transaction.id);
      await db.transaction("rw", [db.inventoryTransactions, db.inventoryLedgerEntries], async () => {
        await db.inventoryTransactions.put(next.transaction);
        await db.inventoryLedgerEntries.bulkPut(newEntries);
      });
      return { entries: newEntries, transaction: next.transaction };
    },
    async recordLabelPrintJob(tenantId, job) {
      const record = { ...job, tenantId };
      await db.labelPrintJobs.put(record);
      return record;
    },
    async validateIntegrity(tenantId) {
      const snapshot = await readInventoryProductSnapshot(db, tenantId);
      const issues: string[] = [];
      const transactionIds = new Set(snapshot.transactions.map((transaction) => transaction.id));
      const activeBarcodes = new Set<string>();

      for (const entry of snapshot.entries) {
        if (!transactionIds.has(entry.transactionId)) {
          issues.push(`Ledger entry ${entry.id} references a missing transaction.`);
        }
      }

      for (const issue of validateUnitConversions(snapshot.conversions)) {
        issues.push(issue);
      }

      for (const barcode of snapshot.barcodes) {
        for (const issue of validateBarcodeRecord(barcode)) {
          issues.push(issue);
        }
        if (barcode.status !== "active") continue;
        const key = `${barcode.tenantId}:${barcode.normalizedValue}`;
        if (activeBarcodes.has(key)) {
          issues.push(`Active barcode ${barcode.normalizedValue} is duplicated.`);
        }
        activeBarcodes.add(key);
      }

      return { issues, ok: issues.length === 0 };
    }
  };
}
