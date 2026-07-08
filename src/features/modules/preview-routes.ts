import type { PreviewModuleKey } from "@/modules/config";

export const previewModulePrimaryHref: Record<PreviewModuleKey, string> = {
  crm: "leadops",
  salesOrders: "quotations",
  molds: "maintenance",
  quality: "production",
  purchasing: "inventory",
  suppliers: "purchasing",
  sales: "leadops",
  billing: "reports",
  reports: "leadops"
};

export const previewModuleSecondaryHref: Record<PreviewModuleKey, string> = {
  crm: "customers",
  salesOrders: "production",
  molds: "production",
  quality: "reports",
  purchasing: "suppliers",
  suppliers: "inventory",
  sales: "quotations",
  billing: "quotations",
  reports: "production"
};
