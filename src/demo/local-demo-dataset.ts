import { DEFAULT_TENANT_ID, SCHEMA_VERSION, SEED_VERSION } from "@/domain/constants";
import type { CustomizerSimulation } from "@/domain/customizer-types";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { EmailSuppression } from "@/domain/suppression-types";
import type {
  OutreachSendJob,
  OutreachSendJobAttempt,
  OutreachSendJobRecipient
} from "@/domain/send-job-types";
import type { OutreachMessage } from "@/domain/types";
import type { Customer, Opportunity, ProductionOrder, Quote } from "@/domain/types";
import { DEFAULT_ARCHIVABLE } from "@/persistence/archive-utils";
import { leadOpsCampaigns, leadOpsLeads } from "@/features/leadops/seed";
import { formatProductionOrderNumber, formatQuoteNumber } from "@/domain/mappers";

export const LOCAL_DEMO_TENANT_ID = DEFAULT_TENANT_ID;
export const LOCAL_DEMO_ANCHOR_TIME = "2026-06-01T10:00:00.000Z";
export const LOCAL_DEMO_META_SEED_KEY = "seedVersion";
export const LOCAL_DEMO_META_SCHEMA_KEY = "schemaVersion";

export const LOCAL_DEMO_CUSTOMER_IDS = [
  "customer_demo_atlantic",
  "customer_demo_cafe",
  "customer_demo_events"
] as const;

export const LOCAL_DEMO_OPPORTUNITY_IDS = [
  "opportunity_demo_atlantic",
  "opportunity_demo_cafe",
  "opportunity_demo_events"
] as const;

export const LOCAL_DEMO_QUOTE_IDS = [
  "quote_demo_draft",
  "quote_demo_approved",
  "quote_demo_sent"
] as const;

export const LOCAL_DEMO_PRODUCTION_ORDER_IDS = [
  "po_demo_active",
  "po_demo_delayed",
  "po_demo_blocked"
] as const;

export const LOCAL_DEMO_RECIPIENT_IDS = [
  "recipient_demo_approved",
  "recipient_demo_draft",
  "recipient_demo_simulated",
  "recipient_demo_suppressed"
] as const;

export const LOCAL_DEMO_SEND_JOB_IDS = ["sendjob_demo_completed"] as const;
export const LOCAL_DEMO_SEND_JOB_RECIPIENT_IDS = ["sendjob_recipient_demo_001"] as const;
export const LOCAL_DEMO_SEND_JOB_ATTEMPT_IDS = ["sendjob_attempt_demo_001"] as const;
export const LOCAL_DEMO_CUSTOMIZER_IDS = ["customizer_demo_cup_workflow"] as const;
export const LOCAL_DEMO_SUPPRESSION_IDS = ["suppression_demo_invalid_email"] as const;
export const LOCAL_DEMO_OUTREACH_MESSAGE_LEAD_IDS = [
  "leadops_003",
  "leadops_004",
  "leadops_005"
] as const;

export const LOCAL_DEMO_SEED_LEAD_IDS = leadOpsLeads
  .filter((lead) => lead.tenantId === LOCAL_DEMO_TENANT_ID)
  .map((lead) => lead.id);

export const LOCAL_DEMO_SEED_CAMPAIGN_IDS = leadOpsCampaigns
  .filter((campaign) => campaign.tenantId === LOCAL_DEMO_TENANT_ID)
  .map((campaign) => campaign.id);

export const LOCAL_DEMO_MANAGED_RECORD_IDS = {
  customers: [...LOCAL_DEMO_CUSTOMER_IDS],
  opportunities: [...LOCAL_DEMO_OPPORTUNITY_IDS],
  quotes: [...LOCAL_DEMO_QUOTE_IDS],
  productionOrders: [...LOCAL_DEMO_PRODUCTION_ORDER_IDS],
  campaignRecipients: [...LOCAL_DEMO_RECIPIENT_IDS],
  outreachSendJobs: [...LOCAL_DEMO_SEND_JOB_IDS],
  outreachSendJobRecipients: [...LOCAL_DEMO_SEND_JOB_RECIPIENT_IDS],
  outreachSendJobAttempts: [...LOCAL_DEMO_SEND_JOB_ATTEMPT_IDS],
  customizerSimulations: [...LOCAL_DEMO_CUSTOMIZER_IDS],
  emailSuppressions: [...LOCAL_DEMO_SUPPRESSION_IDS],
  leads: [...LOCAL_DEMO_SEED_LEAD_IDS],
  campaigns: [...LOCAL_DEMO_SEED_CAMPAIGN_IDS]
} as const;

export type LocalDemoDatasetManifest = {
  seedVersion: number;
  schemaVersion: number;
  tenantId: string;
  counts: Record<string, number>;
};

export function getLocalDemoDatasetManifest(): LocalDemoDatasetManifest {
  return {
    seedVersion: SEED_VERSION,
    schemaVersion: SCHEMA_VERSION,
    tenantId: LOCAL_DEMO_TENANT_ID,
    counts: {
      seedLeads: LOCAL_DEMO_SEED_LEAD_IDS.length,
      seedCampaigns: LOCAL_DEMO_SEED_CAMPAIGN_IDS.length,
      customers: LOCAL_DEMO_CUSTOMER_IDS.length,
      opportunities: LOCAL_DEMO_OPPORTUNITY_IDS.length,
      quotes: LOCAL_DEMO_QUOTE_IDS.length,
      productionOrders: LOCAL_DEMO_PRODUCTION_ORDER_IDS.length,
      campaignRecipients: LOCAL_DEMO_RECIPIENT_IDS.length,
      outreachMessages: LOCAL_DEMO_OUTREACH_MESSAGE_LEAD_IDS.length,
      sendJobs: LOCAL_DEMO_SEND_JOB_IDS.length,
      customizerSimulations: LOCAL_DEMO_CUSTOMIZER_IDS.length,
      emailSuppressions: LOCAL_DEMO_SUPPRESSION_IDS.length
    }
  };
}

function ts(offsetMinutes = 0): string {
  const base = Date.parse(LOCAL_DEMO_ANCHOR_TIME);
  return new Date(base + offsetMinutes * 60_000).toISOString();
}

export function buildLocalDemoCustomers(tenantId: string = LOCAL_DEMO_TENANT_ID): Customer[] {
  return [
    {
      id: LOCAL_DEMO_CUSTOMER_IDS[0],
      tenantId,
      leadId: "leadops_001",
      legalName: "Atlantic Catering Group, Lda.",
      tradingName: "Atlantic Catering",
      companyName: "Atlantic Catering Group",
      contactName: "Rita Ferreira",
      email: "rita.ferreira@atlantic-catering.example",
      phone: "+351 220 100 001",
      vatNumber: "PT509900001",
      addressLine1: "Rua do Comércio 12",
      addressLine2: "",
      postalCode: "4050-100",
      city: "Porto",
      country: "Portugal",
      website: "https://atlantic-catering.example",
      customerStatus: "active",
      notes: "Synthetic hospitality customer for demo outreach.",
      ...DEFAULT_ARCHIVABLE,
      createdAt: ts(10),
      updatedAt: ts(10)
    },
    {
      id: LOCAL_DEMO_CUSTOMER_IDS[1],
      tenantId,
      leadId: "leadops_003",
      legalName: "Lisbon Coffee Roasters, Unipessoal Lda.",
      tradingName: "Lisbon Coffee",
      companyName: "Lisbon Coffee Roasters",
      contactName: "Joao Almeida",
      email: "joao@lisboncoffee.example",
      phone: "+351 210 200 002",
      vatNumber: "PT509900002",
      addressLine1: "Avenida da Liberdade 88",
      addressLine2: "",
      postalCode: "1250-140",
      city: "Lisbon",
      country: "Portugal",
      website: "https://lisboncoffee.example",
      customerStatus: "active",
      notes: "Needs follow-up on cup artwork.",
      ...DEFAULT_ARCHIVABLE,
      createdAt: ts(20),
      updatedAt: ts(25)
    },
    {
      id: LOCAL_DEMO_CUSTOMER_IDS[2],
      tenantId,
      leadId: "leadops_004",
      legalName: "Summit Conference Services SA",
      tradingName: "Summit Conference",
      companyName: "Summit Conference Services",
      contactName: "Claire Dubois",
      email: "claire@summitconf.example",
      phone: "+33 4 72 300 003",
      vatNumber: "FR889900003",
      addressLine1: "15 Rue des Congrès",
      addressLine2: "",
      postalCode: "69002",
      city: "Lyon",
      country: "France",
      website: "https://summitconf.example",
      customerStatus: "prospect",
      notes: "Event cups quotation in review.",
      ...DEFAULT_ARCHIVABLE,
      createdAt: ts(30),
      updatedAt: ts(35)
    }
  ];
}

export function buildLocalDemoOpportunities(tenantId: string = LOCAL_DEMO_TENANT_ID): Opportunity[] {
  return [
    {
      id: LOCAL_DEMO_OPPORTUNITY_IDS[0],
      tenantId,
      leadId: "leadops_001",
      customerId: LOCAL_DEMO_CUSTOMER_IDS[0],
      title: "Atlantic summer cup program",
      stage: "proposal",
      estimatedValue: 4200,
      createdAt: ts(11),
      updatedAt: ts(11)
    },
    {
      id: LOCAL_DEMO_OPPORTUNITY_IDS[1],
      tenantId,
      leadId: "leadops_003",
      customerId: LOCAL_DEMO_CUSTOMER_IDS[1],
      title: "Lisbon Coffee branded cups",
      stage: "qualification",
      estimatedValue: 1800,
      createdAt: ts(21),
      updatedAt: ts(21)
    },
    {
      id: LOCAL_DEMO_OPPORTUNITY_IDS[2],
      tenantId,
      leadId: "leadops_004",
      customerId: LOCAL_DEMO_CUSTOMER_IDS[2],
      title: "Summit conference reusable cups",
      stage: "negotiation",
      estimatedValue: 9600,
      createdAt: ts(31),
      updatedAt: ts(31)
    }
  ];
}

export function buildLocalDemoQuotes(tenantId: string = LOCAL_DEMO_TENANT_ID): Quote[] {
  const common = {
    tenantId,
    productId: "prod_pp_cup_330",
    productName: "Personalized PP Cup 330 ml",
    quantity: 5000,
    printColorCount: 2,
    discount: 0,
    validityDate: "2026-08-01",
    notes: "Synthetic demo quotation.",
    simulationId: LOCAL_DEMO_CUSTOMIZER_IDS[0],
    mockupAssetId: null,
    isEstimate: false,
    ...DEFAULT_ARCHIVABLE
  };

  return [
    {
      ...common,
      id: LOCAL_DEMO_QUOTE_IDS[0],
      quoteNumber: formatQuoteNumber(101),
      leadId: "leadops_003",
      customerId: LOCAL_DEMO_CUSTOMER_IDS[1],
      opportunityId: LOCAL_DEMO_OPPORTUNITY_IDS[1],
      status: "draft",
      lines: [
        {
          productId: "prod_pp_cup_330",
          productName: "Personalized PP Cup 330 ml",
          quantity: 5000,
          unitPrice: 0.052,
          setupCost: 35,
          lineTotal: 295
        }
      ],
      subtotal: 295,
      vat: 67.85,
      total: 362.85,
      createdAt: ts(22),
      updatedAt: ts(22)
    },
    {
      ...common,
      id: LOCAL_DEMO_QUOTE_IDS[1],
      quoteNumber: formatQuoteNumber(102),
      leadId: "leadops_004",
      customerId: LOCAL_DEMO_CUSTOMER_IDS[2],
      opportunityId: LOCAL_DEMO_OPPORTUNITY_IDS[2],
      status: "approved",
      quantity: 12000,
      lines: [
        {
          productId: "prod_pp_cup_330",
          productName: "Personalized PP Cup 330 ml",
          quantity: 12000,
          unitPrice: 0.052,
          setupCost: 35,
          lineTotal: 659
        }
      ],
      subtotal: 659,
      vat: 151.57,
      total: 810.57,
      createdAt: ts(32),
      updatedAt: ts(40)
    },
    {
      ...common,
      id: LOCAL_DEMO_QUOTE_IDS[2],
      quoteNumber: formatQuoteNumber(103),
      leadId: "leadops_005",
      customerId: null,
      opportunityId: null,
      status: "sent",
      quantity: 8000,
      lines: [
        {
          productId: "prod_pp_cup_330",
          productName: "Personalized PP Cup 330 ml",
          quantity: 8000,
          unitPrice: 0.052,
          setupCost: 35,
          lineTotal: 451
        }
      ],
      subtotal: 451,
      vat: 103.73,
      total: 554.73,
      createdAt: ts(42),
      updatedAt: ts(45)
    }
  ];
}

export function buildLocalDemoProductionOrders(
  tenantId: string = LOCAL_DEMO_TENANT_ID
): ProductionOrder[] {
  return [
    {
      id: LOCAL_DEMO_PRODUCTION_ORDER_IDS[0],
      tenantId,
      orderNumber: formatProductionOrderNumber(11),
      quoteId: LOCAL_DEMO_QUOTE_IDS[1],
      customerId: LOCAL_DEMO_CUSTOMER_IDS[2],
      customerName: "Summit Conference Services",
      productId: "prod_pp_cup_330",
      productName: "Personalized PP Cup 330 ml",
      quantity: 12000,
      completedQuantity: 4200,
      rejectedQuantity: 120,
      status: "in-progress",
      scheduledDate: "2026-06-12",
      plannedStart: ts(50),
      plannedEnd: ts(120),
      artworkStatus: "approved",
      screenStatus: "ready",
      machineId: "machine_uv_screen_01",
      machineName: "UV Screen Line 01",
      progress: 35,
      operatorNotes: "Active production batch for approved quote.",
      ...DEFAULT_ARCHIVABLE,
      createdAt: ts(50),
      updatedAt: ts(80)
    },
    {
      id: LOCAL_DEMO_PRODUCTION_ORDER_IDS[1],
      tenantId,
      orderNumber: formatProductionOrderNumber(12),
      quoteId: LOCAL_DEMO_QUOTE_IDS[0],
      customerId: LOCAL_DEMO_CUSTOMER_IDS[1],
      customerName: "Lisbon Coffee Roasters",
      productId: "prod_pp_cup_330",
      productName: "Personalized PP Cup 330 ml",
      quantity: 5000,
      completedQuantity: 0,
      rejectedQuantity: 0,
      status: "scheduled",
      scheduledDate: "2026-06-20",
      plannedStart: null,
      plannedEnd: null,
      artworkStatus: "pending",
      screenStatus: "pending",
      machineId: "machine_uv_screen_01",
      machineName: "UV Screen Line 01",
      progress: 0,
      operatorNotes: "Delayed pending artwork approval.",
      ...DEFAULT_ARCHIVABLE,
      createdAt: ts(23),
      updatedAt: ts(23)
    },
    {
      id: LOCAL_DEMO_PRODUCTION_ORDER_IDS[2],
      tenantId,
      orderNumber: formatProductionOrderNumber(13),
      quoteId: LOCAL_DEMO_QUOTE_IDS[2],
      customerId: null,
      customerName: "GreenPack Solutions",
      productId: "prod_pp_cup_330",
      productName: "Personalized PP Cup 330 ml",
      quantity: 8000,
      completedQuantity: 0,
      rejectedQuantity: 0,
      status: "blocked",
      scheduledDate: "2026-06-18",
      plannedStart: null,
      plannedEnd: null,
      artworkStatus: "pending",
      screenStatus: "pending",
      machineId: "machine_bag_screen_01",
      machineName: "Bag Screen Station",
      progress: 0,
      operatorNotes: "Blocked: low ink stock flagged in inventory.",
      ...DEFAULT_ARCHIVABLE,
      createdAt: ts(46),
      updatedAt: ts(46)
    }
  ];
}

export function buildLocalDemoCampaignRecipients(
  tenantId: string = LOCAL_DEMO_TENANT_ID
): CampaignRecipient[] {
  return [
    {
      id: LOCAL_DEMO_RECIPIENT_IDS[0],
      tenantId,
      campaignId: "campaign_001",
      leadId: "leadops_002",
      contactId: null,
      snapshotEmail: "e.lindstrom@nordicevents.example",
      snapshotCompanyName: "Nordic Events Supply",
      snapshotContactName: "Erik Lindstrom",
      snapshotCategory: "Events",
      snapshotRegion: "Gothenburg",
      snapshotWebsite: "https://nordicevents.example",
      greetingOverride: "",
      organizationDisplayNameOverride: "",
      contactSalutation: null,
      inclusionReason: "Segment: hospitality Q2",
      status: "included",
      personalizedSubject: "Copos personalizados para eventos nórdicos",
      personalizedPlainText: "Olá Erik,\n\nSegue proposta resumida para copos personalizados.\n",
      personalizedHtml: "",
      draftStatus: "APPROVED",
      generatedAt: ts(15),
      generationMethod: "deterministic_template",
      templateVersion: 1,
      userEdited: false,
      draftUpdatedAt: ts(15),
      approvedAt: ts(16),
      approvedBy: "seed",
      approvalContentHash: "hash-approved-001",
      approvalInvalidatedAt: null,
      approvalInvalidationReason: null,
      openedExternallyAt: null,
      externalClient: null,
      sentAt: null,
      sentBy: null,
      recipientDeliveryMode: "simulation",
      operatorNote: "",
      simulatedAt: null,
      sendIdempotencyKey: null,
      createdAt: ts(15)
    },
    {
      id: LOCAL_DEMO_RECIPIENT_IDS[1],
      tenantId,
      campaignId: "campaign_002",
      leadId: "leadops_008",
      contactId: null,
      snapshotEmail: "tom@urbanbistro.example",
      snapshotCompanyName: "Urban Bistro Chain",
      snapshotContactName: "Tom Walsh",
      snapshotCategory: "Food & Beverage",
      snapshotRegion: "Dublin",
      snapshotWebsite: "https://urbanbistro.example",
      greetingOverride: "",
      organizationDisplayNameOverride: "",
      contactSalutation: null,
      inclusionReason: "Segment: food service pilot",
      status: "included",
      personalizedSubject: "",
      personalizedPlainText: "",
      personalizedHtml: "",
      draftStatus: "PENDING",
      generatedAt: null,
      generationMethod: null,
      templateVersion: null,
      userEdited: false,
      draftUpdatedAt: null,
      approvedAt: null,
      approvedBy: null,
      approvalContentHash: null,
      approvalInvalidatedAt: null,
      approvalInvalidationReason: null,
      openedExternallyAt: null,
      externalClient: null,
      sentAt: null,
      sentBy: null,
      recipientDeliveryMode: null,
      operatorNote: "",
      simulatedAt: null,
      sendIdempotencyKey: null,
      createdAt: ts(18)
    },
    {
      id: LOCAL_DEMO_RECIPIENT_IDS[2],
      tenantId,
      campaignId: "campaign_001",
      leadId: "leadops_003",
      contactId: null,
      snapshotEmail: "joao@lisboncoffee.example",
      snapshotCompanyName: "Lisbon Coffee Roasters",
      snapshotContactName: "Joao Almeida",
      snapshotCategory: "Food & Beverage",
      snapshotRegion: "Lisbon",
      snapshotWebsite: "https://lisboncoffee.example",
      greetingOverride: "",
      organizationDisplayNameOverride: "",
      contactSalutation: null,
      inclusionReason: "Approved simulation recipient",
      status: "included",
      personalizedSubject: "Proposta de copos para cafés",
      personalizedPlainText: "Olá Joao,\n\nPodemos preparar uma amostra de copos personalizados.\n",
      personalizedHtml: "",
      draftStatus: "DELIVERED",
      generatedAt: ts(20),
      generationMethod: "deterministic_template",
      templateVersion: 1,
      userEdited: false,
      draftUpdatedAt: ts(20),
      approvedAt: ts(21),
      approvedBy: "seed",
      approvalContentHash: "hash-simulated-001",
      approvalInvalidatedAt: null,
      approvalInvalidationReason: null,
      openedExternallyAt: null,
      externalClient: null,
      sentAt: null,
      sentBy: null,
      recipientDeliveryMode: "simulation",
      operatorNote: "Simulated send job completed.",
      simulatedAt: ts(55),
      sendIdempotencyKey: "demo-send:recipient_demo_simulated",
      createdAt: ts(20)
    },
    {
      id: LOCAL_DEMO_RECIPIENT_IDS[3],
      tenantId,
      campaignId: "campaign_001",
      leadId: "leadops_006",
      contactId: null,
      snapshotEmail: "helena.costa@metro-stadium.invalid",
      snapshotCompanyName: "Metro Stadium Services",
      snapshotContactName: "Helena Costa",
      snapshotCategory: "Sports venues",
      snapshotRegion: "Madrid",
      snapshotWebsite: "",
      greetingOverride: "",
      organizationDisplayNameOverride: "",
      contactSalutation: null,
      inclusionReason: "Invalid email demonstration",
      status: "excluded",
      personalizedSubject: "",
      personalizedPlainText: "",
      personalizedHtml: "",
      draftStatus: "SUPPRESSED",
      generatedAt: null,
      generationMethod: null,
      templateVersion: null,
      userEdited: false,
      draftUpdatedAt: null,
      approvedAt: null,
      approvedBy: null,
      approvalContentHash: null,
      approvalInvalidatedAt: null,
      approvalInvalidationReason: null,
      openedExternallyAt: null,
      externalClient: null,
      sentAt: null,
      sentBy: null,
      recipientDeliveryMode: null,
      operatorNote: "Suppressed due to invalid email.",
      simulatedAt: null,
      sendIdempotencyKey: null,
      createdAt: ts(12)
    }
  ];
}

export function buildLocalDemoOutreachMessages(tenantId: string = LOCAL_DEMO_TENANT_ID): OutreachMessage[] {
  return [
    {
      id: "leadops_003",
      tenantId,
      leadId: "leadops_003",
      campaignId: "campaign_001",
      message: {
        subject: "Copos personalizados para a sua marca",
        body: "Olá Joao,\n\nTemos opções de copos PP 330 ml com impressão UV.\n",
        generationMethod: "deterministic-template",
        approved: true,
        edited: false
      },
      providerState: "approved",
      queuedAt: null,
      sentAt: null,
      metricsUpdated: false,
      updatedAt: ts(20)
    },
    {
      id: "leadops_004",
      tenantId,
      leadId: "leadops_004",
      campaignId: "campaign_002",
      message: {
        subject: "Reusable cups for conference venues",
        body: "Hello Claire,\n\nWe can support reusable cup programs for large events.\n",
        generationMethod: "deterministic-template",
        approved: false,
        edited: false
      },
      providerState: "draft",
      queuedAt: null,
      sentAt: null,
      metricsUpdated: false,
      updatedAt: ts(30)
    },
    {
      id: "leadops_005",
      tenantId,
      leadId: "leadops_005",
      campaignId: "campaign_002",
      message: {
        subject: "Embalagens sustentáveis com marca",
        body: "Olá Miguel,\n\nPodemos combinar copos e embalagens com a sua identidade visual.\n",
        generationMethod: "deterministic-template",
        approved: true,
        edited: false
      },
      providerState: "approved",
      queuedAt: null,
      sentAt: ts(35),
      metricsUpdated: true,
      updatedAt: ts(35)
    }
  ];
}

export function buildLocalDemoSendJobs(tenantId: string = LOCAL_DEMO_TENANT_ID): OutreachSendJob[] {
  return [
    {
      id: LOCAL_DEMO_SEND_JOB_IDS[0],
      tenantId,
      campaignId: "campaign_001",
      provider: "simulation",
      deliveryMode: "simulation",
      status: "COMPLETED",
      batchSize: 25,
      delayMs: 500,
      dailyLimit: 200,
      maxRetries: 2,
      createdBy: "seed",
      approvedBy: "seed",
      createdAt: ts(52),
      queuedAt: ts(53),
      startedAt: ts(54),
      pausedAt: null,
      pausedBy: null,
      pauseReason: null,
      resumedAt: null,
      resumedBy: null,
      completedAt: ts(56),
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      lastProcessedAt: ts(56),
      processedCount: 1,
      sentCount: 1,
      failedCount: 0,
      retryPendingCount: 0,
      skippedCount: 0,
      remainingCount: 0,
      lockOwner: null,
      lockAcquiredAt: null,
      lockExpiresAt: null,
      lastStopReason: null,
      version: 1
    }
  ];
}

export function buildLocalDemoSendJobRecipients(
  tenantId: string = LOCAL_DEMO_TENANT_ID
): OutreachSendJobRecipient[] {
  return [
    {
      id: LOCAL_DEMO_SEND_JOB_RECIPIENT_IDS[0],
      tenantId,
      sendJobId: LOCAL_DEMO_SEND_JOB_IDS[0],
      campaignId: "campaign_001",
      campaignRecipientId: LOCAL_DEMO_RECIPIENT_IDS[2],
      contactId: null,
      leadId: "leadops_003",
      normalizedEmail: "joao@lisboncoffee.example",
      approvedContentVersion: "hash-simulated-001",
      status: "DELIVERED",
      attemptCount: 1,
      nextAttemptAt: null,
      idempotencyKey: "demo-send:recipient_demo_simulated",
      providerMessageId: "sim-msg-demo-001",
      lastErrorCode: null,
      lastErrorMessage: null,
      queuedAt: ts(53),
      processingStartedAt: ts(54),
      sentAt: ts(55),
      completedAt: ts(55),
      createdAt: ts(53),
      updatedAt: ts(55)
    }
  ];
}

export function buildLocalDemoSendJobAttempts(
  tenantId: string = LOCAL_DEMO_TENANT_ID
): OutreachSendJobAttempt[] {
  return [
    {
      id: LOCAL_DEMO_SEND_JOB_ATTEMPT_IDS[0],
      tenantId,
      sendJobId: LOCAL_DEMO_SEND_JOB_IDS[0],
      sendJobRecipientId: LOCAL_DEMO_SEND_JOB_RECIPIENT_IDS[0],
      campaignId: "campaign_001",
      campaignRecipientId: LOCAL_DEMO_RECIPIENT_IDS[2],
      leadId: "leadops_003",
      attemptNumber: 1,
      provider: "simulation",
      deliveryMode: "simulation",
      idempotencyKey: "demo-send:recipient_demo_simulated",
      startedAt: ts(54),
      completedAt: ts(55),
      status: "ACCEPTED",
      providerMessageId: "sim-msg-demo-001",
      retryable: false,
      sanitizedErrorCode: null,
      sanitizedErrorMessage: null,
      providerCategory: "simulation"
    }
  ];
}

export function buildLocalDemoCustomizerSimulations(
  tenantId: string = LOCAL_DEMO_TENANT_ID
): CustomizerSimulation[] {
  return [
    {
      id: LOCAL_DEMO_CUSTOMIZER_IDS[0],
      tenantId,
      customerId: LOCAL_DEMO_CUSTOMER_IDS[1],
      leadId: "leadops_003",
      productId: "prod_pp_cup_330",
      productName: "Personalized PP Cup 330 ml",
      configuration: {
        material: "PP",
        cupSize: "330 ml",
        cupType: "single-wall",
        printColorCount: 2,
        printArea: "70 x 55 mm",
        artworkPosition: "center",
        artworkScale: 1,
        artworkOffsetX: 0,
        artworkOffsetY: 0,
        artworkRotation: 0,
        desiredDeliveryDate: "2026-07-15"
      },
      quantity: 5000,
      artworkAssetId: null,
      mockupAssetId: null,
      mockupGeneration: {
        status: "complete",
        provider: "deterministic",
        configurationFingerprint: "demo-cup-fp-001",
        generatedAt: ts(24),
        realisticMockupAssetId: null,
        promptVersion: "demo-v1"
      },
      workflowStatus: "READY_FOR_QUOTATION",
      pricing: {
        unitPrice: 0.052,
        setupCost: 35,
        subtotal: 295,
        vat: 67.85,
        total: 362.85,
        assumptions: ["Synthetic pricing for demo only."],
        isEstimate: false,
        manualUnitPriceOverride: null,
        overrideReason: null,
        ruleId: "demo-rule-001"
      },
      quoteId: LOCAL_DEMO_QUOTE_IDS[0],
      notes: "Complete custom cup workflow linked to draft quotation.",
      status: "saved",
      createdBy: "seed",
      ...DEFAULT_ARCHIVABLE,
      createdAt: ts(24),
      updatedAt: ts(24)
    }
  ];
}

export function buildLocalDemoSuppressions(tenantId: string = LOCAL_DEMO_TENANT_ID): EmailSuppression[] {
  return [
    {
      id: LOCAL_DEMO_SUPPRESSION_IDS[0],
      tenantId,
      normalizedEmail: "helena.costa@metro-stadium.invalid",
      reason: "invalid_address",
      source: "system",
      campaignId: "campaign_001",
      leadId: "leadops_006",
      contactId: null,
      notes: "Synthetic invalid email for suppression demo.",
      createdBy: "seed",
      createdAt: ts(12),
      removedBy: null,
      removedAt: null,
      removalReason: null,
      active: true
    }
  ];
}
