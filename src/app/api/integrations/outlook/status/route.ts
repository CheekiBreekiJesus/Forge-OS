import { NextResponse } from "next/server";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import { readOutlookGraphConfig } from "@/features/outlook-graph/config";

export async function GET() {
  const config = readOutlookGraphConfig();
  const provider = createOutlookGraphEmailProvider(config);
  const connection = await provider.getConnectionStatus();
  return NextResponse.json({
    connection: {
      status: connection.status,
      mailboxAddress: connection.mailboxAddress,
      displayName: connection.displayName,
      grantedScopes: connection.grantedScopes,
      lastValidatedAt: connection.lastValidatedAt,
      liveSendEnabled: connection.liveSendEnabled,
      graphEnabled: connection.graphEnabled,
      liveSendDisabledLabel: connection.liveSendEnabled ? null : "Envio real desativado"
    },
    configurationMissing: provider.validateConfiguration()
  });
}
