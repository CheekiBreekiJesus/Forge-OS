import type { Dictionary } from "../dictionaries";

export const dictionary: Dictionary = {
  app: {
    name: "ForgeOS",
    tenantLabel: "Reference tenant",
    environment: "Prototype foundation"
  },
  navigation: {
    dashboard: "Dashboard",
    customers: "Customers",
    products: "Products",
    orders: "Orders",
    production: "Production",
    inventory: "Inventory",
    machines: "Machines",
    maintenance: "Maintenance",
    marketing: "Marketing",
    settings: "Settings"
  },
  dashboard: {
    searchPlaceholder: "Search...",
    searchShortcut: "Ctrl + K",
    dateRange: "13 - 19 May 2024",
    customize: "Customize",
    greeting: "Good morning, operator.",
    userRole: "General Director",
    eyebrow: "Industrial operating system",
    title: "Here is the summary of your operation.",
    description: "Static prototype shell for the ForgeOS MVP foundation.",
    primaryAction: "Review MVP modules",
    secondaryAction: "Open settings",
    operationalSnapshot: "Operational snapshot",
    modulesTitle: "MVP module placeholders",
    nextStepsTitle: "Recommended next tasks",
    languageLabel: "Language",
    status: {
      prototype: "Prototype",
      foundation: "Foundation",
      planned: "Planned",
      online: "Online",
      operational: "Operational",
      production: "Production"
    },
    metrics: [
      {
        label: "Production OEE",
        value: "78.5%",
        detail: "vs last week",
        trend: "+ 6.4%",
        tone: "green"
      },
      {
        label: "Weekly revenue",
        value: "124,850",
        detail: "vs last week",
        trend: "+ 12.7%",
        tone: "green"
      },
      {
        label: "Open quotes",
        value: "18",
        detail: "vs last week",
        trend: "+ 2",
        tone: "blue"
      },
      {
        label: "Late orders",
        value: "7",
        detail: "vs last week",
        trend: "- 3",
        tone: "red"
      },
      {
        label: "Maintenance alerts",
        value: "5",
        detail: "vs last week",
        trend: "- 1",
        tone: "amber"
      }
    ],
    production: {
      title: "Production - OEE",
      score: "78.5%",
      availability: "Availability",
      performance: "Performance",
      quality: "Quality",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    inventory: {
      title: "Inventory - Summary",
      viewAll: "View all",
      items: [
        {
          name: "Natural ABS",
          category: "Raw material",
          quantity: "2,450 kg",
          minimum: "Min: 1,000 kg",
          tone: "green"
        },
        {
          name: "Polypropylene",
          category: "Raw material",
          quantity: "1,200 kg",
          minimum: "Min: 1,000 kg",
          tone: "amber"
        },
        {
          name: "P20 steel",
          category: "Raw material",
          quantity: "850 kg",
          minimum: "Min: 1,000 kg",
          tone: "red"
        },
        {
          name: "Packaging box M",
          category: "Packaging material",
          quantity: "1,500 un",
          minimum: "Min: 500 un",
          tone: "green"
        },
        {
          name: "Finished product A",
          category: "Finished product",
          quantity: "320 un",
          minimum: "Min: 200 un",
          tone: "green"
        }
      ]
    },
    activity: {
      title: "Alerts and activity",
      viewAll: "View all",
      items: [
        {
          title: "Preventive maintenance on injector 02",
          detail: "Due in 2 days",
          time: "09:15",
          priority: "High",
          tone: "red"
        },
        {
          title: "Mold JG-102 needs maintenance",
          detail: "Next week",
          time: "08:47",
          priority: "Medium",
          tone: "amber"
        },
        {
          title: "Production order OP-045 delayed",
          detail: "1 day late",
          time: "08:30",
          priority: "High",
          tone: "red"
        },
        {
          title: "Low stock: P20 steel",
          detail: "Below minimum",
          time: "07:58",
          priority: "High",
          tone: "red"
        },
        {
          title: "Quote Q-0487 awaiting response",
          detail: "Client: demo account",
          time: "Yesterday",
          priority: "Low",
          tone: "green"
        }
      ]
    },
    orders: {
      title: "Production orders",
      viewAll: "View all",
      headers: {
        order: "Order",
        product: "Product",
        quantity: "Quantity",
        progress: "Progress",
        delivery: "Delivery"
      },
      rows: [
        {
          order: "OP-045",
          product: "Technical box A",
          quantity: "1,200 un",
          progress: "65%",
          delivery: "17 May",
          tone: "green"
        },
        {
          order: "OP-046",
          product: "Support B",
          quantity: "800 un",
          progress: "40%",
          delivery: "18 May",
          tone: "amber"
        },
        {
          order: "OP-047",
          product: "Cover C",
          quantity: "500 un",
          progress: "80%",
          delivery: "20 May",
          tone: "green"
        },
        {
          order: "OP-048",
          product: "Set D",
          quantity: "300 un",
          progress: "20%",
          delivery: "21 May",
          tone: "red"
        }
      ]
    },
    copilot: {
      title: "AI Copilot",
      badge: "Beta",
      prompt: "Which molds need maintenance next month?",
      answer:
        "This prototype keeps AI disabled. The future assistant will summarize tenant-scoped operational records after privacy rules are defined.",
      input: "Ask something..."
    },
    modules: [
      {
        key: "dashboard",
        title: "Dashboard",
        description: "High-level overview for operational teams.",
        status: "Foundation"
      },
      {
        key: "customers",
        title: "Customers",
        description: "Future CRM records and customer activity.",
        status: "Planned"
      },
      {
        key: "products",
        title: "Products",
        description: "Future products, variants, and production parameters.",
        status: "Planned"
      },
      {
        key: "orders",
        title: "Orders",
        description: "Future customer orders and job requirements.",
        status: "Planned"
      },
      {
        key: "production",
        title: "Production",
        description: "Future production jobs and technical sheets.",
        status: "Planned"
      },
      {
        key: "inventory",
        title: "Inventory",
        description: "Future stock records for materials and consumables.",
        status: "Planned"
      },
      {
        key: "machines",
        title: "Machines",
        description: "Future equipment records and setup documentation.",
        status: "Planned"
      },
      {
        key: "maintenance",
        title: "Maintenance",
        description: "Future preventive and corrective maintenance tasks.",
        status: "Planned"
      },
      {
        key: "marketing",
        title: "Marketing",
        description: "Future content and campaign support.",
        status: "Planned"
      },
      {
        key: "settings",
        title: "Settings",
        description: "Future tenant configuration and localization controls.",
        status: "Planned"
      }
    ],
    nextSteps: [
      "Choose database, ORM, and authentication provider.",
      "Define tenant membership and role boundaries.",
      "Create the first customer, product, order, and production schemas.",
      "Keep all operational copy in localization dictionaries."
    ],
    footer: {
      version: "ForgeOS v0.1.0",
      copyright: "Prototype foundation. No private operational data is included.",
      system: "System",
      database: "Database",
      backup: "Backup",
      environment: "Environment",
      support: "Support"
    }
  },
  modulePage: {
    backToDashboard: "Back to dashboard",
    prototypeNotice: "Static MVP planning page. Data, permissions, and tenant isolation are not implemented yet.",
    primaryAction: "Define schema",
    secondaryAction: "Review workflow",
    readinessTitle: "Readiness",
    roadmapTitle: "Next build steps",
    emptyStateTitle: "No records yet",
    emptyStateDescription: "This module is ready for UI and data model design, but no business data is stored.",
    tableHeaders: {
      area: "Area",
      priority: "Priority",
      status: "Status",
      owner: "Owner"
    },
    modules: {
      customers: {
        eyebrow: "CRM foundation",
        title: "Customers",
        description: "Prepare the customer workspace for tenant-scoped company records, contacts, notes, and order history.",
        stats: [
          { label: "Data model", value: "Draft", detail: "Customer fields exist in the handover docs." },
          { label: "Privacy", value: "High", detail: "Contact data must not appear in seed data." },
          { label: "MVP flow", value: "Next", detail: "List, detail, and quick-create screens." }
        ],
        roadmap: ["Confirm required customer fields.", "Design tenant-scoped customer list and detail states.", "Add validation before persistence."],
        tableRows: [
          { area: "Customer list", priority: "High", status: "Planned", owner: "CRM" },
          { area: "Customer detail", priority: "High", status: "Planned", owner: "CRM" },
          { area: "Contact notes", priority: "Medium", status: "Planned", owner: "CRM" }
        ]
      },
      products: {
        eyebrow: "Catalog foundation",
        title: "Products",
        description: "Prepare product and variant management for manufactured items, consumables, and tenant-specific production parameters.",
        stats: [
          { label: "Variants", value: "Needed", detail: "Cup sizes and product options require variants." },
          { label: "Parameters", value: "Config", detail: "Throughput and setup values must be tenant configurable." },
          { label: "MVP flow", value: "Next", detail: "Product list, detail, and variant setup." }
        ],
        roadmap: ["Define product and variant forms.", "Separate reusable parameters from tenant defaults.", "Connect products to orders and production jobs later."],
        tableRows: [
          { area: "Product list", priority: "High", status: "Planned", owner: "Products" },
          { area: "Variants", priority: "High", status: "Planned", owner: "Products" },
          { area: "Production defaults", priority: "Medium", status: "Planned", owner: "Production" }
        ]
      },
      orders: {
        eyebrow: "Order operations",
        title: "Orders",
        description: "Prepare customer order tracking with line items, requested delivery dates, and future production job creation.",
        stats: [
          { label: "Order lines", value: "Required", detail: "One order may include multiple products." },
          { label: "Statuses", value: "Draft", detail: "Status workflow still needs confirmation." },
          { label: "MVP flow", value: "Next", detail: "Order list, detail, and line capture." }
        ],
        roadmap: ["Confirm order status names.", "Design quick-entry for phone orders.", "Link order lines to production jobs later."],
        tableRows: [
          { area: "Order list", priority: "High", status: "Planned", owner: "Orders" },
          { area: "Order detail", priority: "High", status: "Planned", owner: "Orders" },
          { area: "Line items", priority: "High", status: "Planned", owner: "Orders" }
        ]
      },
      production: {
        eyebrow: "Shop-floor workflow",
        title: "Production",
        description: "Prepare production jobs, technical sheets, setup notes, quality checks, rejects, and operator notes.",
        stats: [
          { label: "Technical sheets", value: "Core", detail: "Reusable templates plus job-specific copies are likely needed." },
          { label: "Reject tracking", value: "MVP", detail: "Planned, produced, and rejected quantities are important." },
          { label: "Print view", value: "Later", detail: "Production sheets should become printable." }
        ],
        roadmap: ["Define production job lifecycle.", "Design technical sheet structure.", "Add print/export after core data exists."],
        tableRows: [
          { area: "Jobs list", priority: "High", status: "Planned", owner: "Production" },
          { area: "Technical sheets", priority: "High", status: "Planned", owner: "Production" },
          { area: "Quality checks", priority: "Medium", status: "Planned", owner: "Production" }
        ]
      },
      inventory: {
        eyebrow: "Warehouse foundation",
        title: "Inventory",
        description: "Prepare basic stock records for materials, finished products, consumables, spare parts, and reorder thresholds.",
        stats: [
          { label: "Stock records", value: "MVP", detail: "Basic on-hand quantity comes before movements." },
          { label: "Locations", value: "Later", detail: "Location model still needs confirmation." },
          { label: "Reorder", value: "Needed", detail: "Thresholds should be tenant configurable." }
        ],
        roadmap: ["Define inventory item categories.", "Create basic stock list states.", "Postpone stock movements until the basics are validated."],
        tableRows: [
          { area: "Stock list", priority: "High", status: "Planned", owner: "Inventory" },
          { area: "Reorder thresholds", priority: "Medium", status: "Planned", owner: "Inventory" },
          { area: "Suppliers", priority: "Medium", status: "Deferred", owner: "Purchasing" }
        ]
      },
      machines: {
        eyebrow: "Equipment records",
        title: "Machines",
        description: "Prepare machine records, setup documentation, status tracking, and links to production and maintenance.",
        stats: [
          { label: "Machine registry", value: "MVP", detail: "Name, type, model, status, and notes." },
          { label: "Setup docs", value: "Needed", detail: "Useful before complex telemetry." },
          { label: "Telemetry", value: "Deferred", detail: "Not part of the first MVP." }
        ],
        roadmap: ["Define machine record fields.", "Design setup documentation screen.", "Link machines to jobs and maintenance tasks later."],
        tableRows: [
          { area: "Machine list", priority: "High", status: "Planned", owner: "Machines" },
          { area: "Setup notes", priority: "High", status: "Planned", owner: "Production" },
          { area: "Telemetry", priority: "Low", status: "Deferred", owner: "Machines" }
        ]
      },
      maintenance: {
        eyebrow: "CMMS foundation",
        title: "Maintenance",
        description: "Prepare preventive and corrective maintenance planning for machines, downtime notes, and spare parts usage.",
        stats: [
          { label: "Tasks", value: "Planned", detail: "Preventive and corrective task types." },
          { label: "Downtime", value: "Later", detail: "Track once machine records exist." },
          { label: "Spare parts", value: "Later", detail: "Connect to inventory after stock basics." }
        ],
        roadmap: ["Define maintenance task statuses.", "Create task list and machine-linked detail pages.", "Connect spare parts after inventory module exists."],
        tableRows: [
          { area: "Task list", priority: "Medium", status: "Planned", owner: "Maintenance" },
          { area: "Machine link", priority: "Medium", status: "Planned", owner: "Machines" },
          { area: "Spare parts", priority: "Low", status: "Deferred", owner: "Inventory" }
        ]
      },
      marketing: {
        eyebrow: "Content tooling",
        title: "Marketing",
        description: "Prepare a simple workspace for content ideas, marketing assets, campaign notes, and future AI-assisted drafting.",
        stats: [
          { label: "Assets", value: "Later", detail: "MarketingAsset exists in the data model draft." },
          { label: "Brevo", value: "Deferred", detail: "No direct integration in the foundation." },
          { label: "AI", value: "Deferred", detail: "Provider and privacy rules are unresolved." }
        ],
        roadmap: ["Define marketing asset fields.", "Keep content localized by locale.", "Postpone external integrations."],
        tableRows: [
          { area: "Asset list", priority: "Low", status: "Planned", owner: "Marketing" },
          { area: "Campaign notes", priority: "Low", status: "Planned", owner: "Marketing" },
          { area: "Email integration", priority: "Low", status: "Deferred", owner: "Marketing" }
        ]
      },
      settings: {
        eyebrow: "Tenant configuration",
        title: "Settings",
        description: "Prepare tenant settings for locale defaults, company configuration, users, roles, and future permissions.",
        stats: [
          { label: "Default locale", value: "pt-PT", detail: "Reference deployment defaults to European Portuguese." },
          { label: "Users", value: "Deferred", detail: "Auth provider must be chosen first." },
          { label: "Roles", value: "Draft", detail: "Role names exist but permissions are open." }
        ],
        roadmap: ["Choose auth provider.", "Define tenant membership rules.", "Add safe environment variable conventions."],
        tableRows: [
          { area: "Tenant profile", priority: "High", status: "Planned", owner: "Admin" },
          { area: "Users and roles", priority: "High", status: "Blocked", owner: "Auth" },
          { area: "Localization", priority: "High", status: "Foundation", owner: "Platform" }
        ]
      }
    }
  }
};
