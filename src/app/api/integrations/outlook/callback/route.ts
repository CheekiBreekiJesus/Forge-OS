import { NextResponse } from "next/server";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import { readOutlookGraphConfig } from "@/features/outlook-graph/config";

export async function GET(request: Request) {
  const config = readOutlookGraphConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    const appBase = process.env.FORGEOS_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const redirect = new URL("/pt-PT/settings/integrations/outlook", appBase);
    redirect.searchParams.set("outlook", "error");
    return NextResponse.redirect(redirect);
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing OAuth callback parameters." }, { status: 400 });
  }

  try {
    const provider = createOutlookGraphEmailProvider(config);
    await provider.completeConnect(code, state);
    const appBase = process.env.FORGEOS_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const redirect = new URL("/pt-PT/settings/integrations/outlook", appBase);
    redirect.searchParams.set("outlook", "connected");
    return NextResponse.redirect(redirect);
  } catch {
    const appBase = process.env.FORGEOS_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const redirect = new URL("/pt-PT/settings/integrations/outlook", appBase);
    redirect.searchParams.set("outlook", "invalid_state");
    return NextResponse.redirect(redirect);
  }
}
