import type { ActivityAction, ActivityEntityType } from "@/domain/types";
import type { ActivityRepository } from "@/persistence/interfaces";

export type RecordActivityInput = {
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  title: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordActivity(
  activities: ActivityRepository,
  tenantId: string,
  input: RecordActivityInput
): Promise<void> {
  await activities.append(tenantId, {
    action: input.action,
    entityId: input.entityId,
    entityType: input.entityType,
    metadata: sanitizeMetadata(input.metadata) as Record<string, string | number | boolean>,
    title: input.title
  });
}

function sanitizeMetadata(
  metadata?: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> {
  if (!metadata) return {};
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (/key|token|password|secret|authorization/i.test(key)) continue;
    if (typeof value === "string" && /sk-|Bearer\s/i.test(value)) continue;
    safe[key] = value;
  }
  return safe;
}
