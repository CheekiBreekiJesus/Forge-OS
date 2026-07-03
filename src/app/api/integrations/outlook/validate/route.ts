import { NextResponse } from "next/server";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";

export async function POST() {
  const provider = createOutlookGraphEmailProvider();
  const result = await provider.validateConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
