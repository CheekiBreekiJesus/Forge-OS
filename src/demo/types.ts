export type Tenant = {
  id: string;
  name: string;
  slug: string;
  defaultLocale: "pt-PT" | "en";
};

export type ProductCategory =
  | "personalized-cups"
  | "paper-cups"
  | "reusable-cups"
  | "takeaway-packaging"
  | "bags"
  | "lids"
  | "accessories";

export type DemoProduct = {
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
};

export type LeadStatus = "new" | "qualified" | "quoted" | "converted";

export type DemoLead = {
  id: string;
  tenantId: string;
  companyName: string;
  contactName: string;
  status: LeadStatus;
  requestedProductId: string;
  quantity: number;
  notes: string;
};

export type QuoteStatus = "draft" | "sent" | "approved";

export type DemoQuote = {
  id: string;
  tenantId: string;
  leadId: string;
  productId: string;
  quantity: number;
  printColorCount: number;
  artworkStatus: "missing" | "received" | "approved";
  status: QuoteStatus;
  subtotal: number;
  vat: number;
  total: number;
};

export type ProductionOrderStatus =
  | "scheduled"
  | "in-progress"
  | "blocked"
  | "completed";

export type DemoProductionOrder = {
  id: string;
  tenantId: string;
  quoteId: string;
  productId: string;
  customerName: string;
  quantity: number;
  status: ProductionOrderStatus;
  scheduledDate: string;
  artworkStatus: "pending" | "approved";
  screenStatus: "pending" | "ready";
  machineId: string;
  progress: number;
  operatorNotes: string;
};

export type DemoMachine = {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  compatibleProductCategories: ProductCategory[];
  productionSpeedPerHour: number;
  loadingBayCapacity: number;
  status: "available" | "scheduled" | "maintenance";
};

export type DemoInventoryItem = {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  reservedQuantity: number;
  reorderPoint: number;
  unit: string;
};

export type DemoEventType =
  | "lead_created"
  | "quote_created"
  | "quote_approved"
  | "production_started"
  | "production_completed";

export type DemoEvent = {
  id: string;
  tenantId: string;
  type: DemoEventType;
  title: string;
  createdAt: string;
};

export type DemoQuoteRequest = {
  id: string;
  tenantId: string;
  source: "website" | "manual" | "email";
  companyName: string;
  contactName: string;
  email: string;
  productId: string;
  quantity: number;
  message: string;
};

export type DemoEmailTemplate = {
  id: string;
  tenantId: string;
  eventType: DemoEventType;
  locale: "pt-PT" | "en";
  subject: string;
  body: string;
};

export type DemoWebhookEvent = {
  id: string;
  tenantId: string;
  eventType: DemoEventType;
  destination: "n8n";
  status: "queued" | "sent" | "failed";
  payload: Record<string, string | number | boolean | null>;
  createdAt: string;
};
