import type { ProductCategory } from "@/demo/types";

/** Canonical product record with outreach email fields. */
export type Product = {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  category: ProductCategory;
  image: string;
  material: string;
  capacity: string;
  color: string;
  unitsPerBox: number;
  stacksPerBox: number;
  unitsPerStack: number;
  compatibleLidsAccessories: string[];
  basePrice: number;
  personalizationAvailable: boolean;
  printArea: string;
  setupCost: number;
  screenCost: number;
  leadTimeDays: number;
  sourceUrl: string | null;
  productPageUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  customizerUrl: string;
  defaultCtaLabel: string;
  emailTitle: string;
  emailDescription: string;
  isEmailPromotable: boolean;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductEmailSnapshot = Pick<
  Product,
  | "id"
  | "name"
  | "sku"
  | "productPageUrl"
  | "imageUrl"
  | "thumbnailUrl"
  | "customizerUrl"
  | "defaultCtaLabel"
  | "emailTitle"
  | "emailDescription"
>;

export type CreateProductInput = Omit<Product, "id" | "tenantId" | "createdAt" | "updatedAt">;

export type UpdateProductInput = Partial<CreateProductInput>;
