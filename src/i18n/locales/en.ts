import type { Dictionary } from "../dictionaries";

export const dictionary: Dictionary = {
  app: {
    name: "ForgeOS",
    tenantLabel: "Reference tenant",
    environment: "Prototype foundation",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu"
  },
  navigation: {
    dashboard: "Dashboard",
    crm: "CRM",
    customers: "Customers",
    products: "Products",
    orders: "Quotations",
    salesOrders: "Orders",
    production: "Production",
    inventory: "Inventory",
    machines: "Machines",
    maintenance: "Maintenance",
    molds: "Molds",
    quality: "Quality",
    purchasing: "Purchasing",
    suppliers: "Suppliers",
    sales: "Sales",
    billing: "Billing",
    reports: "Reports",
    marketing: "Marketing",
    leadops: "Outreach",
    settings: "Settings"
  },
  dashboard: {
    searchPlaceholder: "Search...",
    searchShortcut: "Ctrl + K",
    dateRange: "Demo",
    dateRangeThisWeek: "This week",
    customize: "Customize",
    demoLabel: "Preview data",
    theme: {
      switchToLight: "Switch to light theme",
      switchToDark: "Switch to dark theme"
    },
    sidebar: {
      newBadge: "New",
      newTitle: "New in ForgeOS",
      newAction: "See what's new",
      planTitle: "Reference tenant",
      planSubtitle: "Professional plan"
    },
    greeting: "Good morning, operator.",
    userName: "Operator",
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
    demoCards: {
      leads: "Leads",
      quotes: "Quotes",
      productionOrders: "Production orders",
      pendingArtwork: "Pending artwork",
      pendingScreens: "Pending screens",
      inventoryAlerts: "Inventory alerts",
      todayJobs: "Today's jobs",
      recentActivity: "Recent activity"
    },
    demoCardDetails: {
      leads: "new",
      quotes: "approved",
      productionOrders: "blocked",
      pendingArtwork: "Logo/artwork approval",
      pendingScreens: "Screen preparation",
      inventoryAlerts: "Below available threshold",
      todayJobs: "Scheduled for 2026-06-15",
      recentActivity: "n8n-ready demo events"
    },
    demoSections: {
      todayJobs: "Today's JH Gomes jobs",
      inventoryAlerts: "Inventory alerts",
      productCatalog: "JH Gomes product catalog",
      recentActivity: "Recent activity",
      viewCatalog: "Open catalog",
      noAlerts: "No inventory alerts",
      openJobCard: "Open job card",
      minimumPrefix: "min",
      unitsPerBox: "units/box"
    },
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
      backupDemo: "2 hours ago",
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
  },
  productCatalog: {
    eyebrow: "JH Gomes demo catalog",
    title: "Product catalog",
    description:
      "Tenant-scoped demo products for personalized cups, packaging, bags, lids, and accessories. These records are synthetic demo data and do not include private customer or supplier data.",
    sourceNotice:
      "source_url is present for future public imports. Current demo products are manually seeded and use no scraped private data.",
    fieldsTitle: "Required product fields",
    categories: {
      "personalized-cups": "Personalized cups",
      "paper-cups": "Paper cups",
      "reusable-cups": "Reusable cups",
      "takeaway-packaging": "Takeaway packaging",
      bags: "Bags",
      lids: "Lids",
      accessories: "Accessories"
    },
    fields: {
      sku: "SKU",
      category: "Category",
      image: "Image",
      material: "Material",
      capacity: "Capacity",
      color: "Color",
      unitsPerBox: "Units/box",
      stacksPerBox: "Stacks/box",
      unitsPerStack: "Units/stack",
      compatible: "Compatible lids/accessories",
      basePrice: "Base price",
      personalization: "Personalization",
      printArea: "Print area",
      setupCost: "Setup cost",
      screenCost: "Screen cost",
      leadTime: "Lead time",
      sourceUrl: "Source URL"
    },
    yes: "Yes",
    no: "No",
    days: "days",
    loading: "Loading products…",
    empty: "No products yet.",
    actions: { create: "New product" },
    table: {
      sku: "SKU",
      name: "Name",
      category: "Category",
      price: "Base price"
    },
    form: {
      createTitle: "Create product",
      editTitle: "Edit product",
      name: "Name",
      sku: "SKU",
      category: "Category",
      basePrice: "Base price",
      productPageUrl: "Product page URL",
      emailTitle: "Email title",
      emailPromotable: "Promotable in outreach emails",
      required: "Name and SKU are required."
    }
  },
  demoWorkflow: {
    eyebrow: "JH Gomes demo flow",
    title: "CRM to production demo",
    description:
      "Run the core demo path locally: lead, customer opportunity, personalized cup quote, artwork, approval, production order, job card, machine assignment, progress, and inventory reservation.",
    startDemo: "Run full demo path",
    currentStep: "Current step",
    reset: "Reset demo",
    sections: {
      lead: "Lead and opportunity",
      quote: "Personalized cup quote",
      production: "Production order",
      jobCard: "Machine job card",
      inventory: "Inventory reservation",
      events: "Automation events",
      automation: "Email and n8n hooks",
      copilot: "AI Copilot shell"
    },
    steps: [
      "Create lead",
      "Convert to customer/opportunity",
      "Create quote",
      "Upload artwork",
      "Approve quote",
      "Create production order",
      "Assign machine",
      "Update artwork and screen status",
      "Log production progress",
      "Reserve inventory"
    ],
    fields: {
      company: "Company",
      contact: "Contact",
      product: "Product",
      quantity: "Quantity",
      printColors: "Print colors",
      artwork: "Artwork",
      subtotal: "Subtotal",
      vat: "VAT",
      total: "Total",
      machine: "Machine",
      progress: "Progress",
      available: "Available",
      reserved: "Reserved",
      ink: "Ink",
      personalizationCost: "Personalization",
      demoArtworkFile: "demo-logo.svg",
      emptyValue: "-",
      unitSuffix: "un",
      demoNotesDefault: "Live demo lead for personalized event cups."
    },
    actions: {
      createLead: "Create lead",
      qualifyLead: "Qualify lead",
      convertLead: "Convert to customer",
      openOutreach: "Open in Contactos Comerciais",
      createQuote: "Create quote",
      uploadArtwork: "Upload artwork",
      approveQuote: "Approve quote",
      createProduction: "Create production order",
      openJobCard: "Open job card",
      assignMachine: "Assign machine",
      updateStatuses: "Update statuses",
      logProgress: "Log progress",
      logProduction: "Log production activity",
      reserveInventory: "Reserve inventory"
    },
    resetData: "Reset demo data",
    resetConfirm:
      "This restores the seeded demo records and keeps imported leads, manual records, settings, drafts, quotes, production orders, and uploaded assets. Continue?",
    cancel: "Cancel",
    actionRunning: "Running…",
    resultSuccess: "Action completed",
    resultError: "Action failed",
    openInLeadops: "Open in Contactos Comerciais",
    openCustomer: "Open customer",
    openQuotation: "Open quotation",
    openProduction: "Open production order",
    persistence: {
      loading: "Loading local database…",
      unavailable: "Local persistence unavailable"
    },
    status: {
      waiting: "Waiting",
      done: "Done",
      active: "Active"
    },
    jobCardLabels: {
      orderId: "Order ID",
      customer: "Customer",
      cupCapacity: "Cup capacity",
      material: "Material",
      artworkStatus: "Artwork status",
      screenStatus: "Screen status",
      predictedInk: "Predicted ink",
      loading: "Stack/loading",
      loadingBay: "Loading bay",
      assignedMachine: "Assigned machine",
      operatorNotes: "Operator notes",
      logoPreview: "Logo preview",
      label: "Label/sticker",
      qrUrl: "QR-ready job URL"
    },
    automationLabels: {
      quoteRequest: "Quote request form model",
      emailTemplates: "Email templates",
      webhookQueue: "n8n webhook queue",
      destination: "Destination",
      payload: "Payload",
      status: "Status"
    },
    copilotLabels: {
      suggestedPrompts: "Suggested prompts",
      answer: "Demo answer",
      actionRegistry: "Placeholder action registry"
    }
  },
  login: {
    eyebrow: "Demo access",
    title: "Sign in to ForgeOS",
    description: "Use the seeded JH Gomes demo workspace. This screen is a local demo shell and does not enable real authentication yet.",
    tenant: "Tenant",
    user: "Demo user",
    password: "Password",
    submit: "Enter dashboard",
    note: "Supabase Auth will replace this placeholder in the persistent MVP.",
    googleSignIn: "Continue with Google",
    microsoftSignIn: "Continue with Microsoft",
    orContinueLocal: "or continue with local demo",
    googleDialogTitle: "Google sign-in (hosted version)",
    googleDialogBody:
      "Google OAuth requires Supabase Auth and provider configuration in the hosted ForgeOS deployment. After login, your profile is prefilled from workspace membership and you complete company onboarding and sender identity setup.",
    microsoftDialogTitle: "Microsoft sign-in (hosted version)",
    microsoftDialogBody:
      "Microsoft OAuth requires Supabase Auth and provider configuration in the hosted ForgeOS deployment. After login, your profile is prefilled from workspace membership and you complete company onboarding and sender identity setup.",
    closeDialog: "Close"
  },
  settings: {
    eyebrow: "Workspace configuration",
    title: "Settings",
    description: "Configure company branding, your profile, sender identities, team preview users, integrations, and local backup.",
    loading: "Loading settings…",
    save: "Save changes",
    saving: "Saving…",
    saved: "Settings saved.",
    saveFailed: "Save failed. Please try again.",
    sections: {
      company: "Company",
      profile: "My profile",
      senders: "Sender identities",
      team: "Team",
      integrations: "Integrations",
      backup: "Data and backup"
    },
    company: {
      legalName: "Legal name",
      tradingName: "Trading name",
      vatNumber: "VAT number",
      websiteUrl: "Website URL",
      generalEmail: "General email",
      generalPhone: "General phone",
      addressLine1: "Address line 1",
      addressLine2: "Address line 2",
      postalCode: "Postal code",
      city: "City",
      region: "Region",
      country: "Country",
      logoPublicUrl: "Public logo URL (HTTPS)",
      linkedinUrl: "LinkedIn URL",
      facebookUrl: "Facebook URL",
      legalFooter: "Legal footer",
      uploadLogo: "Upload logo",
      removeLogo: "Remove logo",
      noLogo: "No logo",
      logoUploaded: "Logo uploaded.",
      invalidWebsite: "Website URL is invalid."
    },
    profile: {
      fullName: "Full name",
      jobTitle: "Job title",
      email: "Email",
      phone: "Phone",
      language: "Language",
      role: "Role"
    },
    senders: {
      add: "Add sender identity",
      created: "Sender identity created.",
      saved: "Sender identity saved.",
      defaultBadge: "Default",
      inactive: "Inactive",
      preview: "Preview signature",
      setDefault: "Set as default",
      archive: "Archive",
      archived: "Sender identity archived.",
      signaturePreview: "Signature preview",
      displayName: "Sender name",
      fromEmail: "From email",
      replyToEmail: "Reply-to email",
      phone: "Phone",
      jobTitle: "Job title"
    },
    team: {
      notice:
        "Local preview users are stored in IndexedDB only. They are not authenticated cloud accounts and do not connect to Google or Microsoft.",
      add: "Add local preview user",
      added: "Preview user added.",
      localPreview: "Local preview user",
      active: "Active",
      inactive: "Inactive"
    },
    integrations: {
      diagnostic: "Run diagnostic",
      statuses: {
        configured: "Configured",
        "not-configured": "Not configured",
        "local-only": "Local only",
        "hosted-feature": "Hosted version feature",
        unavailable: "Unavailable"
      },
      provider: {
        title: "Email delivery provider",
        description: "Server-side delivery readiness for protected outreach test emails. Secrets are never shown in the browser.",
        refresh: "Refresh provider status",
        loading: "Loading provider status...",
        unavailable: "Provider status is unavailable.",
        provider: "Provider",
        configured: "Configured",
        realSend: "Real send gate",
        testSend: "Test send gate",
        apiKey: "API key present",
        sender: "Sender configured",
        allowlist: "Allowlisted test recipients",
        yes: "Yes",
        no: "No",
        missing: "Missing",
        warnings: "Warnings"
      }
    },
    backup: {
      description: "Export or import a JSON backup of local ForgeOS data including profile entities and optional image assets.",
      export: "Export JSON backup",
      import: "Import JSON backup",
      exported: "Backup downloaded.",
      imported: "Backup restored.",
      invalid: "Invalid backup file."
    }
  },
  leadops: {
    eyebrow: "Outbound commercial contacts",
    title: "Outreach",
    description:
      "Review imported leads, campaign progress, and outreach status for the demo tenant. Data is synthetic and tenant-scoped.",
    backToDashboard: "Back to Outreach",
    searchPlaceholder: "Search company, contact, email, location, source, or website",
    clearFilters: "Clear filters",
    resultCount: "{count} leads shown",
    addToCampaign: "Add to campaign",
    addToCampaignDisabled: "Campaign assignment is disabled in this demo increment.",
    selectAllVisible: "Select all visible",
    emptyTitle: "No leads imported yet",
    emptyDescription: "Import a lead database or seed demo data to start outreach workflows.",
    noResultsTitle: "No leads match your filters",
    noResultsDescription: "Try clearing filters or broadening your search terms.",
    detailEyebrow: "Lead detail",
    detailTitle: "Lead profile",
    detailDescription: "Commercial contact workspace for generating, reviewing, approving, and simulating outreach messages.",
    detailPlaceholder: "Email composer, timeline, and campaign assignment.",
    sections: {
      kpis: "Outreach KPIs",
      campaigns: "Campaign overview",
      activity: "Recent activity",
      leads: "Lead list",
      import: "Import CSV/XLSX"
    },
    actions: {
      createLead: "New lead",
      convert: "Convert to customer"
    },
    form: {
      createTitle: "Create lead",
      companyName: "Company",
      contactName: "Contact",
      email: "Email",
      required: "Company and contact are required.",
      invalidEmail: "Enter a valid email address."
    },
    kpis: {
      totalLeads: "Total leads",
      ready: "Ready",
      queued: "Queued",
      contactedSent: "Contacted / sent",
      replies: "Replies",
      positiveReplies: "Positive replies",
      bounceRate: "Bounce rate",
      bounceRateUnavailable: "N/A",
      activeCampaigns: "Active campaigns"
    },
    filters: {
      industry: "Industry",
      status: "Status",
      quality: "Quality",
      sourceDatabase: "Source database",
      language: "Language",
      region: "Region",
      country: "Country",
      all: "All"
    },
    management: {
      importHistory: "Import history",
      noImportHistory: "No imports recorded yet.",
      createCampaignFromFilters: "Create campaign from filters",
      createCampaignFromSelection: "Create campaign from selection",
      viewCampaigns: "View campaigns",
      clearSelection: "Clear selection",
      category: "Category",
      region: "Region",
      sourceImport: "Source import",
      emailValidity: "Email validity",
      emailValidityValues: {
        valid: "Valid",
        missing: "Missing",
        invalid: "Invalid"
      },
      suppressionStatus: "Suppression",
      suppressionValues: {
        none: "None",
        unsubscribed: "Unsubscribed",
        bounced: "Bounced"
      },
      lastContacted: "Last contacted",
      campaignCount: "Campaigns",
      neverContacted: "Never contacted",
      neverContactedOnly: "Never contacted only",
      sendability: "Sendability",
      sendabilityValues: {
        sendable: "Ready for outreach",
        blocked: "Blocked"
      },
      importSummary: {
        selectBatch: "Select an import batch to view its summary.",
        status: "Status",
        rows: "Total rows",
        organizations: "Organizations imported",
        contacts: "Contacts imported",
        duplicates: "Duplicates skipped",
        invalid: "Invalid rows",
        profile: "Mapping profile",
        sheet: "Worksheet",
        linkedLeads: "Linked organizations"
      },
      pageLabel: "Page {page} of {pages}",
      previousPage: "Previous",
      nextPage: "Next"
    },
    segmentation: {
      createTitle: "Create campaign segment",
      createDescription: "Review matching contacts, sendable recipients, and exclusions before freezing the snapshot.",
      matchingOrganizations: "Matching organizations",
      matchingContacts: "Matching contacts",
      sendableRecipients: "Sendable recipients",
      exclusionsTitle: "Exclusions",
      exclusions: {
        missingEmail: "Missing email",
        invalidEmail: "Invalid email",
        suppressed: "Suppressed",
        duplicate: "Duplicate contacts",
        inactive: "Inactive"
      },
      campaignName: "Campaign name",
      campaignDescription: "Description (optional)",
      reviewDefinition: "Review segment definition",
      nameRequired: "Campaign name is required.",
      createFailed: "Could not create campaign.",
      creating: "Creating…",
      confirmCreate: "Create campaign"
    },
    campaigns: {
      eyebrow: "Campaign management",
      listTitle: "Outreach campaigns",
      listDescription: "Draft and operational campaigns with frozen recipient snapshots.",
      backToList: "Back to campaign list",
      name: "Name",
      status: "Status",
      createdAt: "Created",
      recipientCount: "Recipients",
      sendableCount: "Sendable",
      language: "Language",
      deliveryMode: "Delivery mode",
      deliveryModes: {
        simulation: "Simulation",
        provider_handoff: "Provider handoff"
      },
      metadataTitle: "Campaign metadata",
      noDescription: "No description provided.",
      snapshotCreated: "Snapshot created",
      exclusionsTitle: "Snapshot exclusions",
      excludedCount: "{count} excluded recipients in snapshot",
      segmentDefinitionTitle: "Segment definition",
      snapshotTitle: "Recipient snapshot",
      refreshRecipients: "Refresh recipients",
      confirmRefresh: "Confirm refresh",
      refreshSummary: "Added {added}, removed {removed}, newly suppressed {suppressed}, newly invalid {invalid}.",
      inclusionReason: "Inclusion reason",
      recipientStatus: "Status",
      includedCount: "{count} included recipients",
      nextStepTemplate: "Email template (Step 3)",
      nextStepTemplateHint: "Template selection and preview will be implemented in the next outreach step.",
      nextStepDrafts: "Message drafts (Step 3)",
      nextStepDraftsHint: "Draft generation and approval will be implemented in the next outreach step.",
      templates: {
        title: "Email template",
        description: "Edit the subject and plain-text body. Variables are filled from recipient snapshots and Settings.",
        subjectLabel: "Subject template",
        bodyLabel: "Plain-text body template",
        variablesTitle: "Available variables",
        saveTemplate: "Save template",
        saving: "Saving…",
        templateSaved: "Template saved.",
        previewSample: "Preview sample",
        previewTitle: "Sample preview",
        templateVersion: "Template version {version}",
        senderIncomplete: "Sender identity incomplete in Settings: {fields}. Draft approval will be blocked until this is fixed.",
        refreshSender: "Refresh sender data",
        refreshingSender: "Refreshing sender…",
        senderRefreshed: "Sender data refreshed ({count} drafts regenerated).",
        previewFieldsTitle: "Personalization details",
        previewGreeting: "Greeting",
        previewContact: "Contact name",
        previewOrganization: "Organization",
        previewOrganizationDisplay: "Formal organization name",
        previewCategory: "Localized category",
        previewSender: "Sender profile",
        previewSubject: "Subject",
        previewDemoWarning: "Demo sender values detected.",
        previewOrgAsContact: "Organization was treated as contact name.",
        previewUntranslatedCategory: "Untranslated category in draft.",
        greetingOverride: "Manual greeting",
        organizationDisplayOverride: "Manual formal name",
        applyPersonalization: "Apply personalization",
        includedRecipients: "Included recipients",
        unresolvedCount: "Unresolved template variables"
      },
      drafts: {
        title: "Personalized drafts",
        description: "Generate deterministic drafts for included recipients. Edited drafts are skipped during bulk regeneration.",
        generateAll: "Generate drafts",
        generating: "Generating…",
        generateSummary: "Generated {generated} drafts ({skipped} edited skipped, {needsReview} need review).",
        filterLabel: "Filter",
        filterAll: "All",
        pending: "Pending",
        drafted: "Drafted",
        needsReview: "Needs review",
        edited: "Edited",
        unresolved: "Unresolved variables",
        countSummary: "{drafted} drafted · {edited} edited",
        statusColumn: "Draft status",
        subjectColumn: "Subject",
        statuses: {
          PENDING: "Pending",
          DRAFTED: "Drafted",
          NEEDS_REVIEW: "Needs review",
          APPROVED: "Approved",
          EXCLUDED: "Excluded",
          OPENED_EXTERNALLY: "Opened externally",
          SENT_MANUALLY: "Sent manually",
          DELIVERED: "Delivered",
          SOFT_BOUNCED: "Soft bounced",
          HARD_BOUNCED: "Hard bounced",
          COMPLAINED: "Complaint",
          UNSUBSCRIBED: "Unsubscribed",
          DELIVERY_FAILED: "Delivery failed",
          DEFERRED: "Deferred",
          SKIPPED: "Skipped",
          SUPPRESSED: "Suppressed"
        },
        editedBadge: "Edited",
        editorTitle: "Edit draft",
        unresolvedWarning: "This draft contains unresolved variables and cannot be approved until corrected.",
        saveDraft: "Save draft",
        saving: "Saving…",
        draftSaved: "Draft saved.",
        regenerateOne: "Regenerate from template",
        confirmRegenerate: "Overwrite manual edits",
        regenerated: "Draft regenerated from template."
      },
      review: {
        title: "Review and send",
        description: "Approve safe drafts, open Gmail or Outlook, then confirm manual send after delivery outside ForgeOS.",
        approveOne: "Approve draft",
        bulkApproveSafe: "Approve all safe drafts",
        bulkSummary: "Approved {approved} drafts; skipped {skipped} unsafe recipients.",
        unsafeReasons: "Cannot approve",
        blockReasons: {
          missing_email: "missing email",
          invalid_email: "invalid email",
          suppressed: "suppressed contact",
          no_draft: "no draft generated",
          needs_review: "needs review",
          missing_subject: "missing subject",
          missing_body: "missing body",
          unresolved_variables: "unresolved variables",
          sender_incomplete: "sender identity incomplete",
          missing_opt_out: "missing opt-out instruction",
          campaign_locked: "campaign not editable",
          already_sent: "already sent",
          not_approved: "not approved",
          approval_stale: "approval stale"
        },
        approved: "Draft approved.",
        openedExternal: "External compose opened. Message is not marked as sent yet.",
        openedExternalStatus: "Opened externally — not sent",
        sentManualStatus: "Sent manually",
        markSentExternally: "Mark as sent externally",
        confirmSent: "Confirm manual send",
        confirmSentBody:
          "ForgeOS cannot independently verify delivery. Confirm that you sent this message externally.",
        operatorNote: "Operator note (optional)",
        markedSent: "Marked as sent externally.",
        simulateSend: "Simulate send",
        simulated: "Simulated send recorded (no external delivery).",
        invalidated: "Approval invalidated: {reason}",
        duplicateBlocked: "Duplicate send blocked for this campaign recipient.",
        cooldownWarning: "This contact was contacted recently. Override requires confirmation and reason.",
        cooldownOverride: "Override recent-contact cooldown"
      },
      progress: {
        title: "Campaign progress",
        total: "Included",
        drafted: "Drafted",
        needsReview: "Needs review",
        approved: "Approved",
        openedExternally: "Opened externally",
        manuallySent: "Sent manually",
        excluded: "Excluded",
        suppressed: "Suppressed",
        skipped: "Skipped"
      }
    },
    providerEvents: {
      title: "Provider events",
      description: "Recent delivery, bounce, complaint, unsubscribe, and unknown provider events with sanitized metadata.",
      empty: "No provider events recorded yet.",
      eventType: "Event",
      status: "Processing",
      effect: "Effect",
      receivedAt: "Received",
      message: "Message"
    },
    sendJobs: {
      title: "Campaign delivery (local simulation)",
      description:
        "Queue approved recipients into a local IndexedDB simulation job, then process one bounded batch at a time. No real email is sent.",
      simulationBanner: "Local simulation only. This path does not use the production durable store.",
      productionIncomplete: "Production durable store incomplete. Brevo campaign jobs remain disabled.",
      brevoDisabled: "Brevo production sending is disabled until hosted persistence and server routes are complete.",
      empty: "No send job has been queued for this campaign.",
      queueSimulation: "Queue simulation",
      processNextBatch: "Process next batch",
      pause: "Pause",
      resume: "Resume",
      cancel: "Cancel unsent",
      status: "Status",
      mode: "Mode",
      provider: "Provider",
      batchSize: "Batch size",
      dailyUsage: "Daily usage",
      processed: "Processed",
      sent: "Sent",
      failed: "Failed",
      retryPending: "Retry pending",
      skipped: "Skipped",
      remaining: "Remaining",
      lock: "Lock",
      lastProcessed: "Last processed",
      queued: "Queued",
      processing: "Processing",
      completed: "Completed",
      paused: "Paused",
      cancelled: "Cancelled",
      confirmationRequired: "Only approved campaigns can be queued. Simulation remains the default.",
      confirmPause: "Pause this simulation job? Unsent recipients will stay queued until you resume.",
      confirmCancel: "Cancel unsent recipients in this simulation job? Sent history will be preserved.",
      alreadyQueued: "Already queued",
      queuedSimulationJob: "Queued simulation job",
      pausedResult: "Paused",
      resumedResult: "Resumed",
      cancelledResult: "Cancelled",
      result: "Last result",
      hostedPreparation: {
        title: "Server-send preparation",
        description:
          "Prepare the approved campaign snapshot for hosted durable simulation. This does not send email or enable Brevo delivery.",
        prepare: "Prepare for server sending",
        preparing: "Preparing...",
        refresh: "Refresh prepared state",
        tenant: "Tenant",
        noTenants: "No trusted tenant membership",
        approvalState: "Approval",
        approvedRecipients: "Approved recipients",
        staleApprovals: "Stale approvals",
        status: "Prepared state",
        eligibility: "Eligibility",
        eligible: "Ready to prepare",
        notEligible: "Not ready",
        needsApproval: "Campaign must be approved before preparation.",
        hasStaleApprovals: "Resolve stale recipient approvals before preparation.",
        emptySnapshot: "At least one approved included recipient is required.",
        preparedAt: "Prepared at",
        preparedBy: "Prepared by",
        audit: "Recent hosted audit",
        authUnavailable: "Hosted authentication or tenant membership is not available in this local session.",
        statusFailed: "Prepared status could not be loaded.",
        prepareFailed: "Campaign preparation failed. No email was sent.",
        senderIncomplete: "Company or sender identity is incomplete.",
        createdPrepared: "Prepared {count} recipients for hosted durable simulation.",
        reusedPrepared: "Already prepared. Reused the existing hosted snapshot.",
        states: {
          failed: "Failed",
          loading: "Loading",
          not_prepared: "Not prepared",
          prepared: "Prepared",
          preparing: "Preparing",
          stale: "Stale / invalid snapshot"
        }
      }
    },
    suppression: {
      title: "Suppression list",
      description: "Blocked emails cannot be approved, opened in Gmail/Outlook, or marked sent until suppression is removed where permitted.",
      emailPlaceholder: "Email to suppress",
      notesPlaceholder: "Notes (optional)",
      searchPlaceholder: "Search suppressed emails",
      allReasons: "All reasons",
      allSources: "All sources",
      add: "Add suppression",
      remove: "Remove",
      created: "Suppression added.",
      removed: "Suppression removed.",
      error: "Suppression action failed.",
      removeConfirm: "Remove suppression for {email}?",
      elevatedRequired: "This reason requires elevated permission, confirmation, and a documented removal reason.",
      elevatedConfirmLabel: "I confirm elevated removal",
      removalReasonPlaceholder: "Removal reason",
      confirmRemove: "Confirm removal",
      viewContact: "View contact",
      viewCampaign: "View campaign",
      reasons: {
        manual: "Manual",
        unsubscribe: "Unsubscribe",
        hard_bounce: "Hard bounce",
        complaint: "Complaint",
        invalid_address: "Invalid address",
        duplicate: "Duplicate",
        legal_request: "Legal request",
        other: "Other"
      },
      sources: {
        operator: "Operator",
        import: "Import",
        campaign: "Campaign",
        lead_detail: "Lead detail",
        provider_webhook: "Provider webhook",
        public_unsubscribe: "Public unsubscribe",
        system: "System"
      },
      columns: {
        email: "Email",
        reason: "Reason",
        source: "Source",
        createdAt: "Created",
        actions: "Actions"
      }
    },
    operationalSummary: {
      title: "Operational outreach summary",
      description: "Live local metrics from imported leads, campaigns, and manual send history. No provider delivery metrics are shown.",
      metrics: {
        importedOrganizations: "Imported organizations",
        validContacts: "Valid contacts",
        invalidOrMissingEmailContacts: "Invalid/missing email",
        draftCampaigns: "Draft campaigns",
        draftsAwaitingReview: "Drafts awaiting review",
        approvedRecipients: "Approved recipients",
        openedExternally: "Opened externally",
        manuallySent: "Sent manually",
        suppressed: "Suppressed emails",
        recentWarnings: "Recent warnings"
      }
    },
    table: {
      company: "Company",
      contact: "Contact",
      email: "Email",
      location: "Location",
      industry: "Industry",
      status: "Status",
      quality: "Quality",
      source: "Source",
      language: "Language",
      viewLead: "Open lead",
      selectedCount: "{count} selected"
    },
    import: {
      chooseCsv: "Choose CSV",
      chooseFile: "Choose CSV or XLSX",
      description:
        "Upload a contact database (CSV or XLSX), review field mapping and validation, then confirm to persist organizations and contacts.",
      duplicateEmails: "Duplicate emails",
      duplicateRows: "Duplicates",
      invalidRows: "Invalid",
      reviewRows: "Review",
      validRows: "Valid",
      totalRows: "Total rows",
      possibleDuplicates: "Possible duplicates",
      missingEmailRows: "Missing email",
      confirmImport: "Confirm import",
      importing: "Importing…",
      summary: "Imported {imported} leads. Skipped {skipped} duplicates.",
      failed: "Import failed.",
      fileHint: "Max 5 MB. CSV and XLSX supported.",
      mappingTitle: "Field mapping",
      unmapped: "Not mapped",
      cancel: "Cancel",
      continuePreview: "Continue to preview",
      repeatImportWarning: "This file matches a previously completed import.",
      repeatImportConfirm: "Allow re-import anyway",
      filterStatus: "Filter",
      filterAll: "All rows",
      copyErrors: "Copy error summary",
      attachStrongDuplicates: "Attach new data to strong organization matches",
      approvePossible: "Approve",
      backToMapping: "Back to mapping",
      retryMapping: "Apply mapping changes",
      importAnother: "Import another file",
      messages: "Messages",
      selectSheet: "Worksheet",
      mappingProfile: "Mapping profile",
      saveProfile: "Save profile",
      saveProfilePlaceholder: "Profile name",
      profileSaved: "Mapping profile saved.",
      deleteProfile: "Delete",
      deleteProfileConfirm: "Delete mapping profile \"{label}\"?",
      warningsFilter: "Warnings",
      showNormalized: "Show normalized values",
      downloadErrors: "Download error report",
      fields: {
        companyName: "Organization name",
        contactName: "Contact person",
        email: "Email",
        phone: "Phone",
        website: "Website",
        region: "Region",
        country: "Country",
        industry: "Category",
        notes: "Notes",
        sourceDatabase: "Source",
        status: "Status",
        language: "Language"
      }
    },
    statuses: {
      ready: "Ready",
      queued: "Queued",
      contacted: "Contacted",
      replied: "Replied",
      positive_reply: "Positive reply",
      bounced: "Bounced"
    },
    qualities: {
      high: "High",
      medium: "Medium",
      low: "Low"
    },
    industries: {
      Hospitality: "Hospitality",
      Events: "Events",
      "Food & Beverage": "Food & Beverage",
      Packaging: "Packaging",
      "Sports venues": "Sports venues"
    },
    campaignStatuses: {
      draft: "Draft",
      ready_for_review: "Ready for review",
      approved: "Approved",
      in_progress: "In progress",
      completed: "Completed",
      paused: "Paused",
      cancelled: "Cancelled",
      active: "Active"
    },
    activities: {
      "lead-imported": "Lead imported",
      "campaign-started": "Campaign started",
      "reply-received": "Reply received",
      "bounce-detected": "Bounce detected",
      "lead-qualified": "Lead qualified",
      "message-generated": "Message generated",
      "message-edited": "Message edited",
      "message-approved": "Message approved",
      "campaign-assigned": "Campaign assigned",
      "message-queued": "Message queued",
      "message-sent": "Message sent",
      "metrics-updated": "Metrics updated"
    },
    detailFields: {
      company: "Company",
      contact: "Contact",
      email: "Email",
      location: "Location",
      industry: "Industry",
      status: "Status",
      quality: "Quality",
      source: "Source",
      sourceDatabase: "Source database",
      language: "Language",
      website: "Website"
    },
    detailWorkspace: {
      contactPanel: "Company and contact",
      contextPanel: "Company context",
      productsPanel: "Recommended products",
      composerPanel: "Email composer",
      campaignPanel: "Demo campaign",
      sequencePanel: "Sequence preview",
      activityPanel: "Activity timeline",
      importSummary: "Data source summary",
      noWebsiteContext: "No website context available",
      websiteContextAvailable: "Website context available",
      personalizationWarning: "Limited personalization: do not claim website review without context.",
      selectedProducts: "Selected products",
      tone: "Tone",
      professional: "Professional",
      friendly: "Friendly",
      direct: "Direct",
      generate: "Generate PT-PT email",
      generationLoading: "Generating...",
      subject: "Subject",
      body: "Message",
      method: "Method",
      providerMode: "Mode",
      edited: "Edited",
      approved: "Approved",
      notApproved: "Not approved",
      approve: "Approve message",
      queue: "Queue",
      simulateSend: "Simulate send",
      campaign: "Campaign",
      providerState: "Provider state",
      queuedAt: "Queued at",
      sentAt: "Sent at",
      success: "Operation complete.",
      error: "Action blocked.",
      generatedSuccess: "Email generated and ready for review.",
      generationError: "The email could not be generated. Try again.",
      providerQueuedSuccess: "Message submitted to the live provider and kept queued.",
      sentSuccess: "Simulated send complete.",
      sending: "Sending...",
      confirmSend: "Confirm send or simulation for this message?",
      deterministicMode: "Deterministic generation",
      fallbackNotice:
        "The configured AI provider could not be used. Local generation was used instead.",
      modelLabel: "Model",
      liveAiMode: "AI configured",
      simulationMode: "Simulation Mode",
      liveProviderMode: "Live Provider Mode",
      providerErrorMode: "Provider Error",
      providerError: "The provider did not complete delivery.",
      savedDraftLoaded: "Local draft restored.",
      sequenceDelay: "Delay",
      importTotal: "Imported",
      importValid: "Valid",
      importReview: "Review",
      importReady: "Ready",
      phone: "Phone",
      hiddenDemoValue: "Hidden in demo",
      noCampaign: "No campaign",
      incompleteMessage: "Message is incomplete.",
      queueRequired: "The message must be queued first.",
      emptyActivity: "Demo activity appears here.",
      leadNotFound: "Lead not found in local database.",
      manualProductReason: "Product available for manual selection.",
      senderIdentity: "Sender identity",
      companyProfile: "Company profile",
      htmlPreview: "HTML preview",
      plainPreview: "Plain-text preview"
    },
    brandingPreview: {
      links: "Trusted links",
      media: "Media blocks",
      signature: "Signature",
      footer: "Legal footer"
    },
    copyActions: {
      copySubject: "Copy subject",
      copyPlain: "Copy plain text",
      copyFormatted: "Copy formatted email",
      copyFull: "Copy full message",
      openDefault: "Open default email app",
      openGmail: "Open Gmail",
      openOutlook: "Open Outlook",
      copiedSubject: "Subject copied.",
      copiedPlain: "Plain text copied.",
      copiedFormatted: "Formatted email copied.",
      copiedFull: "Full message copied.",
      copyFailed: "Copy failed.",
      htmlFallback: "(HTML clipboard not supported — plain text copied.)",
      localImageWarning:
        "Some images are stored locally only and cannot be embedded in external email HTML. Public HTTPS URLs are required for recipient-facing images.",
      mailtoTruncated: "Message body was truncated for mailto URL length limits.",
      bodyTruncated: "Message body was truncated for the email client URL limit."
    },
    providerStates: {
      not_ready: "Not ready",
      draft: "Draft",
      approved: "Approved",
      queued: "Queued",
      sent: "Sent",
      blocked: "Blocked"
    }
  },
  dashboardCustomize: {
    title: "Customize dashboard",
    description: "Choose visible panels, density, and default date range. Preferences are stored locally.",
    panelsTitle: "Panels",
    densityTitle: "Density",
    densityComfortable: "Comfortable",
    densityCompact: "Compact",
    dateRangeTitle: "Default date range",
    dateToday: "Today",
    dateWeek: "This week",
    dateMonth: "This month",
    restore: "Restore defaults",
    save: "Save layout",
    close: "Close",
    panelLabels: {
      oee: "Production OEE",
      inventory: "Inventory summary",
      alerts: "Alerts and activity",
      productionOrders: "Production orders",
      revenue: "Revenue",
      copilot: "AI Copilot",
      marketing: "Marketing summary",
      onboarding: "Onboarding checklist"
    }
  },
  dashboardModule: {
    subtitle: "Live metrics from your local ForgeOS database",
    recentActivity: "Recent activity",
    noActivity: "No activity yet. Run the demo workflow or import leads to create records.",
    noInventory: "No inventory records yet. Preview items are shown until stock is added.",
    leadopsHint: "Commercial outreach and email campaigns",
    openOutreach: "Open Outreach",
    revenueTitle: "Revenue",
    revenueEstimated: "Estimated from local quotations when available; otherwise preview trend.",
    copilotDisclaimer: "Copilot provides deterministic preview answers only. It cannot execute shop-floor actions yet.",
    copilotSend: "Send",
    copilotPrompts: {
      molds: "Which molds need maintenance next month?",
      delayedOrders: "Which orders are delayed?",
      lowStock: "What products are below minimum stock?",
      quotations: "Which quotations are awaiting a response?",
      campaigns: "Which marketing campaigns need approval?"
    },
    kpi: {
      oee: "Production OEE",
      revenue: "Weekly revenue",
      openQuotations: "Open quotations",
      delayedOrders: "Delayed orders",
      maintenanceAlerts: "Maintenance alerts"
    },
    marketing: {
      title: "Marketing & Outreach",
      leadsReady: "Leads ready",
      drafts: "Drafts awaiting review",
      approved: "Approved emails",
      opened: "Opened externally",
      suppressed: "Suppressed leads",
      openOutreach: "Open Outreach",
      openMarketing: "Open Marketing"
    },
    metrics: {
      leads: "Total leads",
      qualified: "Qualified leads",
      customers: "Customers",
      opportunities: "Active opportunities",
      quotations: "Open quotations",
      production: "Production orders",
      outreachReady: "Outreach ready",
      outreachSent: "Outreach contacted"
    }
  },
  customersModule: {
    title: "Customers",
    description: "Manage tenant-scoped customers with create, edit, and archive actions.",
    loading: "Loading customers…",
    empty: "No customers yet",
    emptyDescription: "Create a customer or convert a lead from Outreach.",
    actions: { create: "New customer" },
    form: {
      createTitle: "Create customer",
      editTitle: "Edit customer",
      companyName: "Company",
      contactName: "Contact",
      email: "Email",
      phone: "Phone",
      notes: "Notes",
      required: "Company and contact are required.",
      invalidEmail: "Enter a valid email address."
    },
    table: {
      company: "Company",
      contact: "Contact",
      email: "Email",
      sourceLead: "Source lead",
      opportunities: "Opportunities",
      created: "Created"
    }
  },
  machinesModule: {
    title: "Machines",
    description: "Manage production machines, capacity, and availability.",
    loading: "Loading machines…",
    empty: "No machines yet.",
    actions: { create: "New machine" },
    statuses: {
      operational: "Operational",
      maintenance: "Maintenance",
      offline: "Offline",
      retired: "Retired"
    },
    form: {
      createTitle: "Create machine",
      editTitle: "Edit machine",
      code: "Code",
      name: "Name",
      type: "Type",
      status: "Status",
      capacity: "Capacity / hour",
      location: "Location",
      notes: "Notes",
      required: "Code and name are required."
    },
    table: {
      code: "Code",
      name: "Name",
      type: "Type",
      status: "Status",
      capacity: "Capacity/h"
    }
  },
  inventoryModule: {
    title: "Inventory",
    description: "Track stock levels, receipts, and warehouse locations.",
    loading: "Loading inventory…",
    empty: "No inventory items yet.",
    actions: { create: "New item", receiveStock: "Receive stock" },
    form: {
      createTitle: "Create inventory item",
      editTitle: "Edit inventory item",
      sku: "SKU",
      name: "Name",
      category: "Category",
      unit: "Unit",
      reorderLevel: "Reorder level",
      location: "Warehouse location",
      notes: "Notes",
      required: "SKU and name are required."
    },
    stock: {
      title: "Record stock receipt",
      quantity: "Quantity",
      reason: "Reason",
      submit: "Record receipt",
      defaultReason: "Manual receipt"
    },
    table: {
      sku: "SKU",
      name: "Name",
      quantity: "Quantity",
      unit: "Unit",
      location: "Location"
    }
  },
  crudModule: {
    searchPlaceholder: "Search records…",
    showArchived: "Show archived",
    actions: {
      menu: "Actions",
      edit: "Edit",
      archive: "Archive",
      restore: "Restore",
      duplicate: "Duplicate"
    },
    form: {
      create: "Create",
      save: "Save",
      cancel: "Cancel"
    },
    archive: {
      title: "Archive record?",
      message: "Archived records are hidden from default lists. You can restore them later.",
      restoreMessage: "Restore this record to active lists?",
      confirm: "Confirm",
      cancel: "Cancel"
    },
    error: { generic: "Something went wrong. Try again." },
    rolePreview: {
      badge: "Preview role",
      label: "Preview role",
      roles: {
        owner: "Owner",
        sales: "Sales",
        production_manager: "Production manager",
        warehouse_manager: "Warehouse manager"
      }
    },
    commandPalette: {
      placeholder: "Search modules and records…",
      noResults: "No matches",
      close: "Close",
      groups: {
        navigation: "Navigation",
        create: "Quick create",
        leads: "Leads",
        customers: "Customers",
        products: "Products",
        quotes: "Quotations",
        production: "Production",
        machines: "Machines",
        inventory: "Inventory"
      },
      create: {
        lead: "New lead",
        customer: "New customer",
        product: "New product",
        quote: "New quotation",
        customizer: "New cup simulation",
        production: "New production order",
        machine: "New machine",
        inventory: "New inventory item"
      }
    },
    quickCreate: {
      trigger: "Create",
      lead: "Lead",
      customer: "Customer",
      product: "Product",
      quote: "Quotation",
      customizer: "Cup customizer",
      production: "Production order",
      machine: "Machine",
      inventory: "Inventory item"
    },
    customizeDialog: {
      title: "Customize dashboard",
      message: "Dashboard customization is not available in this local MVP preview.",
      close: "Close"
    }
  },
  quotationsModule: {
    title: "Quotations",
    description: "Create, approve, and manage customer quotations.",
    loading: "Loading quotations…",
    empty: "No quotations yet.",
    tabs: {
      label: "Quotations navigation",
      quotations: "Quotations",
      customizer: "Cup Customizer"
    },
    actions: { create: "New quotation", approve: "Approve" },
    form: {
      createTitle: "Create quotation",
      customer: "Customer",
      product: "Product",
      quantity: "Quantity",
      printColors: "Print colours",
      notes: "Notes",
      selectCustomer: "Select customer",
      selectProduct: "Select product",
      required: "Customer and product are required."
    },
    statuses: {
      draft: "Draft",
      sent: "Sent",
      approved: "Approved",
      rejected: "Rejected"
    },
    table: {
      number: "Number",
      customer: "Customer",
      product: "Product",
      quantity: "Quantity",
      status: "Status",
      source: "Source",
      total: "Total",
      created: "Created",
      manual: "Manual",
      fromCustomizer: "Customizer",
      fromCustomizerEstimate: "Customizer (estimate)"
    }
  },
  productionModule: {
    title: "Production orders",
    description: "Assign machines, update status, and open job cards.",
    loading: "Loading production orders…",
    empty: "No production orders yet.",
    openJobCard: "Job card",
    actions: {
      assignMachine: "Assign machine",
      start: "Start production",
      complete: "Mark completed"
    },
    form: {
      assignMachine: "Assign machine",
      machine: "Machine",
      selectMachine: "Select machine"
    },
    statuses: {
      scheduled: "Scheduled",
      "in-progress": "In progress",
      blocked: "Blocked",
      completed: "Completed"
    },
    table: {
      number: "Order",
      customer: "Customer",
      product: "Product",
      quantity: "Quantity",
      machine: "Machine",
      status: "Status",
      created: "Created"
    }
  },
  jobCard: {
    backToProduction: "Back to production",
    notFound: "Production order not found in local database.",
    eyebrow: "Operator job card",
    title: "Production job card",
    description:
      "Read-only demo job instructions for the shop floor. Real approval, quality, and stock movements are still pending.",
    status: "Status",
    scheduledDate: "Scheduled date",
    progress: "Progress",
    sections: {
      production: "Production context",
      machine: "Machine setup",
      artwork: "Artwork and print",
      packing: "Packing",
      notes: "Operator notes"
    },
    fields: {
      customer: "Customer",
      product: "Product",
      quantity: "Quantity",
      machine: "Machine",
      speed: "Speed/hour",
      loadingBay: "Loading bay",
      artworkStatus: "Artwork status",
      screenStatus: "Screen status",
      capacity: "Capacity",
      material: "Material",
      ink: "Predicted ink",
      loading: "Stacks/boxes",
      qrUrl: "QR URL"
    }
  },
  customizerModule: {
    title: "Cup Customizer",
    description: "Configure cups, preview artwork, and generate estimate quotations.",
    loading: "Loading customizer…",
    emptyProducts: "No cup products in the catalog. Add personalized cup products first.",
    emptySimulations: "No saved simulations yet.",
    sections: {
      context: "Customer and product",
      configuration: "Printing configuration",
      artwork: "Artwork",
      simulations: "Saved simulations",
      pricing: "Pricing estimate",
      commercial: "Commercial details"
    },
    form: {
      customer: "Customer",
      lead: "Lead",
      product: "Product",
      quantity: "Quantity",
      material: "Material",
      cupSize: "Cup size",
      cupType: "Cup type",
      printColors: "Print colours",
      printArea: "Print area",
      artworkPosition: "Artwork position",
      artworkScale: "Artwork scale",
      artworkOffsetX: "Horizontal offset",
      artworkOffsetY: "Vertical offset",
      artworkRotation: "Artwork rotation",
      deliveryDate: "Desired delivery date",
      notes: "Notes",
      selectCustomer: "Select customer (optional)",
      selectLead: "Select lead (optional)",
      required: "Select a cup product to continue."
    },
    printAreas: { wrap: "Wrap", front: "Front", back: "Back" },
    artworkPositions: { left: "Left", center: "Centre", right: "Right" },
    artwork: {
      upload: "Upload artwork",
      uploadTitle: "Upload logo or artwork",
      replace: "Replace artwork",
      useLogo: "Use company logo",
      useCustomerLogo: "Use stored customer logo",
      searchOnline: "Search for logo online",
      generateLogo: "Generate logo",
      useProductImage: "Use product image",
      uploaded: "Artwork uploaded.",
      validating: "Validating file…",
      loaded: "Artwork loaded.",
      invalid: "Invalid file.",
      failed: "Failed to load artwork.",
      replaced: "Artwork replaced.",
      removed: "Artwork removed.",
      logoApplied: "Company logo applied to preview.",
      customerLogoApplied: "Customer logo applied.",
      customerLogoSearching: "Searching for stored logo…",
      customerLogoFound: "Stored logo found.",
      customerLogoNotFound: "No stored logo.",
      customerLogoFailed: "Could not load customer logo.",
      productImageApplied: "Product image applied to preview.",
      noLogo: "Upload a company logo in Settings first.",
      noCompanyLogoLink: "Configure company logo",
      noProductImage: "This product has no image URL.",
      providerNotConfigured: "Provider not configured",
      fileTooLarge: "File exceeds the 2 MB artwork limit.",
      unsupportedType: "Unsupported file type. Use PNG, JPEG, WebP, GIF, or SVG.",
      unsafeFile: "Executable or unsafe file types are not allowed.",
      decodeFailed: "Could not decode the image.",
      unsafeSvg: "Unsafe SVG — remove scripts or active content.",
      missingDimensions: "Image has no valid dimensions.",
      persistenceFailed: "Failed to save the file locally."
    },
    preview: {
      label: "Design preview",
      designTab: "Design preview",
      mockupTab: "Realistic mockup",
      brokenProductImage: "Product image unavailable; using fallback preview.",
      uploadHint: "PNG, JPEG, WebP or SVG up to 2 MB",
      dragDropHint: "Drag a file onto the cup or click to upload",
      capacityLabel: "Cup capacity",
      printAreaLabel: "Print area",
      safetyBoundaryLabel: "Safety boundary",
      overflowWarning: "Artwork may exceed the printable area"
    },
    workflow: {
      navLabel: "Customizer steps",
      previous: "Previous",
      next: "Next",
      steps: {
        product: "Product",
        printing: "Printing",
        artwork: "Artwork",
        preview: "Preview",
        quotation: "Price and quotation"
      }
    },
    mockup: {
      generateRealistic: "Generate realistic mockup",
      generating: "Generating visualization…",
      generated: "Realistic visualization generated.",
      generatedDisclaimer: "Visualization generated — final production result may vary.",
      stale: "Visualization is stale — regenerate after changing artwork or configuration.",
      failed: "Could not generate visualization.",
      retry: "Try again",
      unavailable: "Image provider unavailable in the current environment.",
      disclaimer: "AI-generated visualization — final production appearance may vary.",
      providerDeterministic: "Deterministic provider (development)",
      summaryTitle: "Summary before generating"
    },
    commercialDataRequired: "Commercial data required — enter a temporary manual price or configure the product.",
    unsavedChanges: "Unsaved changes",
    summary: {
      title: "Customization summary",
      customer: "Customer",
      cup: "Cup",
      quantity: "Quantity",
      printing: "Printing",
      artwork: "Artwork",
      pricing: "Pricing",
      quotation: "Quotation",
      warnings: "Warnings"
    },
    pricing: {
      estimateBadge: "Estimate",
      unitPrice: "Unit price",
      setupCost: "Setup",
      subtotal: "Subtotal",
      vat: "VAT",
      total: "Total",
      assumptions: "Assumptions",
      viewAssumptions: "View assumptions",
      manualOverride: "Manual unit price override",
      overrideReason: "Override reason",
      selectProduct: "Select a product to calculate pricing."
    },
    actions: {
      save: "Save simulation",
      saving: "Saving…",
      saved: "Simulation saved.",
      saveVisualization: "Save visualization",
      visualizationSaved: "Visualization saved locally.",
      convertToQuote: "Create quotation from simulation",
      converted: "Quotation created.",
      newSimulation: "New simulation",
      resetView: "Reset view",
      openCustomizer: "Open Cup Customizer",
      openInCustomizer: "Open in customizer",
      customize: "Customize",
      openForCustomer: "Customize cups"
    },
    statuses: {
      draft: "Draft",
      saved: "Saved",
      converted: "Converted",
      archived: "Archived",
      DRAFT: "Draft",
      ARTWORK_REVIEW: "Artwork review",
      PRICING_REQUIRED: "Pricing required",
      READY_FOR_QUOTATION: "Ready for quotation",
      QUOTED: "Quoted",
      APPROVED: "Approved",
      ARCHIVED: "Archived"
    },
    leadopsMedia: {
      title: "Customizer mockup",
      description: "Optionally attach a cup customizer mockup when following up with this lead.",
      optIn: "Attach simulation mockup to outreach (placeholder)",
      mockupPlaceholder: "No mockup saved yet — open the customizer to create a simulation for this lead.",
      mockupReady: "A simulation mockup is linked to this lead.",
      openCustomizer: "Open Cup Customizer for this lead"
    }
  },
  onboardingModule: {
    title: "Getting started",
    subtitle: "Complete these steps to validate the local MVP workflow.",
    dismiss: "Dismiss",
    progress: "{completed} of {total} complete",
    items: {
      company_profile: "Complete company profile",
      company_logo: "Upload company logo",
      sender_identity: "Configure default sender",
      abacus_configured: "Review AI provider settings",
      product_urls: "Add product page URLs",
      product_image: "Add product images",
      leads_imported: "Import or create leads",
      first_email: "Generate first outreach email",
      first_quotation: "Create first quotation",
      customizer_tested: "Test Cup Customizer",
      backup_exported: "Export local backup"
    }
  },
  notificationsModule: {
    title: "Notifications",
    trigger: "Notifications",
    close: "Close notifications",
    loading: "Loading…",
    empty: "No notifications",
    markAllRead: "Mark all read"
  },
  hostedFeatures: {
    close: "Close",
    localMvpNote: "These capabilities require a hosted ForgeOS deployment. The local MVP uses IndexedDB and simulation modes.",
    features: {
      google: {
        title: "Google sign-in",
        description: "Authenticate users with Google OAuth via Supabase Auth.",
        requirements: [
          "Configure Google OAuth client in Google Cloud Console",
          "Enable Google provider in Supabase Auth",
          "Set redirect URLs for production domain"
        ]
      },
      microsoft: {
        title: "Microsoft sign-in",
        description: "Authenticate users with Microsoft Entra ID via Supabase Auth.",
        requirements: [
          "Register ForgeOS app in Microsoft Entra ID",
          "Enable Microsoft provider in Supabase Auth",
          "Configure tenant and redirect URIs"
        ]
      },
      supabase: {
        title: "Supabase sync",
        description: "Move persistence and authentication to hosted PostgreSQL.",
        requirements: [
          "Set NEXT_PUBLIC_SUPABASE_URL and anon key",
          "Apply migrations under supabase/migrations/",
          "Configure RLS policies per tenant"
        ]
      },
      smartlead: {
        title: "Smartlead live delivery",
        description: "Send outreach campaigns through Smartlead instead of simulation.",
        requirements: [
          "Set SMARTLEAD_API_KEY and campaign ID",
          "Set OUTREACH_DELIVERY_PROVIDER=smartlead",
          "Validate sender domains in Smartlead"
        ]
      },
      "hosted-storage": {
        title: "Hosted storage",
        description: "Store logos, artwork, and mockups in cloud object storage.",
        requirements: [
          "Configure Supabase Storage or S3 bucket",
          "Migrate local assets on tenant onboarding",
          "Use signed URLs in customer-facing emails"
        ]
      },
      "cup-customizer": {
        title: "Cup Customizer",
        description: "In-app cup configuration is active in this local build.",
        requirements: ["Uses @cup-customizer package with operational pricing rules"]
      },
      "local-db": {
        title: "Local database",
        description: "IndexedDB persistence for offline-first MVP.",
        requirements: ["Export backups regularly from Settings → Backup"]
      }
    }
  }
};
