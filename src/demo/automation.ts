import {
  demoEmailTemplates,
  demoQuoteRequests,
  demoWebhookEvents,
  jhGomesTenant
} from "./seed";
import type {
  DemoEmailTemplate,
  DemoEventType,
  DemoQuoteRequest,
  DemoWebhookEvent
} from "./types";

export function getQuoteRequestFormModel(): DemoQuoteRequest {
  return demoQuoteRequests[0];
}

export function getEmailTemplatesForLocale(locale: "pt-PT" | "en") {
  return demoEmailTemplates.filter((template) => template.locale === locale);
}

export function getN8nWebhookQueue(): DemoWebhookEvent[] {
  return demoWebhookEvents;
}

export function createWebhookEvent({
  eventType,
  payload
}: {
  eventType: DemoEventType;
  payload: DemoWebhookEvent["payload"];
}): DemoWebhookEvent {
  return {
    id: `webhook_demo_${eventType}`,
    tenantId: jhGomesTenant.id,
    eventType,
    destination: "n8n",
    status: "queued",
    payload,
    createdAt: "2026-06-15T12:00:00.000Z"
  };
}

export function renderEmailTemplate({
  data,
  template
}: {
  data: Record<string, string | number>;
  template: DemoEmailTemplate;
}) {
  return {
    body: replaceTokens(template.body, data),
    subject: replaceTokens(template.subject, data)
  };
}

function replaceTokens(template: string, data: Record<string, string | number>) {
  return Object.entries(data).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}
