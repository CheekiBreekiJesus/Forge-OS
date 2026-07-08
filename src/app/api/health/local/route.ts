import { NextResponse } from "next/server";

type LocalHealthResponse = {
  status: "ok";
  version: string;
  commit: string | null;
  runtimeMode: string;
  timestamp: string;
  databaseConfigured: boolean;
  modules: {
    ai: boolean;
    outlook: boolean;
    brevo: boolean;
    supabase: boolean;
  };
};

function readRuntimeMode(): string {
  const mode = process.env.FORGEOS_RUNTIME_MODE?.trim();
  if (mode === "development" || mode === "local-production") {
    return mode;
  }
  return process.env.NODE_ENV === "development" ? "development" : "production";
}

function isDatabaseConfigured(): boolean {
  const serverName = process.env.FORGEOS_LOCAL_DB_NAME?.trim();
  const publicName = process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME?.trim();
  return Boolean(serverName || publicName);
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) return false;
  return !url.includes("your-project-ref") && !key.startsWith("replace-with");
}

export function GET(): NextResponse<LocalHealthResponse> {
  const deliveryProvider = process.env.EMAIL_DELIVERY_PROVIDER?.trim().toLowerCase() ?? "simulation";

  const body: LocalHealthResponse = {
    status: "ok",
    version: process.env.npm_package_version ?? "0.1.0",
    commit: process.env.FORGEOS_GIT_COMMIT?.trim() || null,
    runtimeMode: readRuntimeMode(),
    timestamp: new Date().toISOString(),
    databaseConfigured: isDatabaseConfigured(),
    modules: {
      ai: Boolean(process.env.AI_DEFAULT_PROVIDER?.trim()),
      outlook: false,
      brevo: deliveryProvider === "brevo",
      supabase: isSupabaseConfigured()
    }
  };

  return NextResponse.json(body);
}
