import { createRecordId } from "@/domain/ids";
import type {
  CreateCustomizerSimulationInput,
  CustomizerSimulation,
  UpdateCustomizerSimulationInput
} from "@/domain/customizer-types";
import type { CreateQuoteInput, Quote } from "@/domain/types";
import { recordActivity } from "@/features/crud/activity-recorder";
import {
  createArchivePatch,
  createRestorePatch,
  DEFAULT_ARCHIVABLE,
  filterByArchive,
  type ArchiveInput,
  type ListOptions
} from "@/persistence/archive-utils";
import type { ForgeOSDatabase } from "../db";
import {
  PersistenceError,
  type ActivityRepository,
  type CustomizerSimulationRepository,
  type QuoteRepository
} from "../interfaces";

function nowIso(): string {
  return new Date().toISOString();
}

export function createCustomizerSimulationRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): CustomizerSimulationRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.customizerSimulations.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async getById(tenantId, id) {
      const row = await db.customizerSimulations.get(id);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async create(tenantId, input: CreateCustomizerSimulationInput) {
      const timestamp = nowIso();
      const simulation: CustomizerSimulation = {
        ...DEFAULT_ARCHIVABLE,
        configuration: input.configuration,
        createdAt: timestamp,
        createdBy: input.createdBy ?? "local-preview",
        customerId: input.customerId ?? null,
        id: createRecordId("sim"),
        leadId: input.leadId ?? null,
        artworkAssetId: input.artworkAssetId ?? null,
        mockupAssetId: input.mockupAssetId ?? null,
        notes: input.notes?.trim() ?? "",
        pricing: input.pricing,
        productId: input.productId,
        productName: input.productName,
        quantity: input.quantity,
        quoteId: null,
        status: input.status ?? "saved",
        tenantId,
        updatedAt: timestamp
      };
      await db.customizerSimulations.put(simulation);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "customizer_simulation_created",
          entityId: simulation.id,
          entityType: "customizer_simulation",
          title: `Cup simulation saved: ${simulation.productName}`
        });
      }
      return simulation;
    },
    async update(tenantId, id, input: UpdateCustomizerSimulationInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Simulation not found.");
      const updated: CustomizerSimulation = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        quoteId: existing.quoteId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.customizerSimulations.put(updated);
      return updated;
    },
    async duplicate(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Simulation not found.");
      return this.create(tenantId, {
        artworkAssetId: existing.artworkAssetId,
        configuration: existing.configuration,
        createdBy: existing.createdBy,
        customerId: existing.customerId,
        leadId: existing.leadId,
        mockupAssetId: existing.mockupAssetId,
        notes: existing.notes,
        pricing: existing.pricing,
        productId: existing.productId,
        productName: existing.productName,
        quantity: existing.quantity,
        status: "saved"
      });
    },
    async archive(tenantId, id, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Simulation not found.");
      const updated: CustomizerSimulation = {
        ...existing,
        ...createArchivePatch(input),
        status: "archived",
        updatedAt: nowIso()
      };
      await db.customizerSimulations.put(updated);
      return updated;
    },
    async restore(tenantId, id) {
      const existing = await this.getById(tenantId, id);
      if (!existing) throw new PersistenceError("not_found", "Simulation not found.");
      const updated: CustomizerSimulation = {
        ...existing,
        ...createRestorePatch(),
        status: existing.quoteId ? "converted" : "saved",
        updatedAt: nowIso()
      };
      await db.customizerSimulations.put(updated);
      return updated;
    }
  };
}

export async function convertSimulationToQuote(
  tenantId: string,
  simulationId: string,
  simulations: CustomizerSimulationRepository,
  quotes: QuoteRepository,
  activities?: ActivityRepository
): Promise<{ simulation: CustomizerSimulation; quote: Quote }> {
  const simulation = await simulations.getById(tenantId, simulationId);
  if (!simulation) throw new PersistenceError("not_found", "Simulation not found.");
  if (simulation.quoteId) {
    const existing = await quotes.getById(tenantId, simulation.quoteId);
    if (existing) {
      return { quote: existing, simulation };
    }
  }

  const assumptionNotes = simulation.pricing.assumptions.map((a: string) => `• ${a}`).join("\n");
  const quoteInput: CreateQuoteInput = {
    customerId: simulation.customerId,
    discount: 0,
    isEstimate: simulation.pricing.isEstimate,
    leadId: simulation.leadId,
    mockupAssetId: simulation.mockupAssetId,
    notes: [
      simulation.notes,
      simulation.pricing.isEstimate ? "Estimate from Cup Customizer — requires approval." : "",
      assumptionNotes
    ]
      .filter(Boolean)
      .join("\n\n"),
    printColorCount: simulation.configuration.printColorCount,
    productId: simulation.productId,
    productName: simulation.productName,
    quantity: simulation.quantity,
    setupCost: simulation.pricing.setupCost,
    simulationId: simulation.id,
    subtotal: simulation.pricing.subtotal,
    total: simulation.pricing.total,
    unitPrice: simulation.pricing.unitPrice,
    vat: simulation.pricing.vat,
    validityDate: null
  };

  const quote = await quotes.create(tenantId, quoteInput);
  const updatedSimulation: CustomizerSimulation = {
    ...simulation,
    quoteId: quote.id,
    status: "converted",
    updatedAt: nowIso()
  };
  await simulations.update(tenantId, simulationId, {
    quoteId: quote.id,
    status: "converted"
  });

  if (activities) {
    await recordActivity(activities, tenantId, {
      action: "customizer_simulation_converted",
      entityId: simulationId,
      entityType: "customizer_simulation",
      metadata: { quoteId: quote.id },
      title: `Simulation converted to ${quote.quoteNumber}`
    });
  }

  return { quote, simulation: updatedSimulation };
}
