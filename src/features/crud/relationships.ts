import type { Machine } from "@/domain/operations-types";
import type { Product } from "@/domain/product-types";
import type { Customer, Lead, ProductionOrder, Quote } from "@/domain/types";
import { isActiveRecord } from "@/persistence/archive-utils";

export type RelationshipWarning = {
  code: string;
  message: string;
};

export function warnMissingLead(lead: Lead | null | undefined): RelationshipWarning | null {
  if (!lead) return { code: "missing_lead", message: "Lead record not found." };
  return null;
}

export function warnMissingCustomer(
  customer: Customer | null | undefined
): RelationshipWarning | null {
  if (!customer) return { code: "missing_customer", message: "Customer record not found." };
  if (!isActiveRecord(customer))
    return { code: "archived_customer", message: "Customer is archived." };
  return null;
}

export function warnMissingQuote(quote: Quote | null | undefined): RelationshipWarning | null {
  if (!quote) return { code: "missing_quote", message: "Quotation not found." };
  if (!isActiveRecord(quote))
    return { code: "archived_quote", message: "Quotation is archived." };
  return null;
}

export function warnQuoteForProduction(quote: Quote | null | undefined): RelationshipWarning | null {
  const base = warnMissingQuote(quote);
  if (base) return base;
  if (quote!.status !== "approved") {
    return {
      code: "quote_not_approved",
      message: "Production orders require an approved quotation."
    };
  }
  return null;
}

export function warnMachineAssignment(
  machine: Machine | null | undefined,
  product: Product | null | undefined
): RelationshipWarning | null {
  if (!machine) return { code: "missing_machine", message: "Machine not found." };
  if (!isActiveRecord(machine))
    return { code: "archived_machine", message: "Archived machines cannot be assigned." };
  if (machine.status === "retired" || machine.status === "offline") {
    return { code: "machine_unavailable", message: "Machine is not available for assignment." };
  }
  if (product && machine.supportedProductIds.length > 0) {
    if (!machine.supportedProductIds.includes(product.id)) {
      return {
        code: "machine_incompatible",
        message: "Machine does not support this product."
      };
    }
  }
  return null;
}

export function warnProductionOrder(
  order: ProductionOrder | null | undefined
): RelationshipWarning | null {
  if (!order) return { code: "missing_production_order", message: "Production order not found." };
  if (!isActiveRecord(order))
    return { code: "archived_production_order", message: "Production order is archived." };
  return null;
}

export function resolveCustomerName(
  customer: Customer | null | undefined,
  fallback = "—"
): string {
  if (!customer) return fallback;
  return customer.tradingName || customer.companyName || customer.legalName || fallback;
}
