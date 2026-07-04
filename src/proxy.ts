import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getForgeOSPersistenceMode,
  localeFromPathname,
  loginRedirectPath,
  membershipAccessPath,
  resolveMembershipAccessForUser,
  selectedTenantCookieOptions,
  SELECTED_TENANT_COOKIE
} from "@/lib/auth/membership";
import { isPublicRoute, requiresActiveMembership } from "@/lib/auth/routes";
import { sanitizeInternalRedirect } from "@/lib/auth/safe-redirect";
import { isSupabaseAuthConfigured, readSupabaseAnonKey, readSupabaseUrl } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  if (getForgeOSPersistenceMode() !== "supabase") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  if (!isSupabaseAuthConfigured()) {
    return isPublicRoute(pathname)
      ? response
      : redirectToLogin(request, pathname, "supabase_not_configured");
  }

  const supabase = createServerClient(readSupabaseUrl(), readSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (!requiresActiveMembership(pathname)) {
    return response;
  }

  const locale = localeFromPathname(pathname);
  const safeNext = sanitizeInternalRedirect(`${pathname}${request.nextUrl.search}`, `/${locale}`);

  if (error || !user) {
    return NextResponse.redirect(new URL(loginRedirectPath(locale, safeNext), request.url));
  }

  try {
    const selectedTenantId = request.cookies.get(SELECTED_TENANT_COOKIE)?.value ?? null;
    const access = await resolveMembershipAccessForUser(user, selectedTenantId);

    if (access.status !== "active") {
      return NextResponse.redirect(new URL(membershipAccessPath(locale, access.status, safeNext), request.url));
    }

    response.cookies.set(
      SELECTED_TENANT_COOKIE,
      access.context.tenantId,
      selectedTenantCookieOptions()
    );
    return response;
  } catch {
    return redirectToLogin(request, pathname, "supabase_not_configured");
  }
}

function redirectToLogin(request: NextRequest, pathname: string, error: "supabase_not_configured") {
  const locale = localeFromPathname(pathname);
  const safeNext = sanitizeInternalRedirect(`${pathname}${request.nextUrl.search}`, `/${locale}`);
  const loginPath = loginRedirectPath(locale, safeNext);
  const separator = loginPath.includes("?") ? "&" : "?";
  return NextResponse.redirect(new URL(`${loginPath}${separator}error=${error}`, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml|json|woff|woff2)$).*)"]
};
