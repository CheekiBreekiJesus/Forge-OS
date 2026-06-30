export type IntegrationStatus =
  | "configured"
  | "not-configured"
  | "local-only"
  | "hosted-feature"
  | "unavailable";

export type IntegrationCard = {
  id: string;
  name: string;
  status: IntegrationStatus;
  description: string;
  detail: string;
};

function hasEnv(key: string): boolean {
  const value = process.env[key];
  return Boolean(value && value.trim() && !value.includes("replace-with"));
}

export function getIntegrationCards(): IntegrationCard[] {
  const abacusConfigured = hasEnv("ABACUS_API_KEY");
  const smartleadConfigured =
    hasEnv("SMARTLEAD_API_KEY") &&
    hasEnv("SMARTLEAD_API_BASE_URL") &&
    hasEnv("SMARTLEAD_DEFAULT_CAMPAIGN_ID");
  const supabaseConfigured =
    hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const outreachProvider = process.env.AI_OUTREACH_PROVIDER ?? "abacus";
  const deliveryProvider = process.env.OUTREACH_DELIVERY_PROVIDER ?? "simulation";

  return [
    {
      description: "AI email generation for Outreach.",
      detail: abacusConfigured
        ? `Provider active: ${outreachProvider}`
        : "Set ABACUS_API_KEY in .env.local for live generation.",
      id: "abacus",
      name: "Abacus.AI",
      status: abacusConfigured ? "configured" : "not-configured"
    },
    {
      description: "Campaign email delivery.",
      detail:
        deliveryProvider === "simulation"
          ? "Simulation mode — no live sends."
          : smartleadConfigured
            ? "Smartlead credentials detected."
            : "Smartlead selected but credentials incomplete.",
      id: "smartlead",
      name: "Smartlead",
      status:
        deliveryProvider === "simulation"
          ? "local-only"
          : smartleadConfigured
            ? "configured"
            : "not-configured"
    },
    {
      description: "PostgreSQL persistence and authentication.",
      detail: supabaseConfigured
        ? "Supabase URL and anon key configured."
        : "Not connected — local IndexedDB MVP active.",
      id: "supabase",
      name: "Supabase",
      status: supabaseConfigured ? "configured" : "local-only"
    },
    {
      description: "Google OAuth sign-in for hosted deployment.",
      detail: "Requires Supabase Auth + Google OAuth configuration.",
      id: "google",
      name: "Google",
      status: "hosted-feature"
    },
    {
      description: "Microsoft OAuth sign-in for hosted deployment.",
      detail: "Requires Supabase Auth + Microsoft OAuth configuration.",
      id: "microsoft",
      name: "Microsoft",
      status: "hosted-feature"
    },
    {
      description: "Local LLM inference.",
      detail: hasEnv("OLLAMA_BASE_URL")
        ? `Endpoint: ${process.env.OLLAMA_BASE_URL}`
        : "Optional local provider — not required for Outreach MVP.",
      id: "ollama",
      name: "Ollama",
      status: hasEnv("OLLAMA_BASE_URL") ? "configured" : "not-configured"
    },
    {
      description: "In-app cup configuration, preview, and estimate pricing.",
      detail: "ForgeOS Cup Customizer package active in local IndexedDB MVP.",
      id: "cup-customizer",
      name: "Cup Customizer",
      status: "configured"
    },
    {
      description: "Browser IndexedDB persistence for tenant data.",
      detail: "Local database active — export backups from Settings.",
      id: "local-db",
      name: "Local database",
      status: "local-only"
    }
  ];
}

export function getClientIntegrationCards(): IntegrationCard[] {
  return [
    {
      description: "AI email generation for Outreach.",
      detail: "Configured server-side. Use Settings → Integrations → Run diagnostic.",
      id: "abacus",
      name: "Abacus.AI",
      status: "configured"
    },
    {
      description: "Campaign email delivery.",
      detail: "Simulation mode active in local MVP. Enable Smartlead live in hosted deployment.",
      id: "smartlead",
      name: "Smartlead",
      status: "local-only"
    },
    {
      description: "PostgreSQL persistence and authentication.",
      detail: "Not connected — local IndexedDB MVP active. Sync requires hosted Supabase.",
      id: "supabase",
      name: "Supabase",
      status: "local-only"
    },
    {
      description: "Google OAuth sign-in for hosted deployment.",
      detail: "Requires Supabase Auth + Google OAuth configuration.",
      id: "google",
      name: "Google",
      status: "hosted-feature"
    },
    {
      description: "Microsoft OAuth sign-in for hosted deployment.",
      detail: "Requires Supabase Auth + Microsoft OAuth configuration.",
      id: "microsoft",
      name: "Microsoft",
      status: "hosted-feature"
    },
    {
      description: "Hosted object storage for logos, artwork, and mockups.",
      detail: "Local blob storage active. S3/Supabase Storage available in hosted deployment.",
      id: "hosted-storage",
      name: "Hosted storage",
      status: "hosted-feature"
    },
    {
      description: "Local LLM inference.",
      detail: "Optional — configure OLLAMA_BASE_URL for local models.",
      id: "ollama",
      name: "Ollama",
      status: "not-configured"
    },
    {
      description: "In-app cup configuration, preview, and estimate pricing.",
      detail: "Package @cup-customizer wired to quotations workflow.",
      id: "cup-customizer",
      name: "Cup Customizer",
      status: "configured"
    },
    {
      description: "Browser IndexedDB persistence for tenant data.",
      detail: "Dexie schema v4 with customizer simulations table.",
      id: "local-db",
      name: "Local database",
      status: "local-only"
    }
  ];
}
