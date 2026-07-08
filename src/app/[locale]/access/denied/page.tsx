import { notFound } from "next/navigation";
import { AuthAccessShell } from "@/components/auth-access-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { isSupportedLocale } from "@/i18n/config";

export default async function DeniedAccessPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  return (
    <AuthAccessShell
      body={dictionary.authAccess.denied.body}
      locale={locale}
      signOutLabel={dictionary.authAccess.signOut}
      title={dictionary.authAccess.denied.title}
    />
  );
}
