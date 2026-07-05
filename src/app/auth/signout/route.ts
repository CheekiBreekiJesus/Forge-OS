import { NextResponse } from "next/server";
import { loginPathForRedirect, sanitizeAuthRedirect } from "@/lib/auth/safe-redirect";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const requestedDestination = sanitizeAuthRedirect(url.searchParams.get("next"), "/pt-PT");

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.redirect(new URL(loginPathForRedirect(requestedDestination), url.origin));
  }

  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(loginPathForRedirect(requestedDestination), url.origin));
}
