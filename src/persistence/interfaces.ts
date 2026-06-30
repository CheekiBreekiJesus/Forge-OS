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
import type { CreateProductInput, Product, UpdateProductInput } from "@/domain/product-types";
import type {
  ActivityEvent,
  Campaign,
  CreateActivityEventInput,
  CreateLeadInput,
  CreateQuoteInput,
  Customer,
  Lead,
  Opportunity,
  OutreachMessage,
  ProductionOrder,
  Quote,
  UpdateLeadInput
} from "@/domain/types";

export interface LeadRepository {
  list(tenantId: string): Promise<Lead[]>;
  getById(tenantId: string, leadId: string): Promise<Lead | null>;
  getByEmail(tenantId: string, email: string): Promise<Lead | null>;
  create(tenantId: string, input: CreateLeadInput): Promise<Lead>;
  createMany(tenantId: string, inputs: CreateLeadInput[]): Promise<Lead[]>;
  update(tenantId: string, leadId: string, input: UpdateLeadInput): Promise<Lead>;
}

export interface CustomerRepository {
  list(tenantId: string): Promise<Customer[]>;
  getById(tenantId: string, customerId: string): Promise<Customer | null>;
  getByLeadId(tenantId: string, leadId: string): Promise<Customer | null>;
  createFromLead(tenantId: string, leadId: string): Promise<Customer>;
}

export interface OpportunityRepository {
  list(tenantId: string): Promise<Opportunity[]>;
  getById(tenantId: string, opportunityId: string): Promise<Opportunity | null>;
  getByLeadId(tenantId: string, leadId: string): Promise<Opportunity | null>;
  createFromLead(tenantId: string, leadId: string, customerId?: string): Promise<Opportunity>;
}

export interface QuoteRepository {
  list(tenantId: string): Promise<Quote[]>;
  getById(tenantId: string, quoteId: string): Promise<Quote | null>;
  getByLeadId(tenantId: string, leadId: string): Promise<Quote | null>;
  create(tenantId: string, input: CreateQuoteInput): Promise<Quote>;
  updateStatus(
    tenantId: string,
    quoteId: string,
    status: Quote["status"]
  ): Promise<Quote>;
}

export interface ProductionOrderRepository {
  list(tenantId: string): Promise<ProductionOrder[]>;
  getById(tenantId: string, orderId: string): Promise<ProductionOrder | null>;
  getByQuoteId(tenantId: string, quoteId: string): Promise<ProductionOrder | null>;
  createFromQuote(tenantId: string, quoteId: string): Promise<ProductionOrder>;
  update(
    tenantId: string,
    orderId: string,
    input: Partial<Pick<ProductionOrder, "machineId" | "machineName" | "status" | "progress" | "artworkStatus" | "screenStatus" | "operatorNotes">>
  ): Promise<ProductionOrder>;
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
  list(tenantId: string): Promise<Product[]>;
  getById(tenantId: string, id: string): Promise<Product | null>;
  getBySku(tenantId: string, sku: string): Promise<Product | null>;
  create(tenantId: string, input: CreateProductInput): Promise<Product>;
  update(tenantId: string, id: string, input: UpdateProductInput): Promise<Product>;
  createMany(tenantId: string, inputs: CreateProductInput[]): Promise<Product[]>;
  listEmailPromotable(tenantId: string): Promise<Product[]>;
}

export interface CampaignRepository {
  list(tenantId: string): Promise<Campaign[]>;
  getById(tenantId: string, campaignId: string): Promise<Campaign | null>;
}

export interface ActivityRepository {
  list(tenantId: string): Promise<ActivityEvent[]>;
  append(tenantId: string, event: CreateActivityEventInput): Promise<ActivityEvent>;
}

export interface MetaRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface LocalRepositoryBundle {
  leads: LeadRepository;
  customers: CustomerRepository;
  opportunities: OpportunityRepository;
  quotes: QuoteRepository;
  productionOrders: ProductionOrderRepository;
  outreachMessages: OutreachMessageRepository;
  campaigns: CampaignRepository;
  activities: ActivityRepository;
  meta: MetaRepository;
  companyProfiles: CompanyProfileRepository;
  userProfiles: UserProfileRepository;
  senderIdentities: SenderIdentityRepository;
  localAssets: LocalAssetRepository;
  products: ProductRepository;
  reset(): Promise<void>;
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
  | "missing_link";

export class PersistenceError extends Error {
  constructor(
    public readonly code: PersistenceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}
