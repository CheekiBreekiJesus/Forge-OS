import { NextResponse } from "next/server";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";

export async function POST() {
  const provider = createOutlookGraphEmailProvider();
  await provider.disconnect();
  return NextResponse.json({ disconnected: true });
}
