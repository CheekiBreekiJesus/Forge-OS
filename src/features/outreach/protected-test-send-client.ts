import type { EmailDeliveryRequest, EmailDeliveryResponse } from "@/domain/email-delivery-types";

export type ProtectedTestSendInput = EmailDeliveryRequest & {
  confirmation: "SEND TEST";
  snapshotEmail?: string;
  language?: string;
};

export async function sendProtectedTestEmailViaApi(
  input: ProtectedTestSendInput
): Promise<{ response: Response; result: EmailDeliveryResponse }> {
  const response = await fetch("/api/leadops/email-provider/test-send", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });

  const result = (await response.json().catch(() => ({}))) as EmailDeliveryResponse;
  return { response, result };
}
