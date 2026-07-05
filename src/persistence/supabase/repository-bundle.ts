import type { LocalRepositoryBundle } from "../interfaces";
import { isSupabasePersistenceConfigured } from "../mode";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { createSupabaseActivityRepository } from "./activity-repository";
import {
  createSupabaseCampaignRecipientRepository,
  createSupabaseOutreachCampaignRepository,
  createSupabaseOutreachSendAttemptRepository
} from "./outreach-repositories";
import { createSupabaseStubRepositories } from "./stubs";

/**
 * Minimal Supabase repository bundle for the server-owned outreach send vertical slice.
 */
export function createSupabaseRepositoryBundle(): LocalRepositoryBundle {
  if (!isSupabasePersistenceConfigured()) {
    throw new Error("Supabase persistence is not configured.");
  }

  const client = createSupabaseServiceClient();
  const stubs = createSupabaseStubRepositories();

  return {
    ...stubs,
    campaigns: createSupabaseOutreachCampaignRepository(client),
    campaignRecipients: createSupabaseCampaignRecipientRepository(client),
    outreachSendAttempts: createSupabaseOutreachSendAttemptRepository(client),
    activities: createSupabaseActivityRepository(client),
    async reset() {
      throw new Error("Supabase reset is not supported from application code.");
    },
    async resetDemoData() {
      throw new Error("Supabase resetDemoData is not supported from application code.");
    },
    async restoreDeterministicDemoState() {
      throw new Error("Supabase restoreDeterministicDemoState is not supported from application code.");
    },
    async seed() {
      throw new Error("Supabase seed is not supported from application code.");
    }
  };
}
