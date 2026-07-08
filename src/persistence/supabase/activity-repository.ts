import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateActivityEventInput, ActivityEvent } from "@/domain/types";
import { PersistenceError, type ActivityRepository } from "@/persistence/interfaces";
import { mapActivityInputToRow, mapActivityRow } from "./mappers";

export function createSupabaseActivityRepository(client: SupabaseClient): ActivityRepository {
  return {
    async list(tenantId) {
      const { data, error } = await client
        .from("activity_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("occurred_at", { ascending: false });
      if (error) throw new PersistenceError("unavailable", error.message);
      return (data ?? []).map((row) => mapActivityRow(row));
    },
    async listForEntity(tenantId, entityType, entityId) {
      const { data, error } = await client
        .from("activity_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("occurred_at", { ascending: false });
      if (error) throw new PersistenceError("unavailable", error.message);
      return (data ?? []).map((row) => mapActivityRow(row));
    },
    async append(tenantId, event: CreateActivityEventInput): Promise<ActivityEvent> {
      const { data, error } = await client
        .from("activity_events")
        .insert(mapActivityInputToRow(tenantId, event))
        .select("*")
        .single();
      if (error) throw new PersistenceError("unavailable", error.message);
      return mapActivityRow(data);
    }
  };
}
