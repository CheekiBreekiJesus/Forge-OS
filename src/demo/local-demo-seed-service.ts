import { SCHEMA_VERSION, SEED_VERSION } from "@/domain/constants";
import type { ForgeOSDatabase } from "@/persistence/db";
import { assertLocalDemoLifecycleAllowed } from "@/features/demo/local-demo-guard";
import {
  buildLocalDemoCampaignRecipients,
  buildLocalDemoCustomers,
  buildLocalDemoCustomizerSimulations,
  buildLocalDemoOpportunities,
  buildLocalDemoOutreachMessages,
  buildLocalDemoProductionOrders,
  buildLocalDemoQuotes,
  buildLocalDemoSendJobAttempts,
  buildLocalDemoSendJobRecipients,
  buildLocalDemoSendJobs,
  buildLocalDemoSuppressions,
  getLocalDemoDatasetManifest,
  LOCAL_DEMO_MANAGED_RECORD_IDS,
  LOCAL_DEMO_META_SCHEMA_KEY,
  LOCAL_DEMO_META_SEED_KEY,
  LOCAL_DEMO_OUTREACH_MESSAGE_LEAD_IDS,
  LOCAL_DEMO_TENANT_ID
} from "@/demo/local-demo-dataset";

export type ApplyLocalDemoDatasetOptions = {
  force?: boolean;
  env?: Record<string, string | undefined>;
};

export async function isLocalDemoDatasetComplete(
  db: ForgeOSDatabase,
  tenantId: string = LOCAL_DEMO_TENANT_ID
): Promise<boolean> {
  const [
    customers,
    opportunities,
    quotes,
    productionOrders,
    recipients,
    outreachMessages,
    sendJobs,
    customizer,
    suppressions
  ] = await Promise.all([
    db.customers.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.customers]),
    db.opportunities.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.opportunities]),
    db.quotes.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.quotes]),
    db.productionOrders.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.productionOrders]),
    db.campaignRecipients.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.campaignRecipients]),
    db.outreachMessages.bulkGet([...LOCAL_DEMO_OUTREACH_MESSAGE_LEAD_IDS]),
    db.outreachSendJobs.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.outreachSendJobs]),
    db.customizerSimulations.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.customizerSimulations]),
    db.emailSuppressions.bulkGet([...LOCAL_DEMO_MANAGED_RECORD_IDS.emailSuppressions])
  ]);

  const belongsToTenant = <T extends { tenantId: string } | undefined>(rows: (T | undefined)[]) =>
    rows.every((row) => row?.tenantId === tenantId);

  return (
    belongsToTenant(customers) &&
    belongsToTenant(opportunities) &&
    belongsToTenant(quotes) &&
    belongsToTenant(productionOrders) &&
    belongsToTenant(recipients) &&
    outreachMessages.filter(Boolean).length >= 2 &&
    belongsToTenant(sendJobs) &&
    belongsToTenant(customizer) &&
    belongsToTenant(suppressions)
  );
}

async function upsertMissingRows<T extends { id: string; tenantId: string }>(
  bulkGet: (ids: string[]) => Promise<(T | undefined)[]>,
  bulkPut: (rows: T[]) => Promise<unknown>,
  rows: T[],
  tenantId: string
): Promise<void> {
  const existing = await bulkGet(rows.map((row) => row.id));
  const missing = rows.filter((row, index) => {
    const current = existing[index];
    return !current || current.tenantId !== tenantId;
  });
  if (missing.length > 0) {
    await bulkPut(missing);
  }
}

export async function applyLocalDemoDataset(
  db: ForgeOSDatabase,
  tenantId: string = LOCAL_DEMO_TENANT_ID,
  options: ApplyLocalDemoDatasetOptions = {}
): Promise<boolean> {
  assertLocalDemoLifecycleAllowed(options.env);
  const existingSeedRow = await db.meta.get(LOCAL_DEMO_META_SEED_KEY);
  const existingVersion = existingSeedRow?.value ?? null;
  const complete = await isLocalDemoDatasetComplete(db, tenantId);

  if (!options.force && existingVersion === String(SEED_VERSION) && complete) {
    return false;
  }

  const customers = buildLocalDemoCustomers(tenantId);
  const opportunities = buildLocalDemoOpportunities(tenantId);
  const quotes = buildLocalDemoQuotes(tenantId);
  const productionOrders = buildLocalDemoProductionOrders(tenantId);
  const campaignRecipients = buildLocalDemoCampaignRecipients(tenantId);
  const outreachMessages = buildLocalDemoOutreachMessages(tenantId);
  const sendJobs = buildLocalDemoSendJobs(tenantId);
  const sendJobRecipients = buildLocalDemoSendJobRecipients(tenantId);
  const sendJobAttempts = buildLocalDemoSendJobAttempts(tenantId);
  const customizerSimulations = buildLocalDemoCustomizerSimulations(tenantId);
  const suppressions = buildLocalDemoSuppressions(tenantId);

  await db.transaction(
    "rw",
    [
      db.meta,
      db.customers,
      db.opportunities,
      db.quotes,
      db.productionOrders,
      db.campaignRecipients,
      db.outreachMessages,
      db.outreachSendJobs,
      db.outreachSendJobRecipients,
      db.outreachSendJobAttempts,
      db.customizerSimulations,
      db.emailSuppressions
    ],
    async () => {
      await upsertMissingRows(
        (ids) => db.customers.bulkGet(ids),
        (rows) => db.customers.bulkPut(rows),
        customers,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.opportunities.bulkGet(ids),
        (rows) => db.opportunities.bulkPut(rows),
        opportunities,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.quotes.bulkGet(ids),
        (rows) => db.quotes.bulkPut(rows),
        quotes,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.productionOrders.bulkGet(ids),
        (rows) => db.productionOrders.bulkPut(rows),
        productionOrders,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.campaignRecipients.bulkGet(ids),
        (rows) => db.campaignRecipients.bulkPut(rows),
        campaignRecipients,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.outreachMessages.bulkGet(ids),
        (rows) => db.outreachMessages.bulkPut(rows),
        outreachMessages,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.outreachSendJobs.bulkGet(ids),
        (rows) => db.outreachSendJobs.bulkPut(rows),
        sendJobs,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.outreachSendJobRecipients.bulkGet(ids),
        (rows) => db.outreachSendJobRecipients.bulkPut(rows),
        sendJobRecipients,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.outreachSendJobAttempts.bulkGet(ids),
        (rows) => db.outreachSendJobAttempts.bulkPut(rows),
        sendJobAttempts,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.customizerSimulations.bulkGet(ids),
        (rows) => db.customizerSimulations.bulkPut(rows),
        customizerSimulations,
        tenantId
      );
      await upsertMissingRows(
        (ids) => db.emailSuppressions.bulkGet(ids),
        (rows) => db.emailSuppressions.bulkPut(rows),
        suppressions,
        tenantId
      );

      await db.meta.put({ key: LOCAL_DEMO_META_SEED_KEY, value: String(SEED_VERSION) });
      await db.meta.put({ key: LOCAL_DEMO_META_SCHEMA_KEY, value: String(SCHEMA_VERSION) });
      await db.meta.put({
        key: "demoDatasetManifest",
        value: JSON.stringify(getLocalDemoDatasetManifest())
      });
    }
  );

  return true;
}

export async function resetLocalDemoDatasetRecords(
  db: ForgeOSDatabase,
  tenantId: string = LOCAL_DEMO_TENANT_ID,
  env?: Record<string, string | undefined>
): Promise<void> {
  assertLocalDemoLifecycleAllowed(env);

  await db.transaction(
    "rw",
    [
      db.leads,
      db.customers,
      db.opportunities,
      db.quotes,
      db.productionOrders,
      db.outreachMessages,
      db.campaigns,
      db.campaignRecipients,
      db.customizerSimulations,
      db.emailSuppressions,
      db.outreachSendJobs,
      db.outreachSendJobRecipients,
      db.outreachSendJobAttempts,
      db.activities
    ],
    async () => {
      await db.outreachSendJobAttempts.bulkDelete([
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.outreachSendJobAttempts
      ]);
      await db.outreachSendJobRecipients.bulkDelete([
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.outreachSendJobRecipients
      ]);
      await db.outreachSendJobs.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.outreachSendJobs]);
      await db.emailSuppressions.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.emailSuppressions]);
      await db.customizerSimulations.bulkDelete([
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.customizerSimulations
      ]);
      await db.campaignRecipients.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.campaignRecipients]);
      await db.productionOrders.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.productionOrders]);
      await db.quotes.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.quotes]);
      await db.opportunities.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.opportunities]);
      await db.customers.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.customers]);
      await db.outreachMessages.bulkDelete([...LOCAL_DEMO_OUTREACH_MESSAGE_LEAD_IDS]);
      await db.leads.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.leads]);
      await db.campaigns.bulkDelete([...LOCAL_DEMO_MANAGED_RECORD_IDS.campaigns]);

      const managedEntityIds = new Set<string>([
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.leads,
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.campaigns,
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.customers,
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.quotes,
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.productionOrders,
        ...LOCAL_DEMO_MANAGED_RECORD_IDS.customizerSimulations
      ]);
      await db.activities
        .where("tenantId")
        .equals(tenantId)
        .filter((activity) => managedEntityIds.has(activity.entityId))
        .delete();
    }
  );
}
