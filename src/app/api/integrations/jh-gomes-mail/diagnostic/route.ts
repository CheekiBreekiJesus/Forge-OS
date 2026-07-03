import { NextResponse } from "next/server";
import { buildJhGomesMailStaticDiagnostic } from "@/features/jh-gomes-mail/config";

export async function GET() {
  return NextResponse.json(buildJhGomesMailStaticDiagnostic());
}
