export type ServerOutreachSendResponse = {
  ok?: boolean;
  alreadyProcessed?: boolean;
  idempotencyKey?: string;
  error?: string;
  code?: string;
  delivery?: {
    mode?: string;
    providerStatus?: string;
    deliveredSubject?: string;
    deliveredPlainText?: string;
  };
};

export function isSupabasePersistenceModeClient(): boolean {
  return process.env.NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE?.trim().toLowerCase() === "supabase";
}

export async function sendOutreachMessageViaServer(
  messageId: string,
  body: Record<string, unknown> = {}
): Promise<{ response: Response; result: ServerOutreachSendResponse }> {
  const response = await fetch(`/api/outreach/messages/${encodeURIComponent(messageId)}/send`, {
    body: JSON.stringify(body),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });

  const result = (await response.json().catch(() => ({}))) as ServerOutreachSendResponse;
  return { response, result };
}
