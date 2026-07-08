import { NextResponse } from "next/server";
import { createDurableProviderEvent } from "@/features/email-delivery/durable-outreach-store";
import {
  normalizeBrevoWebhookPayload,
  type BrevoWebhookPayload
} from "@/features/email-delivery/provider-events";

const MAX_WEBHOOK_BYTES = 64 * 1024;

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook payload too large." }, { status: 413 });
  }

  const payload = parseJson(text);
  if (!payload) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const event = normalizeBrevoWebhookPayload(payload);
  if (!event) {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }

  const tenantId = resolveTenantId(payload);
  if (!tenantId) {
    return NextResponse.json({ error: "Webhook tenant mapping unavailable." }, { status: 202 });
  }

  const stored = await createDurableProviderEvent(tenantId, event);
  if (!stored.ok) {
    return NextResponse.json({ error: "Durable event store unavailable." }, { status: 503 });
  }

  return NextResponse.json({ accepted: true });
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.BREVO_WEBHOOK_SECRET?.trim() ?? "";
  if (secret.length < 24) return false;

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization === `Bearer ${secret}`) return true;

  if (authorization.toLowerCase().startsWith("basic ")) {
    const encoded = authorization.slice("basic ".length);
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const [, password = ""] = decoded.split(":");
    return password === secret;
  }

  return request.headers.get("x-forgeos-webhook-secret") === secret;
}

function parseJson(text: string): BrevoWebhookPayload | null {
  try {
    const payload = JSON.parse(text);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function resolveTenantId(payload: BrevoWebhookPayload): string | null {
  const configured = process.env.OUTREACH_WEBHOOK_TENANT_ID?.trim();
  if (configured) return configured;

  const tags = Array.isArray(payload.tags) ? payload.tags : [];
  const tenantTag = tags.find((tag): tag is string => typeof tag === "string" && tag.startsWith("tenant:"));
  return tenantTag?.slice("tenant:".length) || null;
}
