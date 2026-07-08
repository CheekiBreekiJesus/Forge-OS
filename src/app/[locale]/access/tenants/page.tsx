import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AuthAccessShell } from "@/components/auth-access-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import {
  membershipAccessPath,
  resolveMembershipAccessForUser,
  selectedTenantCookieOptions,
  SELECTED_TENANT_COOKIE
} from "@/lib/auth/membership";
import { sanitizeAuthRedirect } from "@/lib/auth/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function TenantSelectionPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next = `/${locale}` } = await searchParams;
  if (!isSupportedLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(sanitizeAuthRedirect(next, `/${locale}`))}`);
  }

  const access = await resolveMembershipAccessForUser(user);
  if (access.status !== "multiple_active") {
    if (access.status === "active") {
      redirect(sanitizeAuthRedirect(next, `/${locale}`));
    }
    redirect(membershipAccessPath(locale, access.status, next));
  }

  async function selectTenant(formData: FormData) {
    "use server";

    const selectedTenantId = String(formData.get("tenantId") ?? "");
    const nextPath = sanitizeAuthRedirect(String(formData.get("next") ?? `/${locale}`), `/${locale}`);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
    }

    const access = await resolveMembershipAccessForUser(user, selectedTenantId);
    if (access.status !== "active") {
      redirect(membershipAccessPath(locale as Locale, access.status, nextPath));
    }

    const cookieStore = await cookies();
    cookieStore.set(SELECTED_TENANT_COOKIE, access.context.tenantId, selectedTenantCookieOptions());
    redirect(nextPath);
  }

  return (
    <AuthAccessShell
      action={
        <form action={selectTenant} className="space-y-3">
          <input name="next" type="hidden" value={sanitizeAuthRedirect(next, `/${locale}`)} />
          {access.memberships.map((membership) => (
            <button
              className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm hover:bg-slate-800"
              key={membership.tenantId}
              name="tenantId"
              type="submit"
              value={membership.tenantId}
            >
              <span>
                <span className="block font-semibold">{membership.tenantName}</span>
                <span className="block text-xs text-slate-400">
                  {membership.roles.join(", ")}
                </span>
              </span>
              <span className="text-xs text-orange-300">{dictionary.authAccess.tenants.select}</span>
            </button>
          ))}
        </form>
      }
      body={dictionary.authAccess.tenants.body}
      locale={locale}
      signOutLabel={dictionary.authAccess.signOut}
      title={dictionary.authAccess.tenants.title}
    />
  );
}
