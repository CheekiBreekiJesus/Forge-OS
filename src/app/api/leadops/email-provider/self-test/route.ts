import { NextResponse } from "next/server";
import type { EmailDeliverySelfTestInput } from "@/domain/email-delivery-types";
import { sendEmailDeliverySelfTest } from "@/application/email-delivery-self-test-service";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = parsePayload(payload);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid email delivery self-test request." }, { status: 400 });
  }

  const result = await sendEmailDeliverySelfTest(parsed);
  const status =
    result.status === "failed"
      ? 502
      : result.status === "blocked"
        ? 403
        : 200;

  return NextResponse.json(result, { status });
}

function parsePayload(payload: unknown): EmailDeliverySelfTestInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Partial<EmailDeliverySelfTestInput>;
  if (typeof value.recipientEmail !== "string") return null;
  if (typeof value.subject !== "string") return null;
  if (typeof value.messageBody !== "string") return null;
  if (typeof value.confirmation !== "string" || value.confirmation !== "SEND SELF TEST") return null;

  return {
    confirmation: value.confirmation,
    initiatedBy: typeof value.initiatedBy === "string" ? value.initiatedBy : undefined,
    messageBody: value.messageBody,
    recipientEmail: value.recipientEmail,
    subject: value.subject
  };
}
