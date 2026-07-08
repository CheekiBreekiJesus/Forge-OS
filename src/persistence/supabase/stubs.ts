import { PersistenceError, type LocalRepositoryBundle } from "@/persistence/interfaces";

function unavailable(method: string): never {
  throw new PersistenceError(
    "unavailable",
    `Supabase adapter for ${method} is not implemented in the outreach slice.`
  );
}

function stubRepo(methods: string[]): Record<string, () => never> {
  return Object.fromEntries(methods.map((method) => [method, () => unavailable(method)]));
}

export function createSupabaseStubRepositories(): Pick<
  LocalRepositoryBundle,
  | "leads"
  | "customers"
  | "customerContacts"
  | "opportunities"
  | "quotes"
  | "productionOrders"
  | "machines"
  | "inventory"
  | "outreachMessages"
  | "meta"
  | "companyProfiles"
  | "userProfiles"
  | "senderIdentities"
  | "localAssets"
  | "products"
  | "customizerSimulations"
  | "importBatches"
  | "importRows"
  | "importMappingProfiles"
  | "leadContacts"
  | "emailSuppressions"
  | "outreachProviderEvents"
  | "outreachSendJobs"
  | "outreachSendJobRecipients"
  | "outreachSendJobAttempts"
  | "outreachSendJobDailyUsage"
> {
  return {
    leads: stubRepo(["list", "getById", "getByEmail", "create", "createMany", "update", "duplicate", "archive", "restore"]),
    customers: stubRepo(["list", "getById", "getByLeadId", "create", "createFromLead", "update", "archive", "restore"]),
    customerContacts: stubRepo(["listForCustomer", "create", "update", "archive", "restore"]),
    opportunities: stubRepo(["list", "getById", "getByLeadId", "getByCustomerId", "createFromLead"]),
    quotes: stubRepo(["list", "getById", "getByLeadId", "getByCustomerId", "create", "update", "duplicate", "updateStatus", "approve", "reject", "archive", "restore"]),
    productionOrders: stubRepo(["list", "getById", "getByQuoteId", "getByMachineId", "createFromQuote", "create", "update", "assignMachine", "archive", "restore"]),
    machines: stubRepo(["list", "getById", "getByCode", "create", "update", "duplicate", "archive", "restore", "listForProduct"]),
    inventory: stubRepo(["list", "getById", "create", "update", "archive", "restore", "recordReceipt", "recordConsumption", "adjustStock", "listMovements"]),
    outreachMessages: stubRepo(["listForLead", "listAll", "getForLead", "saveDraft", "countBySenderIdentity"]),
    meta: stubRepo(["get", "set", "delete"]),
    companyProfiles: stubRepo(["getForTenant", "getById", "create", "update", "ensureDefault"]),
    userProfiles: stubRepo(["list", "getById", "getCurrent", "create", "update", "ensureDefault"]),
    senderIdentities: stubRepo(["list", "listAll", "getById", "getDefault", "create", "update", "duplicate", "archive", "setDefault", "ensureDefault"]),
    localAssets: stubRepo(["list", "getById", "create", "delete"]),
    products: stubRepo(["list", "getById", "getBySku", "create", "update", "duplicate", "archive", "restore", "createMany", "listEmailPromotable"]),
    customizerSimulations: stubRepo(["list", "getById", "create", "update", "duplicate", "archive", "restore"]),
    importBatches: stubRepo(["list", "getById", "create", "update", "archive"]),
    importRows: stubRepo(["listForBatch", "createMany", "update"]),
    importMappingProfiles: stubRepo(["list", "getById", "create", "update", "archive", "restore"]),
    leadContacts: stubRepo(["listForLead", "create", "update", "archive", "restore"]),
    emailSuppressions: stubRepo(["list", "getByEmail", "create", "remove"]),
    outreachProviderEvents: stubRepo(["listForTenant", "listRecent", "getByFingerprint", "create"]),
    outreachSendJobs: stubRepo(["list", "getById", "create", "update", "listActive"]),
    outreachSendJobRecipients: stubRepo(["listForJob", "getById", "createMany", "update", "listQueued"]),
    outreachSendJobAttempts: stubRepo(["listForJob", "create"]),
    outreachSendJobDailyUsage: stubRepo(["getForDate", "increment"])
  } as unknown as Pick<
    LocalRepositoryBundle,
    | "leads"
    | "customers"
    | "customerContacts"
    | "opportunities"
    | "quotes"
    | "productionOrders"
    | "machines"
    | "inventory"
    | "outreachMessages"
    | "meta"
    | "companyProfiles"
    | "userProfiles"
    | "senderIdentities"
    | "localAssets"
    | "products"
    | "customizerSimulations"
    | "importBatches"
    | "importRows"
    | "importMappingProfiles"
    | "leadContacts"
    | "emailSuppressions"
    | "outreachProviderEvents"
    | "outreachSendJobs"
    | "outreachSendJobRecipients"
    | "outreachSendJobAttempts"
    | "outreachSendJobDailyUsage"
  >;
}
