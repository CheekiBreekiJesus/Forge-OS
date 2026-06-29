import {
  demoInventoryItems,
  demoLeads,
  demoMachines,
  demoProductionOrders,
  demoProducts,
  demoQuotes
} from "./seed";

export type CopilotActionKey =
  | "summarize-dashboard"
  | "find-blockers"
  | "prepare-production"
  | "inventory-risk";

export type CopilotPrompt = {
  key: CopilotActionKey;
  prompt: string;
};

export const copilotPrompts: CopilotPrompt[] = [
  {
    key: "summarize-dashboard",
    prompt: "Summarize today's operation."
  },
  {
    key: "find-blockers",
    prompt: "What is blocking production?"
  },
  {
    key: "prepare-production",
    prompt: "Prepare the next production job."
  },
  {
    key: "inventory-risk",
    prompt: "Which inventory items need attention?"
  }
];

export function answerCopilotPrompt(action: CopilotActionKey): string {
  if (action === "summarize-dashboard") {
    return `${demoLeads.length} leads, ${demoQuotes.length} quotes, and ${demoProductionOrders.length} production orders are active for the JH Gomes demo tenant.`;
  }

  if (action === "find-blockers") {
    const blocked = demoProductionOrders.filter(
      (order) => order.status === "blocked" || order.artworkStatus === "pending"
    );

    return blocked.length
      ? `${blocked.length} job needs attention: ${blocked.map((order) => order.id).join(", ")}.`
      : "No production blockers are present in the demo data.";
  }

  if (action === "prepare-production") {
    const nextOrder = demoProductionOrders[0];
    const product = demoProducts.find((item) => item.id === nextOrder.productId);
    const machine = demoMachines.find((item) => item.id === nextOrder.machineId);

    return `Prepare ${nextOrder.quantity} units of ${product?.name ?? "the selected product"} on ${machine?.name ?? "the assigned machine"}.`;
  }

  const riskyItems = demoInventoryItems.filter(
    (item) => item.quantityOnHand - item.reservedQuantity <= item.reorderPoint
  );

  return riskyItems.length
    ? `${riskyItems.length} inventory items are below available threshold: ${riskyItems.map((item) => item.name).join(", ")}.`
    : "No inventory risks are present in the demo data.";
}
