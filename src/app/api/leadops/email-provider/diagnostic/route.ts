import { NextResponse } from "next/server";
import { getEmailProviderDiagnostic } from "@/features/email-delivery/provider";

export async function GET() {
  return NextResponse.json(getEmailProviderDiagnostic());
}
