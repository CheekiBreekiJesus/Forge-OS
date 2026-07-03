import type { ActivityAction } from "@/domain/types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export type OutlookAuditMetadata = Record<string, string | number | boolean | null>;

export async function appendOutlookAuditEvent(
  repos: LocalRepositoryBundle,
  tenantId: string,
  action: ActivityAction,
  entityId: string,
  title: string,
  metadata: OutlookAuditMetadata
): Promise<void> {
  const sanitized = Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !isSensitiveAuditKey(key))
      .map(([key, value]) => [key, value ?? ""])
  ) as Record<string, string | number | boolean>;
  await repos.activities.append(tenantId, {
    action,
    entityId,
    entityType: "campaign",
    metadata: sanitized,
    title
  });
}

function isSensitiveAuditKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes("token") ||
    lower.includes("body") ||
    lower.includes("subject") ||
    lower.includes("authorization") ||
    lower.includes("verifier") ||
    lower.includes("secret") ||
    lower.includes("key")
  );
}
