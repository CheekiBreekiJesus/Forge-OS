import { notFound } from "next/navigation";
import { LoginShell } from "@/components/login-shell";
import { jhGomesTenant } from "@/demo/seed";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { normalizeLoginError, sanitizeAuthRedirect } from "@/lib/auth/safe-redirect";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { locale } = await params;
  const { error = null, next = null } = await searchParams;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const persistenceMode =
    process.env.FORGEOS_PERSISTENCE_MODE?.trim().toLowerCase() === "supabase" ||
    process.env.NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE?.trim().toLowerCase() === "supabase"
      ? "supabase"
      : "local";

  return (
    <LoginShell
      auth={{
        localDemoEnabled: persistenceMode !== "supabase",
        supabaseConfigured: isSupabaseAuthConfigured()
      }}
      dictionary={dictionary}
      initialError={normalizeLoginError(error)}
      initialNextPath={sanitizeAuthRedirect(next, `/${locale}`)}
      locale={locale}
      tenantName={jhGomesTenant.name}
    />
  );
}
