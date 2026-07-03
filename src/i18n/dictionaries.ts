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
  navigation: Record<import("@/modules/config").ModuleKey, string> & {
    leadops: string;
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
      backupDemo: string;
      environment: string;
      support: string;
    };
    demoLabel: string;
    dateRangeThisWeek: string;
    userName: string;
    theme: {
      switchToLight: string;
      switchToDark: string;
    };
    sidebar: {
      newBadge: string;
      newTitle: string;
      newAction: string;
      planTitle: string;
      planSubtitle: string;
    };
  };
  dashboardCustomize: {
    title: string;
    description: string;
    panelsTitle: string;
    densityTitle: string;
    densityComfortable: string;
    densityCompact: string;
    dateRangeTitle: string;
    dateToday: string;
    dateWeek: string;
    dateMonth: string;
    restore: string;
    save: string;
    close: string;
    panelLabels: Record<
      import("@/features/dashboard/preferences").DashboardPanelKey,
      string
    >;
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
    modules: Partial<
      Record<
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
      >
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
    loading: string;
    empty: string;
    actions: { create: string };
    table: {
      sku: string;
      name: string;
      category: string;
      price: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      name: string;
      sku: string;
      category: string;
      basePrice: string;
      productPageUrl: string;
      emailTitle: string;
      emailPromotable: string;
      required: string;
    };
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
      provider: {
        title: string;
        description: string;
        refresh: string;
        loading: string;
        unavailable: string;
        provider: string;
        configured: string;
        realSend: string;
        testSend: string;
        apiKey: string;
        sender: string;
        allowlist: string;
        yes: string;
        no: string;
        missing: string;
        warnings: string;
      };
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
    actions: {
      createLead: string;
      convert: string;
    };
    form: {
      createTitle: string;
      companyName: string;
      contactName: string;
      email: string;
      required: string;
      invalidEmail: string;
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
      region: string;
      country: string;
      all: string;
    };
    management: {
      importHistory: string;
      noImportHistory: string;
      createCampaignFromFilters: string;
      createCampaignFromSelection: string;
      viewCampaigns: string;
      clearSelection: string;
      category: string;
      region: string;
      sourceImport: string;
      emailValidity: string;
      emailValidityValues: Record<"valid" | "missing" | "invalid", string>;
      suppressionStatus: string;
      suppressionValues: Record<"none" | "unsubscribed" | "bounced", string>;
      lastContacted: string;
      campaignCount: string;
      neverContacted: string;
      neverContactedOnly: string;
      sendability: string;
      sendabilityValues: Record<"sendable" | "blocked", string>;
      importSummary: {
        selectBatch: string;
        status: string;
        rows: string;
        organizations: string;
        contacts: string;
        duplicates: string;
        invalid: string;
        profile: string;
        sheet: string;
        linkedLeads: string;
      };
      pageLabel: string;
      previousPage: string;
      nextPage: string;
    };
    segmentation: {
      createTitle: string;
      createDescription: string;
      matchingOrganizations: string;
      matchingContacts: string;
      sendableRecipients: string;
      exclusionsTitle: string;
      exclusions: Record<
        "missingEmail" | "invalidEmail" | "suppressed" | "duplicate" | "inactive",
        string
      >;
      campaignName: string;
      campaignDescription: string;
      reviewDefinition: string;
      nameRequired: string;
      createFailed: string;
      creating: string;
      confirmCreate: string;
    };
    campaigns: {
      eyebrow: string;
      listTitle: string;
      listDescription: string;
      backToList: string;
      name: string;
      status: string;
      createdAt: string;
      recipientCount: string;
      sendableCount: string;
      language: string;
      deliveryMode: string;
      deliveryModes: Record<"simulation" | "provider_handoff", string>;
      metadataTitle: string;
      noDescription: string;
      snapshotCreated: string;
      exclusionsTitle: string;
      excludedCount: string;
      segmentDefinitionTitle: string;
      snapshotTitle: string;
      refreshRecipients: string;
      confirmRefresh: string;
      refreshSummary: string;
      inclusionReason: string;
      recipientStatus: string;
      includedCount: string;
      nextStepTemplate: string;
      nextStepTemplateHint: string;
      nextStepDrafts: string;
      nextStepDraftsHint: string;
      templates: {
        title: string;
        description: string;
        subjectLabel: string;
        bodyLabel: string;
        variablesTitle: string;
        saveTemplate: string;
        saving: string;
        templateSaved: string;
        previewSample: string;
        previewTitle: string;
        templateVersion: string;
        senderIncomplete: string;
        includedRecipients: string;
        unresolvedCount: string;
      };
      drafts: {
        title: string;
        description: string;
        generateAll: string;
        generating: string;
        generateSummary: string;
        filterLabel: string;
        filterAll: string;
        pending: string;
        drafted: string;
        needsReview: string;
        edited: string;
        unresolved: string;
        countSummary: string;
        statusColumn: string;
        subjectColumn: string;
        statuses: Record<
          | "PENDING"
          | "DRAFTED"
          | "NEEDS_REVIEW"
          | "APPROVED"
          | "EXCLUDED"
          | "OPENED_EXTERNALLY"
          | "SENT_MANUALLY"
          | "DELIVERED"
          | "SOFT_BOUNCED"
          | "HARD_BOUNCED"
          | "COMPLAINED"
          | "UNSUBSCRIBED"
          | "DELIVERY_FAILED"
          | "DEFERRED"
          | "SKIPPED"
          | "SUPPRESSED",
          string
        >;
        editedBadge: string;
        editorTitle: string;
        unresolvedWarning: string;
        saveDraft: string;
        saving: string;
        draftSaved: string;
        regenerateOne: string;
        confirmRegenerate: string;
        regenerated: string;
      };
      review: {
        title: string;
        description: string;
        approveOne: string;
        bulkApproveSafe: string;
        bulkSummary: string;
        unsafeReasons: string;
        blockReasons: Record<
          | "missing_email"
          | "invalid_email"
          | "suppressed"
          | "no_draft"
          | "needs_review"
          | "missing_subject"
          | "missing_body"
          | "unresolved_variables"
          | "sender_incomplete"
          | "missing_opt_out"
          | "campaign_locked"
          | "already_sent"
          | "not_approved"
          | "approval_stale",
          string
        >;
        approved: string;
        openedExternal: string;
        openedExternalStatus: string;
        sentManualStatus: string;
        markSentExternally: string;
        confirmSent: string;
        confirmSentBody: string;
        operatorNote: string;
        markedSent: string;
        simulateSend: string;
        simulated: string;
        invalidated: string;
        duplicateBlocked: string;
        cooldownWarning: string;
        cooldownOverride: string;
      };
      progress: {
        title: string;
        total: string;
        drafted: string;
        needsReview: string;
        approved: string;
        openedExternally: string;
        manuallySent: string;
        excluded: string;
        suppressed: string;
        skipped: string;
      };
    };
    providerEvents: {
      title: string;
      description: string;
      empty: string;
      eventType: string;
      status: string;
      effect: string;
      receivedAt: string;
      message: string;
    };
    sendJobs: {
      title: string;
      description: string;
      simulationBanner: string;
      productionIncomplete: string;
      brevoDisabled: string;
      empty: string;
      queueSimulation: string;
      processNextBatch: string;
      pause: string;
      resume: string;
      cancel: string;
      status: string;
      mode: string;
      provider: string;
      batchSize: string;
      dailyUsage: string;
      processed: string;
      sent: string;
      failed: string;
      retryPending: string;
      skipped: string;
      remaining: string;
      lock: string;
      lastProcessed: string;
      queued: string;
      processing: string;
      completed: string;
      paused: string;
      cancelled: string;
      confirmationRequired: string;
      confirmPause: string;
      confirmCancel: string;
      alreadyQueued: string;
      queuedSimulationJob: string;
      pausedResult: string;
      resumedResult: string;
      cancelledResult: string;
      result: string;
    };
    suppression: {
      title: string;
      description: string;
      emailPlaceholder: string;
      notesPlaceholder: string;
      searchPlaceholder: string;
      allReasons: string;
      allSources: string;
      add: string;
      remove: string;
      created: string;
      removed: string;
      error: string;
      removeConfirm: string;
      elevatedRequired: string;
      elevatedConfirmLabel: string;
      removalReasonPlaceholder: string;
      confirmRemove: string;
      viewContact: string;
      viewCampaign: string;
      reasons: Record<
        | "manual"
        | "unsubscribe"
        | "hard_bounce"
        | "complaint"
        | "invalid_address"
        | "duplicate"
        | "legal_request"
        | "other",
        string
      >;
      sources: Record<
        "operator" | "import" | "campaign" | "lead_detail" | "provider_webhook" | "public_unsubscribe" | "system",
        string
      >;
      columns: {
        email: string;
        reason: string;
        source: string;
        createdAt: string;
        actions: string;
      };
    };
    operationalSummary: {
      title: string;
      description: string;
      metrics: Record<
        | "importedOrganizations"
        | "validContacts"
        | "invalidOrMissingEmailContacts"
        | "draftCampaigns"
        | "draftsAwaitingReview"
        | "approvedRecipients"
        | "openedExternally"
        | "manuallySent"
        | "suppressed"
        | "recentWarnings",
        string
      >;
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
      chooseFile: string;
      description: string;
      duplicateEmails: string;
      duplicateRows: string;
      invalidRows: string;
      reviewRows: string;
      validRows: string;
      totalRows: string;
      possibleDuplicates: string;
      missingEmailRows: string;
      confirmImport: string;
      importing: string;
      summary: string;
      failed: string;
      fileHint: string;
      mappingTitle: string;
      unmapped: string;
      cancel: string;
      continuePreview: string;
      repeatImportWarning: string;
      repeatImportConfirm: string;
      filterStatus: string;
      filterAll: string;
      copyErrors: string;
      attachStrongDuplicates: string;
      approvePossible: string;
      backToMapping: string;
      retryMapping: string;
      importAnother: string;
      messages: string;
      selectSheet: string;
      mappingProfile: string;
      saveProfile: string;
      saveProfilePlaceholder: string;
      profileSaved: string;
      deleteProfile: string;
      deleteProfileConfirm: string;
      warningsFilter: string;
      showNormalized: string;
      downloadErrors: string;
      fields: Record<
        | "companyName"
        | "contactName"
        | "email"
        | "phone"
        | "website"
        | "region"
        | "country"
        | "industry"
        | "notes"
        | "sourceDatabase"
        | "status"
        | "language",
        string
      >;
    };
    statuses: Record<
      "ready" | "queued" | "contacted" | "replied" | "positive_reply" | "bounced",
      string
    >;
    qualities: Record<"high" | "medium" | "low", string>;
    industries: Record<
      "Hospitality" | "Events" | "Food & Beverage" | "Packaging" | "Sports venues",
      string
    >;
    campaignStatuses: Record<
      | "draft"
      | "ready_for_review"
      | "approved"
      | "in_progress"
      | "completed"
      | "paused"
      | "cancelled"
      | "active",
      string
    >;
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
    noInventory: string;
    leadopsHint: string;
    openOutreach: string;
    revenueTitle: string;
    revenueEstimated: string;
    copilotDisclaimer: string;
    copilotSend: string;
    copilotPrompts: {
      molds: string;
      delayedOrders: string;
      lowStock: string;
      quotations: string;
      campaigns: string;
    };
    kpi: {
      oee: string;
      revenue: string;
      openQuotations: string;
      delayedOrders: string;
      maintenanceAlerts: string;
    };
    marketing: {
      title: string;
      leadsReady: string;
      drafts: string;
      approved: string;
      opened: string;
      suppressed: string;
      openOutreach: string;
      openMarketing: string;
    };
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
    emptyDescription?: string;
    actions: { create: string };
    form: {
      createTitle: string;
      editTitle: string;
      companyName: string;
      contactName: string;
      email: string;
      phone: string;
      notes: string;
      required: string;
      invalidEmail: string;
    };
    table: {
      company: string;
      contact: string;
      email: string;
      sourceLead: string;
      opportunities: string;
      created: string;
    };
  };
  machinesModule: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    actions: { create: string };
    statuses: Record<"operational" | "maintenance" | "offline" | "retired", string>;
    form: {
      createTitle: string;
      editTitle: string;
      code: string;
      name: string;
      type: string;
      status: string;
      capacity: string;
      location: string;
      notes: string;
      required: string;
    };
    table: {
      code: string;
      name: string;
      type: string;
      status: string;
      capacity: string;
    };
  };
  inventoryModule: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    actions: { create: string; receiveStock: string };
    form: {
      createTitle: string;
      editTitle: string;
      sku: string;
      name: string;
      category: string;
      unit: string;
      reorderLevel: string;
      location: string;
      notes: string;
      required: string;
    };
    stock: {
      title: string;
      quantity: string;
      reason: string;
      submit: string;
      defaultReason: string;
    };
    table: {
      sku: string;
      name: string;
      quantity: string;
      unit: string;
      location: string;
    };
  };
  crudModule: {
    searchPlaceholder: string;
    showArchived: string;
    actions: {
      menu: string;
      edit: string;
      archive: string;
      restore: string;
      duplicate: string;
    };
    form: {
      create: string;
      save: string;
      cancel: string;
    };
    archive: {
      title: string;
      message: string;
      restoreMessage: string;
      confirm: string;
      cancel: string;
    };
    error: { generic: string };
    rolePreview: {
      badge: string;
      label: string;
      roles: Record<"owner" | "sales" | "production_manager" | "warehouse_manager", string>;
    };
    commandPalette: {
      placeholder: string;
      noResults: string;
      close: string;
      groups: {
        navigation: string;
        create: string;
        leads: string;
        customers: string;
        products: string;
        quotes: string;
        production: string;
        machines: string;
        inventory: string;
      };
      create: {
        lead: string;
        customer: string;
        product: string;
        quote: string;
        customizer: string;
        production: string;
        machine: string;
        inventory: string;
      };
    };
    quickCreate: {
      trigger: string;
      lead: string;
      customer: string;
      product: string;
      quote: string;
      production: string;
      machine: string;
      inventory: string;
      customizer: string;
    };
    customizeDialog: {
      title: string;
      message: string;
      close: string;
    };
  };
  quotationsModule: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    tabs: {
      label: string;
      quotations: string;
      customizer: string;
    };
    actions: { create: string; approve: string };
    form: {
      createTitle: string;
      customer: string;
      product: string;
      quantity: string;
      printColors: string;
      notes: string;
      selectCustomer: string;
      selectProduct: string;
      required: string;
    };
    statuses: Record<"draft" | "sent" | "approved" | "rejected", string>;
    table: {
      number: string;
      customer: string;
      product: string;
      quantity: string;
      status: string;
      source: string;
      total: string;
      created: string;
      manual: string;
      fromCustomizer: string;
      fromCustomizerEstimate: string;
    };
  };
  productionModule: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    openJobCard: string;
    actions: {
      assignMachine: string;
      start: string;
      complete: string;
    };
    form: {
      assignMachine: string;
      machine: string;
      selectMachine: string;
    };
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
  customizerModule: {
    title: string;
    description: string;
    loading: string;
    emptyProducts: string;
    emptySimulations: string;
    sections: {
      context: string;
      configuration: string;
      artwork: string;
      simulations: string;
      pricing: string;
    };
    form: {
      customer: string;
      lead: string;
      product: string;
      quantity: string;
      material: string;
      cupSize: string;
      cupType: string;
      printColors: string;
      printArea: string;
      artworkPosition: string;
      artworkScale: string;
      artworkOffsetX: string;
      artworkOffsetY: string;
      artworkRotation: string;
      deliveryDate: string;
      notes: string;
      selectCustomer: string;
      selectLead: string;
      required: string;
    };
    printAreas: Record<"wrap" | "front" | "back", string>;
    artworkPositions: Record<"left" | "center" | "right", string>;
    artwork: {
      upload: string;
      useLogo: string;
      useProductImage: string;
      uploaded: string;
      logoApplied: string;
      productImageApplied: string;
      noLogo: string;
      noProductImage: string;
    };
    preview: {
      label: string;
      brokenProductImage: string;
    };
    pricing: {
      estimateBadge: string;
      unitPrice: string;
      setupCost: string;
      subtotal: string;
      vat: string;
      total: string;
      assumptions: string;
      manualOverride: string;
      overrideReason: string;
      selectProduct: string;
    };
    actions: {
      save: string;
      saved: string;
      convertToQuote: string;
      converted: string;
      newSimulation: string;
      resetView: string;
      openCustomizer: string;
      openInCustomizer: string;
      customize: string;
      openForCustomer: string;
    };
    statuses: Record<"draft" | "saved" | "converted" | "archived", string>;
    leadopsMedia: {
      title: string;
      description: string;
      optIn: string;
      mockupPlaceholder: string;
      mockupReady: string;
      openCustomizer: string;
    };
  };
  onboardingModule: {
    title: string;
    subtitle: string;
    dismiss: string;
    progress: string;
    items: Record<
      | "company_profile"
      | "company_logo"
      | "sender_identity"
      | "abacus_configured"
      | "product_urls"
      | "product_image"
      | "leads_imported"
      | "first_email"
      | "first_quotation"
      | "customizer_tested"
      | "backup_exported",
      string
    >;
  };
  notificationsModule: {
    title: string;
    trigger: string;
    close: string;
    loading: string;
    empty: string;
    markAllRead: string;
  };
  hostedFeatures: {
    close: string;
    localMvpNote: string;
    features: Record<
      | "google"
      | "microsoft"
      | "supabase"
      | "smartlead"
      | "hosted-storage"
      | "cup-customizer"
      | "local-db",
      {
        title: string;
        description: string;
        requirements: string[];
      }
    >;
  };
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
