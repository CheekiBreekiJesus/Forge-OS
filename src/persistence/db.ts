import Dexie, { type Table } from "dexie";
import { LOCAL_DB_NAME } from "@/domain/constants";
import type {
  ActivityEvent,
  Campaign,
  Customer,
  Lead,
  Opportunity,
  OutreachMessage,
  ProductionOrder,
  Quote
} from "@/domain/types";

export type MetaRecord = {
  key: string;
  value: string;
};

export class ForgeOSDatabase extends Dexie {
  meta!: Table<MetaRecord, string>;
  leads!: Table<Lead, string>;
  customers!: Table<Customer, string>;
  opportunities!: Table<Opportunity, string>;
  quotes!: Table<Quote, string>;
  productionOrders!: Table<ProductionOrder, string>;
  outreachMessages!: Table<OutreachMessage, string>;
  campaigns!: Table<Campaign, string>;
  activities!: Table<ActivityEvent, string>;

  constructor(name: string = LOCAL_DB_NAME) {
    super(name);

    this.version(1).stores({
      meta: "key",
      leads: "id, tenantId, email, crmStatus, outreachStatus, [tenantId+email]",
      customers: "id, tenantId, leadId, [tenantId+leadId]",
      opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
      quotes: "id, tenantId, quoteNumber, leadId, customerId, status, [tenantId+leadId]",
      productionOrders: "id, tenantId, orderNumber, quoteId, status, [tenantId+quoteId]",
      outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
      campaigns: "id, tenantId",
      activities: "id, tenantId, occurredAt, action, [tenantId+occurredAt]"
    });
  }
}

let dbInstance: ForgeOSDatabase | null = null;

export function getDatabase(name?: string): ForgeOSDatabase {
  if (!dbInstance || (name && name !== dbInstance.name)) {
    dbInstance = new ForgeOSDatabase(name);
  }
  return dbInstance;
}

export function resetDatabaseInstance(): void {
  dbInstance = null;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export async function deleteDatabase(name: string = LOCAL_DB_NAME): Promise<void> {
  await closeDatabase();
  await Dexie.delete(name);
}
