import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import {
  isOutlookLiveSendAllowed,
  isOutlookTestRecipientAllowed,
  readOutlookGraphConfig
} from "@/features/outlook-graph/config";

type TestSendBody = {
  confirmation?: string;
  campaignId?: string;
  recipientId?: string;
  approvedDraftVersion?: string;
  recipientEmail?: string;
  subject?: string;
  renderedBody?: string;
  bodyContentType?: "HTML" | "Text";
  locale?: string;
  senderSnapshot?: Record<string, string | null>;
};

export async function POST(request: Request) {
  const config = readOutlookGraphConfig();
  const body = (await request.json().catch(() => ({}))) as TestSendBody;

  if (body.confirmation !== "SEND OUTLOOK TEST") {
    return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
  }
  if (!isOutlookLiveSendAllowed(config)) {
    return NextResponse.json(
      { error: "Live send disabled.", liveSendDisabledLabel: "Envio real desativado" },
      { status: 403 }
    );
  }
  if (!body.recipientEmail || !isOutlookTestRecipientAllowed(config, body.recipientEmail)) {
    return NextResponse.json({ error: "Recipient not in test allowlist." }, { status: 403 });
  }
  if (!body.campaignId || !body.recipientId || !body.approvedDraftVersion) {
    return NextResponse.json({ error: "Missing approved send payload." }, { status: 400 });
  }
  if (!body.subject?.trim() || !body.renderedBody?.trim()) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }

  const provider = createOutlookGraphEmailProvider(config);
  const attemptId = randomUUID();
  const result = await provider.sendApprovedMessage({
    attemptId,
    campaignId: body.campaignId,
    recipientId: body.recipientId,
    approvedDraftVersion: body.approvedDraftVersion,
    senderSnapshot: body.senderSnapshot ?? {},
    recipientEmail: body.recipientEmail.trim().toLowerCase(),
    subject: body.subject,
    renderedBody: body.renderedBody,
    bodyContentType: body.bodyContentType ?? "HTML",
    locale: body.locale ?? "pt-PT"
  });

  const status =
    result.classification === "accepted"
      ? 202
      : result.classification === "blocked"
        ? 403
        : result.classification === "reconnect_required"
          ? 401
          : 502;

  return NextResponse.json(
    {
      attemptId,
      result,
      acceptedByGraph: result.classification === "accepted",
      deliveryNote:
        result.classification === "accepted"
          ? "HTTP 202 means accepted by Microsoft Graph, not confirmed delivery."
          : null
    },
    { status }
  );
}
