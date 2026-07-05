import type { Product } from "@/domain/product-types";

export function isCupProduct(product: Product): boolean {
  return (
    product.personalizationAvailable ||
    product.category.includes("cup") ||
    product.sku.toUpperCase().includes("CUP")
  );
}

export function resolveProductPreviewUrl(product: Product | null): string | null {
  if (!product) return null;
  return product.imageUrl || product.thumbnailUrl || product.image || null;
}

export function filterCupProducts(products: Product[]): Product[] {
  return products.filter(isCupProduct);
}
