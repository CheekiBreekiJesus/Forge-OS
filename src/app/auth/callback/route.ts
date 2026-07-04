import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  loginPathForRedirect,
  sanitizeAuthRedirect,
  type LoginErrorCode
} from "@/lib/auth/safe-redirect";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const destination = sanitizeAuthRedirect(url.searchParams.get("next"), "/pt-PT");
  const code = url.searchParams.get("code")?.trim() ?? "";

  if (!code) {
    return redirectToLogin(url, destination, "missing_code");
  }

  if (!isSupabaseAuthConfigured()) {
    return redirectToLogin(url, destination, "supabase_not_configured");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(url, destination, "oauth_exchange_failed");
  }

  return NextResponse.redirect(new URL(destination, url.origin));
}

function redirectToLogin(
  url: URL,
  destination: string,
  error: LoginErrorCode
): NextResponse {
  return NextResponse.redirect(new URL(loginPathForRedirect(destination, error), url.origin));
}
