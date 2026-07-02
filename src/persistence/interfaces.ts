import type {
  CreateCustomerContactInput,
  CreateInventoryItemInput,
  CreateMachineInput,
  CustomerContact,
  InventoryItem,
  Machine,
  StockChangeInput,
  StockMovement,
  UpdateInventoryItemInput,
  UpdateMachineInput
} from "@/domain/operations-types";
import type {
  CompanyProfile,
  CreateCompanyProfileInput,
  CreateLocalAssetInput,
  CreateSenderIdentityInput,
  CreateUserProfileInput,
  LocalAsset,
  SenderIdentity,
  UpdateCompanyProfileInput,
  UpdateSenderIdentityInput,
  UpdateUserProfileInput,
  UserProfile
} from "@/domain/profile-types";
import type {
  CreateCustomizerSimulationInput,
  CustomizerSimulation,
  UpdateCustomizerSimulationInput
} from "@/domain/customizer-types";
import type { CreateProductInput, Product, UpdateProductInput } from "@/domain/product-types";
import type {
  ActivityEvent,
  Campaign,
  CreateActivityEventInput,
  CreateCustomerInput,
  CreateLeadInput,
  CreateQuoteInput,
  Customer,
  Lead,
  Opportunity,
  OutreachMessage,
  ProductionOrder,
  Quote,
  UpdateCustomerInput,
  UpdateLeadInput,
  UpdateQuoteInput
} from "@/domain/types";
import type { ArchiveInput, ListOptions } from "@/persistence/archive-utils";
import type { OutreachCampaign } from "@/domain/campaign-types";
import type {
  CampaignRecipientRepository,
  OutreachCampaignRepository
} from "@/persistence/indexeddb/campaign-repositories";
import type { EmailSuppressionRepository } from "@/persistence/indexeddb/suppression-repositories";
import type { OutreachProviderEventRepository } from "@/persistence/indexeddb/provider-event-repositories";
import type { OutreachSendAttemptRepository } from "@/persistence/indexeddb/send-attempt-repositories";
import type {
  OutreachSendJobAttemptRepository,
  OutreachSendJobDailyUsageRepository,
  OutreachSendJobRecipientRepository,
  OutreachSendJobRepository
} from "@/persistence/indexeddb/send-job-repositories";
import type {
  ImportBatchRepository,
  ImportRowRepository,
  LeadContactRepository
} from "@/persistence/indexeddb/import-repositories";

export type { ListOptions, ArchiveInput };

export interface LeadRepository {
  list(tenantId: string, options?: ListOptions): Promise<Lead[]>;
  getById(tenantId: string, leadId: string): Promise<Lead | null>;
  getByEmail(tenantId: string, email: string): Promise<Lead | null>;
  create(tenantId: string, input: CreateLeadInput): Promise<Lead>;
  createMany(tenantId: string, inputs: CreateLeadInput[]): Promise<Lead[]>;
  update(tenantId: string, leadId: string, input: UpdateLeadInput): Promise<Lead>;
  duplicate(tenantId: string, leadId: string): Promise<Lead>;
  archive(tenantId: string, leadId: string, input?: ArchiveInput): Promise<Lead>;
  restore(tenantId: string, leadId: string): Promise<Lead>;
}

export interface CustomerRepository {
  list(tenantId: string, options?: ListOptions): Promise<Customer[]>;
  getById(tenantId: string, customerId: string): Promise<Customer | null>;
  getByLeadId(tenantId: string, leadId: string): Promise<Customer | null>;
  create(tenantId: string, input: CreateCustomerInput): Promise<Customer>;
  createFromLead(tenantId: string, leadId: string): Promise<Customer>;
  update(tenantId: string, customerId: string, input: UpdateCustomerInput): Promise<Customer>;
  archive(tenantId: string, customerId: string, input?: ArchiveInput): Promise<Customer>;
  restore(tenantId: string, customerId: string): Promise<Customer>;
}

export interface CustomerContactRepository {
  listForCustomer(
    tenantId: string,
    customerId: string,
    options?: ListOptions
  ): Promise<CustomerContact[]>;
  create(tenantId: string, input: CreateCustomerContactInput): Promise<CustomerContact>;
  update(
    tenantId: string,
    id: string,
    input: Partial<CreateCustomerContactInput>
  ): Promise<CustomerContact>;
  archive(tenantId: string, id: string, input?: ArchiveInput): Promise<CustomerContact>;
  restore(tenantId: string, id: string): Promise<CustomerContact>;
}

export interface OpportunityRepository {
  list(tenantId: string): Promise<Opportunity[]>;
  getById(tenantId: string, opportunityId: string): Promise<Opportunity | null>;
  getByLeadId(tenantId: string, leadId: string): Promise<Opportunity | null>;
  getByCustomerId(tenantId: string, customerId: string): Promise<Opportunity[]>;
  createFromLead(tenantId: string, leadId: string, customerId?: string): Promise<Opportunity>;
}

export interface QuoteRepository {
  list(tenantId: string, options?: ListOptions): Promise<Quote[]>;
  getById(tenantId: string, quoteId: string): Promise<Quote | null>;
  getByLeadId(tenantId: string, leadId: string): Promise<Quote | null>;
  getByCustomerId(tenantId: string, customerId: string): Promise<Quote[]>;
  create(tenantId: string, input: CreateQuoteInput): Promise<Quote>;
  update(tenantId: string, quoteId: string, input: UpdateQuoteInput): Promise<Quote>;
  duplicate(tenantId: string, quoteId: string): Promise<Quote>;
  updateStatus(tenantId: string, quoteId: string, status: Quote["status"]): Promise<Quote>;
  approve(tenantId: string, quoteId: string): Promise<Quote>;
  reject(tenantId: string, quoteId: string, reason?: string): Promise<Quote>;
  archive(tenantId: string, quoteId: string, input?: ArchiveInput): Promise<Quote>;
  restore(tenantId: string, quoteId: string): Promise<Quote>;
}

export interface ProductionOrderRepository {
  list(tenantId: string, options?: ListOptions): Promise<ProductionOrder[]>;
  getById(tenantId: string, orderId: string): Promise<ProductionOrder | null>;
  getByQuoteId(tenantId: string, quoteId: string): Promise<ProductionOrder | null>;
  getByMachineId(tenantId: string, machineId: string): Promise<ProductionOrder[]>;
  createFromQuote(tenantId: string, quoteId: string): Promise<ProductionOrder>;
  create(
    tenantId: string,
    input: {
      quoteId: string;
      customerId?: string | null;
      productId: string;
      productName: string;
      quantity: number;
      customerName?: string;
    }
  ): Promise<ProductionOrder>;
  update(
    tenantId: string,
    orderId: string,
    input: Partial<
      Pick<
        ProductionOrder,
        | "machineId"
        | "machineName"
        | "status"
        | "progress"
        | "artworkStatus"
        | "screenStatus"
        | "operatorNotes"
        | "completedQuantity"
        | "rejectedQuantity"
        | "plannedStart"
        | "plannedEnd"
        | "scheduledDate"
      >
    >
  ): Promise<ProductionOrder>;
  assignMachine(
    tenantId: string,
    orderId: string,
    machineId: string,
    machineName: string
  ): Promise<ProductionOrder>;
  archive(tenantId: string, orderId: string, input?: ArchiveInput): Promise<ProductionOrder>;
  restore(tenantId: string, orderId: string): Promise<ProductionOrder>;
}

export interface MachineRepository {
  list(tenantId: string, options?: ListOptions): Promise<Machine[]>;
  getById(tenantId: string, id: string): Promise<Machine | null>;
  getByCode(tenantId: string, code: string): Promise<Machine | null>;
  create(tenantId: string, input: CreateMachineInput): Promise<Machine>;
  update(tenantId: string, id: string, input: UpdateMachineInput): Promise<Machine>;
  duplicate(tenantId: string, id: string): Promise<Machine>;
  archive(tenantId: string, id: string, input?: ArchiveInput): Promise<Machine>;
  restore(tenantId: string, id: string): Promise<Machine>;
  listForProduct(tenantId: string, productId: string, options?: ListOptions): Promise<Machine[]>;
}

export interface InventoryRepository {
  list(tenantId: string, options?: ListOptions): Promise<InventoryItem[]>;
  getById(tenantId: string, id: string): Promise<InventoryItem | null>;
  create(tenantId: string, input: CreateInventoryItemInput): Promise<InventoryItem>;
  update(tenantId: string, id: string, input: UpdateInventoryItemInput): Promise<InventoryItem>;
  archive(tenantId: string, id: string, input?: ArchiveInput): Promise<InventoryItem>;
  restore(tenantId: string, id: string): Promise<InventoryItem>;
  recordReceipt(
    tenantId: string,
    id: string,
    input: StockChangeInput
  ): Promise<{ item: InventoryItem; movement: StockMovement }>;
  recordConsumption(
    tenantId: string,
    id: string,
    input: StockChangeInput
  ): Promise<{ item: InventoryItem; movement: StockMovement }>;
  adjustStock(
    tenantId: string,
    id: string,
    input: StockChangeInput
  ): Promise<{ item: InventoryItem; movement: StockMovement }>;
  listMovements(tenantId: string, inventoryItemId: string): Promise<StockMovement[]>;
}

export interface OutreachMessageRepository {
  listForLead(tenantId: string, leadId: string): Promise<OutreachMessage[]>;
  listAll(tenantId: string): Promise<OutreachMessage[]>;
  getForLead(tenantId: string, leadId: string): Promise<OutreachMessage | null>;
  saveDraft(tenantId: string, leadId: string, message: OutreachMessage): Promise<OutreachMessage>;
  countBySenderIdentity(tenantId: string, senderIdentityId: string): Promise<number>;
}

export interface CompanyProfileRepository {
  getForTenant(tenantId: string): Promise<CompanyProfile | null>;
  getById(tenantId: string, id: string): Promise<CompanyProfile | null>;
  create(tenantId: string, input: CreateCompanyProfileInput): Promise<CompanyProfile>;
  update(tenantId: string, id: string, input: UpdateCompanyProfileInput): Promise<CompanyProfile>;
  ensureDefault(tenantId: string, defaults: CreateCompanyProfileInput): Promise<CompanyProfile>;
}

export interface UserProfileRepository {
  list(tenantId: string): Promise<UserProfile[]>;
  getById(tenantId: string, id: string): Promise<UserProfile | null>;
  getCurrent(tenantId: string): Promise<UserProfile | null>;
  create(tenantId: string, input: CreateUserProfileInput): Promise<UserProfile>;
  update(tenantId: string, id: string, input: UpdateUserProfileInput): Promise<UserProfile>;
  ensureDefault(tenantId: string, defaults: CreateUserProfileInput): Promise<UserProfile>;
}

export interface SenderIdentityRepository {
  list(tenantId: string): Promise<SenderIdentity[]>;
  listAll(tenantId: string): Promise<SenderIdentity[]>;
  getById(tenantId: string, id: string): Promise<SenderIdentity | null>;
  getDefault(tenantId: string): Promise<SenderIdentity | null>;
  create(tenantId: string, input: CreateSenderIdentityInput): Promise<SenderIdentity>;
  update(tenantId: string, id: string, input: UpdateSenderIdentityInput): Promise<SenderIdentity>;
  duplicate(tenantId: string, id: string): Promise<SenderIdentity>;
  archive(tenantId: string, id: string): Promise<SenderIdentity>;
  setDefault(tenantId: string, id: string): Promise<SenderIdentity>;
  ensureDefault(tenantId: string, defaults: CreateSenderIdentityInput): Promise<SenderIdentity>;
}

export interface LocalAssetRepository {
  list(tenantId: string): Promise<LocalAsset[]>;
  getById(tenantId: string, id: string): Promise<LocalAsset | null>;
  create(tenantId: string, input: CreateLocalAssetInput): Promise<LocalAsset>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface ProductRepository {
  list(tenantId: string, options?: ListOptions): Promise<Product[]>;
  getById(tenantId: string, id: string): Promise<Product | null>;
  getBySku(tenantId: string, sku: string): Promise<Product | null>;
  create(tenantId: string, input: CreateProductInput): Promise<Product>;
  update(tenantId: string, id: string, input: UpdateProductInput): Promise<Product>;
  duplicate(tenantId: string, id: string): Promise<Product>;
  archive(tenantId: string, id: string, input?: ArchiveInput): Promise<Product>;
  restore(tenantId: string, id: string): Promise<Product>;
  createMany(tenantId: string, inputs: CreateProductInput[]): Promise<Product[]>;
  listEmailPromotable(tenantId: string): Promise<Product[]>;
}

export type CampaignRepository = OutreachCampaignRepository;

export interface ActivityRepository {
  list(tenantId: string): Promise<ActivityEvent[]>;
  listForEntity(tenantId: string, entityType: string, entityId: string): Promise<ActivityEvent[]>;
  append(tenantId: string, event: CreateActivityEventInput): Promise<ActivityEvent>;
}

export interface CustomizerSimulationRepository {
  list(tenantId: string, options?: ListOptions): Promise<CustomizerSimulation[]>;
  getById(tenantId: string, id: string): Promise<CustomizerSimulation | null>;
  create(tenantId: string, input: CreateCustomizerSimulationInput): Promise<CustomizerSimulation>;
  update(
    tenantId: string,
    id: string,
    input: UpdateCustomizerSimulationInput
  ): Promise<CustomizerSimulation>;
  duplicate(tenantId: string, id: string): Promise<CustomizerSimulation>;
  archive(tenantId: string, id: string, input?: ArchiveInput): Promise<CustomizerSimulation>;
  restore(tenantId: string, id: string): Promise<CustomizerSimulation>;
}

export interface MetaRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface LocalRepositoryBundle {
  leads: LeadRepository;
  customers: CustomerRepository;
  customerContacts: CustomerContactRepository;
  opportunities: OpportunityRepository;
  quotes: QuoteRepository;
  productionOrders: ProductionOrderRepository;
  machines: MachineRepository;
  inventory: InventoryRepository;
  outreachMessages: OutreachMessageRepository;
  campaigns: CampaignRepository;
  campaignRecipients: CampaignRecipientRepository;
  activities: ActivityRepository;
  meta: MetaRepository;
  companyProfiles: CompanyProfileRepository;
  userProfiles: UserProfileRepository;
  senderIdentities: SenderIdentityRepository;
  localAssets: LocalAssetRepository;
  products: ProductRepository;
  customizerSimulations: CustomizerSimulationRepository;
  importBatches: ImportBatchRepository;
  importRows: ImportRowRepository;
  leadContacts: LeadContactRepository;
  emailSuppressions: EmailSuppressionRepository;
  outreachSendAttempts: OutreachSendAttemptRepository;
  outreachProviderEvents: OutreachProviderEventRepository;
  outreachSendJobs: OutreachSendJobRepository;
  outreachSendJobRecipients: OutreachSendJobRecipientRepository;
  outreachSendJobAttempts: OutreachSendJobAttemptRepository;
  outreachSendJobDailyUsage: OutreachSendJobDailyUsageRepository;
  reset(): Promise<void>;
  resetDemoData(tenantId: string): Promise<void>;
  seed(tenantId: string): Promise<void>;
  importBackupData?(backup: import("@/features/backup/service").ForgeOSBackup): Promise<void>;
}

/** Placeholder for future Supabase-backed repositories. */
export type SupabaseRepositoryBundle = LocalRepositoryBundle;

export type PersistenceErrorCode =
  | "unavailable"
  | "init_failed"
  | "not_found"
  | "duplicate"
  | "invalid_transition"
  | "missing_link"
  | "forbidden";

export class PersistenceError extends Error {
  constructor(
    public readonly code: PersistenceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}
