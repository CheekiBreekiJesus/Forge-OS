import type {
  DemoEvent,
  DemoInventoryItem,
  DemoLead,
  DemoMachine,
  DemoProduct,
  DemoProductionOrder,
  DemoQuote,
  Tenant
} from "./types";

export const jhGomesTenant: Tenant = {
  id: "tenant_jh_gomes",
  name: "JH Gomes",
  slug: "jh-gomes",
  defaultLocale: "pt-PT"
};

export const demoProducts: DemoProduct[] = [
  {
    id: "prod_pp_cup_250",
    tenantId: jhGomesTenant.id,
    name: "Personalized PP Cup 250 ml",
    sku: "JHG-CUP-PP-250",
    category: "personalized-cups",
    image: "/demo/products/pp-cup-250.svg",
    material: "Polypropylene",
    capacity: "250 ml",
    color: "Transparent",
    unitsPerBox: 1000,
    stacksPerBox: 20,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Flat lid 250 ml", "Cup sleeve"],
    basePrice: 0.045,
    personalizationAvailable: true,
    printArea: "60 x 45 mm",
    setupCost: 35,
    screenCost: 28,
    leadTimeDays: 7,
    sourceUrl: null
  },
  {
    id: "prod_pp_cup_330",
    tenantId: jhGomesTenant.id,
    name: "Personalized PP Cup 330 ml",
    sku: "JHG-CUP-PP-330",
    category: "personalized-cups",
    image: "/demo/products/pp-cup-330.svg",
    material: "Polypropylene",
    capacity: "330 ml",
    color: "Transparent",
    unitsPerBox: 1000,
    stacksPerBox: 20,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Flat lid 330 ml", "Dome lid 330 ml"],
    basePrice: 0.052,
    personalizationAvailable: true,
    printArea: "70 x 55 mm",
    setupCost: 35,
    screenCost: 28,
    leadTimeDays: 7,
    sourceUrl: null
  },
  {
    id: "prod_pp_cup_500",
    tenantId: jhGomesTenant.id,
    name: "Personalized PP Cup 500 ml",
    sku: "JHG-CUP-PP-500",
    category: "personalized-cups",
    image: "/demo/products/pp-cup-500.svg",
    material: "Polypropylene",
    capacity: "500 ml",
    color: "Transparent",
    unitsPerBox: 800,
    stacksPerBox: 16,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Flat lid 500 ml", "Dome lid 500 ml"],
    basePrice: 0.071,
    personalizationAvailable: true,
    printArea: "85 x 65 mm",
    setupCost: 45,
    screenCost: 32,
    leadTimeDays: 9,
    sourceUrl: null
  },
  {
    id: "prod_paper_cup_250",
    tenantId: jhGomesTenant.id,
    name: "Paper Cup 250 ml",
    sku: "JHG-CUP-PAPER-250",
    category: "paper-cups",
    image: "/demo/products/paper-cup-250.svg",
    material: "Paperboard",
    capacity: "250 ml",
    color: "White",
    unitsPerBox: 1000,
    stacksPerBox: 20,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Paper cup lid 80 mm"],
    basePrice: 0.063,
    personalizationAvailable: true,
    printArea: "Wrap band",
    setupCost: 50,
    screenCost: 0,
    leadTimeDays: 12,
    sourceUrl: null
  },
  {
    id: "prod_reusable_cup_400",
    tenantId: jhGomesTenant.id,
    name: "Reusable Event Cup 400 ml",
    sku: "JHG-CUP-REUSE-400",
    category: "reusable-cups",
    image: "/demo/products/reusable-cup-400.svg",
    material: "Reusable PP",
    capacity: "400 ml",
    color: "Frosted",
    unitsPerBox: 500,
    stacksPerBox: 10,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Cup lanyard", "Return crate"],
    basePrice: 0.18,
    personalizationAvailable: true,
    printArea: "75 x 60 mm",
    setupCost: 45,
    screenCost: 32,
    leadTimeDays: 10,
    sourceUrl: null
  },
  {
    id: "prod_takeaway_box",
    tenantId: jhGomesTenant.id,
    name: "Takeaway Packaging Box",
    sku: "JHG-PACK-BOX-M",
    category: "takeaway-packaging",
    image: "/demo/products/takeaway-box.svg",
    material: "Kraft board",
    capacity: "Medium",
    color: "Natural",
    unitsPerBox: 300,
    stacksPerBox: 6,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Paper bag M"],
    basePrice: 0.16,
    personalizationAvailable: false,
    printArea: "Label only",
    setupCost: 0,
    screenCost: 0,
    leadTimeDays: 3,
    sourceUrl: null
  },
  {
    id: "prod_bag_kraft_m",
    tenantId: jhGomesTenant.id,
    name: "Kraft Paper Bag M",
    sku: "JHG-BAG-KRAFT-M",
    category: "bags",
    image: "/demo/products/kraft-bag-m.svg",
    material: "Kraft paper",
    capacity: "Medium",
    color: "Natural",
    unitsPerBox: 250,
    stacksPerBox: 5,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Takeaway box M"],
    basePrice: 0.11,
    personalizationAvailable: true,
    printArea: "90 x 70 mm",
    setupCost: 40,
    screenCost: 25,
    leadTimeDays: 8,
    sourceUrl: null
  },
  {
    id: "prod_lid_330_flat",
    tenantId: jhGomesTenant.id,
    name: "Flat Lid 330 ml",
    sku: "JHG-LID-330-FLAT",
    category: "lids",
    image: "/demo/products/lid-330-flat.svg",
    material: "PET",
    capacity: "330 ml",
    color: "Clear",
    unitsPerBox: 1000,
    stacksPerBox: 20,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["Personalized PP Cup 330 ml"],
    basePrice: 0.026,
    personalizationAvailable: false,
    printArea: "Not available",
    setupCost: 0,
    screenCost: 0,
    leadTimeDays: 3,
    sourceUrl: null
  },
  {
    id: "prod_cup_sleeve",
    tenantId: jhGomesTenant.id,
    name: "Cup Sleeve",
    sku: "JHG-ACC-SLEEVE",
    category: "accessories",
    image: "/demo/products/cup-sleeve.svg",
    material: "Cardboard",
    capacity: "Universal",
    color: "Natural",
    unitsPerBox: 1000,
    stacksPerBox: 20,
    unitsPerStack: 50,
    compatibleLidsAccessories: ["250 ml cups", "330 ml cups", "500 ml cups"],
    basePrice: 0.019,
    personalizationAvailable: true,
    printArea: "80 x 35 mm",
    setupCost: 30,
    screenCost: 20,
    leadTimeDays: 6,
    sourceUrl: null
  }
];

export const demoLeads: DemoLead[] = [
  {
    id: "lead_atlantic_events",
    tenantId: jhGomesTenant.id,
    companyName: "Atlantic Events Demo",
    contactName: "Marta Silva",
    status: "quoted",
    requestedProductId: "prod_pp_cup_330",
    quantity: 12000,
    notes: "Two-color logo for summer event cups."
  },
  {
    id: "lead_cafe_ribeira",
    tenantId: jhGomesTenant.id,
    companyName: "Cafe Ribeira Demo",
    contactName: "Tiago Costa",
    status: "qualified",
    requestedProductId: "prod_paper_cup_250",
    quantity: 5000,
    notes: "Needs quote this week."
  },
  {
    id: "lead_market_booth",
    tenantId: jhGomesTenant.id,
    companyName: "Market Booth Demo",
    contactName: "Ines Almeida",
    status: "new",
    requestedProductId: "prod_bag_kraft_m",
    quantity: 2500,
    notes: "Asked for bag personalization."
  }
];

export const demoQuotes: DemoQuote[] = [
  {
    id: "quote_1007",
    tenantId: jhGomesTenant.id,
    leadId: "lead_atlantic_events",
    productId: "prod_pp_cup_330",
    quantity: 12000,
    printColorCount: 2,
    artworkStatus: "received",
    status: "sent",
    subtotal: 792,
    vat: 182.16,
    total: 974.16
  },
  {
    id: "quote_1008",
    tenantId: jhGomesTenant.id,
    leadId: "lead_cafe_ribeira",
    productId: "prod_paper_cup_250",
    quantity: 5000,
    printColorCount: 1,
    artworkStatus: "missing",
    status: "draft",
    subtotal: 365,
    vat: 83.95,
    total: 448.95
  },
  {
    id: "quote_1009",
    tenantId: jhGomesTenant.id,
    leadId: "lead_market_booth",
    productId: "prod_bag_kraft_m",
    quantity: 2500,
    printColorCount: 1,
    artworkStatus: "approved",
    status: "approved",
    subtotal: 340,
    vat: 78.2,
    total: 418.2
  }
];

export const demoMachines: DemoMachine[] = [
  {
    id: "machine_uv_screen_01",
    tenantId: jhGomesTenant.id,
    name: "UV Screen Line 01",
    type: "UV screen printing",
    compatibleProductCategories: ["personalized-cups", "reusable-cups"],
    productionSpeedPerHour: 2500,
    loadingBayCapacity: 500,
    status: "scheduled"
  },
  {
    id: "machine_bag_screen_01",
    tenantId: jhGomesTenant.id,
    name: "Bag Screen Station",
    type: "Flat screen printing",
    compatibleProductCategories: ["bags", "accessories"],
    productionSpeedPerHour: 900,
    loadingBayCapacity: 250,
    status: "available"
  }
];

export const demoProductionOrders: DemoProductionOrder[] = [
  {
    id: "po_240615_01",
    tenantId: jhGomesTenant.id,
    quoteId: "quote_1009",
    productId: "prod_bag_kraft_m",
    customerName: "Market Booth Demo",
    quantity: 2500,
    status: "scheduled",
    scheduledDate: "2026-06-15",
    artworkStatus: "approved",
    screenStatus: "ready",
    machineId: "machine_bag_screen_01",
    progress: 0,
    operatorNotes: "Use one-color black print. Confirm carton labels before packing."
  },
  {
    id: "po_240615_02",
    tenantId: jhGomesTenant.id,
    quoteId: "quote_1007",
    productId: "prod_pp_cup_330",
    customerName: "Atlantic Events Demo",
    quantity: 12000,
    status: "blocked",
    scheduledDate: "2026-06-15",
    artworkStatus: "pending",
    screenStatus: "pending",
    machineId: "machine_uv_screen_01",
    progress: 0,
    operatorNotes: "Waiting for final vector logo approval."
  }
];

export const demoInventoryItems: DemoInventoryItem[] = [
  {
    id: "inv_pp_330_clear",
    tenantId: jhGomesTenant.id,
    name: "PP cups 330 ml clear",
    sku: "STOCK-PP-330-CLEAR",
    quantityOnHand: 18000,
    reservedQuantity: 12000,
    reorderPoint: 10000,
    unit: "un"
  },
  {
    id: "inv_kraft_bag_m",
    tenantId: jhGomesTenant.id,
    name: "Kraft paper bag M",
    sku: "STOCK-BAG-KRAFT-M",
    quantityOnHand: 3200,
    reservedQuantity: 2500,
    reorderPoint: 2000,
    unit: "un"
  },
  {
    id: "inv_black_ink",
    tenantId: jhGomesTenant.id,
    name: "Black UV ink",
    sku: "INK-UV-BLACK",
    quantityOnHand: 4,
    reservedQuantity: 1,
    reorderPoint: 5,
    unit: "kg"
  }
];

export const demoEvents: DemoEvent[] = [
  {
    id: "event_001",
    tenantId: jhGomesTenant.id,
    type: "lead_created",
    title: "Lead created for Market Booth Demo",
    createdAt: "2026-06-15T08:25:00.000Z"
  },
  {
    id: "event_002",
    tenantId: jhGomesTenant.id,
    type: "quote_created",
    title: "Quote 1008 drafted for Cafe Ribeira Demo",
    createdAt: "2026-06-15T09:10:00.000Z"
  },
  {
    id: "event_003",
    tenantId: jhGomesTenant.id,
    type: "quote_approved",
    title: "Quote 1009 approved and ready for production",
    createdAt: "2026-06-15T10:40:00.000Z"
  }
];
