import { NextResponse } from "next/server";
import {
  getEmailTemplatesForLocale,
  getN8nWebhookQueue,
  getQuoteRequestFormModel
} from "@/demo/automation";
import { isSupportedLocale, type Locale } from "@/i18n/config";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLocale = searchParams.get("locale") ?? "pt-PT";
  const locale: Locale = isSupportedLocale(requestedLocale)
    ? requestedLocale
    : "pt-PT";

  return NextResponse.json({
    emailTemplates: getEmailTemplatesForLocale(locale),
    locale,
    quoteRequest: getQuoteRequestFormModel(),
    webhookQueue: getN8nWebhookQueue()
  });
}
