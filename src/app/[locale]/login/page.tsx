import { notFound } from "next/navigation";
import { LoginShell } from "@/components/login-shell";
import { jhGomesTenant } from "@/demo/seed";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <LoginShell dictionary={dictionary} locale={locale} tenantName={jhGomesTenant.name} />
  );
}
