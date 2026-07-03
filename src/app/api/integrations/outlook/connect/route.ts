import { NextResponse } from "next/server";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import { readOutlookGraphConfig } from "@/features/outlook-graph/config";

export async function GET() {
  const config = readOutlookGraphConfig();
  if (!config.graphEnabled) {
    return NextResponse.json(
      { error: "OUTLOOK_GRAPH_ENABLED is false." },
      { status: 403 }
    );
  }
  try {
    const provider = createOutlookGraphEmailProvider(config);
    const { authorizationUrl } = provider.connect();
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "connect_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
