import type { Locale } from "./config";
import type { ModuleKey } from "@/modules/config";
import type { DashboardCardKey } from "@/demo/dashboard";
import type { ProductCategory } from "@/demo/types";

const dictionaries = {
  "pt-PT": () => import("./locales/pt-PT").then((module) => module.dictionary),
  en: () => import("./locales/en").then((module) => module.dictionary)
} satisfies Record<Locale, () => Promise<Dictionary>>;

export type Dictionary = {
  app: {
    name: string;
    tenantLabel: string;
    environment: string;
    openMenu: string;
    closeMenu: string;
  };
  navigation: {
    dashboard: string;
    customers: string;
    products: string;
    orders: string;
    production: string;
    inventory: string;
    machines: string;
    maintenance: string;
    marketing: string;
    leadops: string;
    settings: string;
  };
  dashboard: {
    searchPlaceholder: string;
    searchShortcut: string;
    dateRange: string;
    customize: string;
    greeting: string;
    userRole: string;
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    operationalSnapshot: string;
    modulesTitle: string;
    nextStepsTitle: string;
    languageLabel: string;
    status: {
      prototype: string;
      foundation: string;
      planned: string;
      online: string;
      operational: string;
      production: string;
    };
    metrics: Array<{
      label: string;
      value: string;
      detail: string;
      trend: string;
      tone: "green" | "blue" | "amber" | "red";
    }>;
    demoCards: Record<DashboardCardKey, string>;
    demoCardDetails: Record<DashboardCardKey, string>;
    demoSections: {
      todayJobs: string;
      inventoryAlerts: string;
      productCatalog: string;
      recentActivity: string;
      viewCatalog: string;
      noAlerts: string;
      openJobCard: string;
      minimumPrefix: string;
      unitsPerBox: string;
    };
    production: {
      title: string;
      score: string;
      availability: string;
      performance: string;
      quality: string;
      days: string[];
    };
    inventory: {
      title: string;
      viewAll: string;
      items: Array<{
        name: string;
        category: string;
        quantity: string;
        minimum: string;
        tone: "green" | "amber" | "red";
      }>;
    };
    activity: {
      title: string;
      viewAll: string;
      items: Array<{
        title: string;
        detail: string;
        time: string;
        priority: string;
        tone: "green" | "amber" | "red";
      }>;
    };
    orders: {
      title: string;
      viewAll: string;
      headers: {
        order: string;
        product: string;
        quantity: string;
        progress: string;
        delivery: string;
      };
      rows: Array<{
        order: string;
        product: string;
        quantity: string;
        progress: string;
        delivery: string;
        tone: "green" | "amber" | "red";
      }>;
    };
    copilot: {
      title: string;
      badge: string;
      prompt: string;
      answer: string;
      input: string;
    };
    modules: Array<{
      key: ModuleKey;
      title: string;
      description: string;
      status: string;
    }>;
    nextSteps: string[];
    footer: {
      version: string;
      copyright: string;
      system: string;
      database: string;
      backup: string;
      environment: string;
      support: string;
    };
  };
  modulePage: {
    backToDashboard: string;
    prototypeNotice: string;
    primaryAction: string;
    secondaryAction: string;
    readinessTitle: string;
    roadmapTitle: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    tableHeaders: {
      area: string;
      priority: string;
      status: string;
      owner: string;
    };
    modules: Record<
      Exclude<ModuleKey, "dashboard">,
      {
        eyebrow: string;
        title: string;
        description: string;
        stats: Array<{
          label: string;
          value: string;
          detail: string;
        }>;
        roadmap: string[];
        tableRows: Array<{
          area: string;
          priority: string;
          status: string;
          owner: string;
        }>;
      }
    >;
  };
  productCatalog: {
    eyebrow: string;
    title: string;
    description: string;
    sourceNotice: string;
    fieldsTitle: string;
    categories: Record<ProductCategory, string>;
    fields: {
      sku: string;
      category: string;
      image: string;
      material: string;
      capacity: string;
      color: string;
      unitsPerBox: string;
      stacksPerBox: string;
      unitsPerStack: string;
      compatible: string;
      basePrice: string;
      personalization: string;
      printArea: string;
      setupCost: string;
      screenCost: string;
      leadTime: string;
      sourceUrl: string;
    };
    yes: string;
    no: string;
    days: string;
  };
  demoWorkflow: {
    eyebrow: string;
    title: string;
    description: string;
    startDemo: string;
    currentStep: string;
    reset: string;
    sections: {
      lead: string;
      quote: string;
      production: string;
      jobCard: string;
      inventory: string;
      events: string;
      automation: string;
      copilot: string;
    };
    steps: string[];
    fields: {
      company: string;
      contact: string;
      product: string;
      quantity: string;
      printColors: string;
      artwork: string;
      subtotal: string;
      vat: string;
      total: string;
      machine: string;
      progress: string;
      available: string;
      reserved: string;
      ink: string;
      personalizationCost: string;
      demoArtworkFile: string;
      emptyValue: string;
      unitSuffix: string;
      demoNotesDefault: string;
    };
    actions: {
      createLead: string;
      qualifyLead: string;
      convertLead: string;
      openOutreach: string;
      createQuote: string;
      uploadArtwork: string;
      approveQuote: string;
      createProduction: string;
      openJobCard: string;
      assignMachine: string;
      updateStatuses: string;
      logProgress: string;
      logProduction: string;
      reserveInventory: string;
    };
    resetData: string;
    resetConfirm: string;
    cancel: string;
    actionRunning: string;
    resultSuccess: string;
    resultError: string;
    openInLeadops: string;
    openCustomer: string;
    openQuotation: string;
    openProduction: string;
    persistence: {
      loading: string;
      unavailable: string;
    };
    status: {
      waiting: string;
      done: string;
      active: string;
    };
    jobCardLabels: {
      orderId: string;
      customer: string;
      cupCapacity: string;
      material: string;
      artworkStatus: string;
      screenStatus: string;
      predictedInk: string;
      loading: string;
      loadingBay: string;
      assignedMachine: string;
      operatorNotes: string;
      logoPreview: string;
      label: string;
      qrUrl: string;
    };
    automationLabels: {
      quoteRequest: string;
      emailTemplates: string;
      webhookQueue: string;
      destination: string;
      payload: string;
      status: string;
    };
    copilotLabels: {
      suggestedPrompts: string;
      answer: string;
      actionRegistry: string;
    };
  };
  login: {
    eyebrow: string;
    title: string;
    description: string;
    tenant: string;
    user: string;
    password: string;
    submit: string;
    note: string;
    googleSignIn: string;
    microsoftSignIn: string;
    orContinueLocal: string;
    googleDialogTitle: string;
    googleDialogBody: string;
    microsoftDialogTitle: string;
    microsoftDialogBody: string;
    closeDialog: string;
  };
  settings: {
    eyebrow: string;
    title: string;
    description: string;
    loading: string;
    save: string;
    saved: string;
    sections: {
      company: string;
      profile: string;
      senders: string;
      team: string;
      integrations: string;
      backup: string;
    };
    company: {
      legalName: string;
      tradingName: string;
      vatNumber: string;
      websiteUrl: string;
      generalEmail: string;
      generalPhone: string;
      addressLine1: string;
      addressLine2: string;
      postalCode: string;
      city: string;
      region: string;
      country: string;
      logoPublicUrl: string;
      linkedinUrl: string;
      facebookUrl: string;
      legalFooter: string;
      uploadLogo: string;
      removeLogo: string;
      noLogo: string;
      logoUploaded: string;
      invalidWebsite: string;
    };
    profile: {
      fullName: string;
      jobTitle: string;
      email: string;
      phone: string;
      language: string;
      role: string;
    };
    senders: {
      add: string;
      created: string;
      defaultBadge: string;
      inactive: string;
      preview: string;
      setDefault: string;
      archive: string;
      archived: string;
      signaturePreview: string;
    };
    team: {
      notice: string;
      add: string;
      added: string;
      localPreview: string;
      active: string;
      inactive: string;
    };
    integrations: {
      diagnostic: string;
      statuses: Record<string, string>;
    };
    backup: {
      description: string;
      export: string;
      import: string;
      exported: string;
      imported: string;
      invalid: string;
    };
  };
  leadops: {
    eyebrow: string;
    title: string;
    description: string;
    backToDashboard: string;
    searchPlaceholder: string;
    clearFilters: string;
    resultCount: string;
    addToCampaign: string;
    addToCampaignDisabled: string;
    selectAllVisible: string;
    emptyTitle: string;
    emptyDescription: string;
    noResultsTitle: string;
    noResultsDescription: string;
    detailEyebrow: string;
    detailTitle: string;
    detailDescription: string;
    detailPlaceholder: string;
    sections: {
      kpis: string;
      campaigns: string;
      activity: string;
      leads: string;
      import: string;
    };
    kpis: {
      totalLeads: string;
      ready: string;
      queued: string;
      contactedSent: string;
      replies: string;
      positiveReplies: string;
      bounceRate: string;
      bounceRateUnavailable: string;
      activeCampaigns: string;
    };
    filters: {
      industry: string;
      status: string;
      quality: string;
      sourceDatabase: string;
      language: string;
      all: string;
    };
    table: {
      company: string;
      contact: string;
      email: string;
      location: string;
      industry: string;
      status: string;
      quality: string;
      source: string;
      language: string;
      viewLead: string;
      selectedCount: string;
    };
    import: {
      chooseCsv: string;
      description: string;
      duplicateEmails: string;
      invalidRows: string;
      reviewRows: string;
      validRows: string;
      confirmImport: string;
      importing: string;
      summary: string;
      failed: string;
    };
    statuses: Record<
      "ready" | "queued" | "contacted" | "replied" | "positive_reply" | "bounced",
      string
    >;
    qualities: Record<"high" | "medium" | "low", string>;
    campaignStatuses: Record<"active" | "paused" | "completed", string>;
    activities: Record<
      | "lead-imported"
      | "campaign-started"
      | "reply-received"
      | "bounce-detected"
      | "lead-qualified"
      | "message-generated"
      | "message-edited"
      | "message-approved"
      | "campaign-assigned"
      | "message-queued"
      | "message-sent"
      | "metrics-updated",
      string
    >;
    detailFields: {
      company: string;
      contact: string;
      email: string;
      location: string;
      industry: string;
      status: string;
      quality: string;
      source: string;
      sourceDatabase: string;
      language: string;
      website: string;
    };
    detailWorkspace: {
      contactPanel: string;
      contextPanel: string;
      productsPanel: string;
      composerPanel: string;
      campaignPanel: string;
      sequencePanel: string;
      activityPanel: string;
      importSummary: string;
      noWebsiteContext: string;
      websiteContextAvailable: string;
      personalizationWarning: string;
      selectedProducts: string;
      tone: string;
      professional: string;
      friendly: string;
      direct: string;
      generate: string;
      generationLoading: string;
      subject: string;
      body: string;
      method: string;
      providerMode: string;
      edited: string;
      approved: string;
      notApproved: string;
      approve: string;
      queue: string;
      simulateSend: string;
      campaign: string;
      providerState: string;
      queuedAt: string;
      sentAt: string;
      success: string;
      error: string;
      generatedSuccess: string;
      generationError: string;
      providerQueuedSuccess: string;
      sentSuccess: string;
      sending: string;
      confirmSend: string;
      deterministicMode: string;
      fallbackNotice: string;
      modelLabel: string;
      liveAiMode: string;
      simulationMode: string;
      liveProviderMode: string;
      providerErrorMode: string;
      providerError: string;
      savedDraftLoaded: string;
      sequenceDelay: string;
      importTotal: string;
      importValid: string;
      importReview: string;
      importReady: string;
      phone: string;
      hiddenDemoValue: string;
      noCampaign: string;
      incompleteMessage: string;
      queueRequired: string;
      emptyActivity: string;
      leadNotFound: string;
      manualProductReason: string;
      senderIdentity: string;
      companyProfile: string;
      htmlPreview: string;
      plainPreview: string;
    };
    brandingPreview: {
      links: string;
      media: string;
      signature: string;
      footer: string;
    };
    copyActions: {
      copySubject: string;
      copyPlain: string;
      copyFormatted: string;
      copyFull: string;
      openDefault: string;
      openGmail: string;
      openOutlook: string;
      copiedSubject: string;
      copiedPlain: string;
      copiedFormatted: string;
      copiedFull: string;
      copyFailed: string;
      htmlFallback: string;
      localImageWarning: string;
      mailtoTruncated: string;
      bodyTruncated: string;
    };
    providerStates: Record<"not_ready" | "draft" | "approved" | "queued" | "sent" | "blocked", string>;
  };
  dashboardModule: {
    subtitle: string;
    recentActivity: string;
    noActivity: string;
    leadopsHint: string;
    metrics: {
      leads: string;
      qualified: string;
      customers: string;
      opportunities: string;
      quotations: string;
      production: string;
      outreachReady: string;
      outreachSent: string;
    };
  };
  customersModule: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    table: {
      company: string;
      contact: string;
      email: string;
      sourceLead: string;
      opportunities: string;
      created: string;
    };
  };
  quotationsModule: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    statuses: Record<"draft" | "sent" | "approved", string>;
    table: {
      number: string;
      customer: string;
      product: string;
      quantity: string;
      status: string;
      total: string;
      created: string;
    };
  };
  productionModule: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    openJobCard: string;
    statuses: Record<"scheduled" | "in-progress" | "blocked" | "completed", string>;
    table: {
      number: string;
      customer: string;
      product: string;
      quantity: string;
      machine: string;
      status: string;
      created: string;
    };
  };
  jobCard: {
    backToProduction: string;
    notFound: string;
    eyebrow: string;
    title: string;
    description: string;
    status: string;
    scheduledDate: string;
    progress: string;
    sections: {
      production: string;
      machine: string;
      artwork: string;
      packing: string;
      notes: string;
    };
    fields: {
      customer: string;
      product: string;
      quantity: string;
      machine: string;
      speed: string;
      loadingBay: string;
      artworkStatus: string;
      screenStatus: string;
      capacity: string;
      material: string;
      ink: string;
      loading: string;
      qrUrl: string;
    };
  };
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
