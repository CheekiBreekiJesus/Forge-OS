/**
 * ForgeOS AI Copilot — tool-using agent (OpenAI).
 * System prompts and tool definitions always in English.
 * User-facing responses localized in route handler.
 */
export const COPILOT_TOOLS = [
  "get_stock_level",
  "list_production_orders",
  "list_maintenance_alerts",
  "list_molds_maintenance_schedule",
  "create_maintenance_order",
] as const;

export type CopilotTool = (typeof COPILOT_TOOLS)[number];
