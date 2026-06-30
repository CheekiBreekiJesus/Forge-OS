import { createRecordId } from "@/domain/ids";
import type { CreateProductInput, Product, UpdateProductInput } from "@/domain/product-types";
import type { ForgeOSDatabase } from "../db";
import { PersistenceError, type ProductRepository } from "../interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export function createProductRepository(db: ForgeOSDatabase): ProductRepository {
  return {
    async list(tenantId) {
      return db.products.where("tenantId").equals(tenantId).filter((p) => !p.archivedAt).toArray();
    },
    async getById(tenantId, id) {
      const row = await db.products.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getBySku(tenantId, sku) {
      const rows = await db.products
        .where("[tenantId+sku]")
        .equals([tenantId, sku])
        .toArray();
      return rows[0] ?? null;
    },
    async create(tenantId, input: CreateProductInput) {
      const timestamp = nowIso();
      const product: Product = {
        ...input,
        id: createRecordId("prod"),
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.products.put(product);
      return product;
    },
    async update(tenantId, id, input: UpdateProductInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Product not found.");
      const updated: Product = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.products.put(updated);
      return updated;
    },
    async createMany(tenantId, inputs: CreateProductInput[]) {
      const created: Product[] = [];
      for (const input of inputs) {
        const existing = await this.getBySku(tenantId, input.sku);
        if (existing) {
          created.push(await this.update(tenantId, existing.id, input));
        } else {
          created.push(await this.create(tenantId, input));
        }
      }
      return created;
    },
    async listEmailPromotable(tenantId) {
      const rows = await this.list(tenantId);
      return rows.filter((p) => p.isEmailPromotable && p.active);
    }
  };
}

export function demoProductToCreateInput(
  demo: import("@/demo/types").DemoProduct,
  overrides?: Partial<CreateProductInput>
): CreateProductInput {
  const baseUrl = "https://www.jhgomes.pt";
  return {
    active: true,
    archivedAt: null,
    basePrice: demo.basePrice,
    capacity: demo.capacity,
    category: demo.category,
    color: demo.color,
    compatibleLidsAccessories: demo.compatibleLidsAccessories,
    customizerUrl: `${baseUrl}/personalizar`,
    defaultCtaLabel: demo.personalizationAvailable ? "Ver produto" : "Saber mais",
    emailDescription: `${demo.name} — ${demo.material}, ${demo.capacity}`,
    emailTitle: demo.name,
    image: demo.image,
    imageUrl: demo.image.startsWith("http") ? demo.image : "",
    isEmailPromotable: demo.personalizationAvailable,
    leadTimeDays: demo.leadTimeDays,
    material: demo.material,
    name: demo.name,
    personalizationAvailable: demo.personalizationAvailable,
    printArea: demo.printArea,
    productPageUrl: demo.sourceUrl ?? `${baseUrl}/produtos/${demo.sku.toLowerCase()}`,
    screenCost: demo.screenCost,
    setupCost: demo.setupCost,
    sku: demo.sku,
    sourceUrl: demo.sourceUrl,
    stacksPerBox: demo.stacksPerBox,
    thumbnailUrl: demo.image.startsWith("http") ? demo.image : "",
    unitsPerBox: demo.unitsPerBox,
    unitsPerStack: demo.unitsPerStack,
    ...overrides
  };
}
