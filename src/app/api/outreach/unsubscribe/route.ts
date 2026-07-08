import { NextResponse } from "next/server";
import { createDurableSuppressionFromTokenClaims } from "@/features/email-delivery/durable-outreach-store";
import { verifyUnsubscribeToken } from "@/features/email-delivery/unsubscribe-token";

export async function POST(request: Request) {
  const token = await readToken(request);
  if (!token) {
    return NextResponse.json({ status: "invalid_token" }, { status: 400 });
  }

  const result = verifyUnsubscribeToken(token, process.env.OUTREACH_UNSUBSCRIBE_SECRET ?? "");
  if (!result.ok) {
    return NextResponse.json({ status: "invalid_token" }, { status: 400 });
  }

  const stored = await createDurableSuppressionFromTokenClaims(result.claims);
  if (!stored.ok) {
    return NextResponse.json({ status: "durable_store_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ status: "confirmed" });
}

async function readToken(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") return null;
    const token = (payload as { token?: unknown }).token;
    return typeof token === "string" && token.trim() ? token.trim() : null;
  }
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  return typeof token === "string" && token.trim() ? token.trim() : null;
}
