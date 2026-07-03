import type { OutlookGraphConfig } from "./config";
import { isOutlookLiveSendAllowed } from "./config";
import type { OutlookApprovedSendPayload, OutlookSendResult } from "./types";
import { classifyGraphHttpStatus } from "./classify-error";
import { getValidAccessToken } from "./token-service";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export type GraphSendOptions = {
  fetchImpl?: typeof fetch;
  graphBaseUrl?: string;
  timeoutMs?: number;
  /** When true, simulates connection loss after request body is sent. */
  simulateConnectionLossAfterSubmit?: boolean;
};

export async function sendMailViaGraph(
  config: OutlookGraphConfig,
  payload: OutlookApprovedSendPayload,
  options: GraphSendOptions = {}
): Promise<OutlookSendResult> {
  if (!isOutlookLiveSendAllowed(config)) {
    return {
      classification: "blocked",
      httpStatus: null,
      providerMessageId: null,
      retryable: false,
      errorMessage: "Live Outlook sending is disabled."
    };
  }

  const accessToken = await getValidAccessToken(config);
  if (!accessToken) {
    return {
      classification: "reconnect_required",
      httpStatus: 401,
      providerMessageId: null,
      retryable: false,
      errorMessage: "Outlook is not connected."
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const graphBaseUrl = options.graphBaseUrl ?? config.graphBaseUrl;
  const timeoutMs = options.timeoutMs ?? config.timeoutMs;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let submitted = false;
  try {
    const body = buildSendMailBody(payload);
    submitted = true;
    if (options.simulateConnectionLossAfterSubmit) {
      throw new DOMException("connection_lost", "AbortError");
    }
    const response = await fetchImpl(`${graphBaseUrl}/me/sendMail`, {
      body: JSON.stringify(body),
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      method: "POST",
      signal: controller.signal
    });
    return classifyGraphHttpStatus(response.status, false);
  } catch (error) {
    const timedOutAfterSubmit =
      submitted &&
      (error instanceof DOMException ||
        (error instanceof Error && error.name === "AbortError"));
    if (timedOutAfterSubmit) {
      return classifyGraphHttpStatus(null, true);
    }
    return {
      classification: "temporary_provider_failure",
      httpStatus: null,
      providerMessageId: null,
      retryable: true,
      errorMessage: "Network error before Graph response."
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildSendMailBody(payload: OutlookApprovedSendPayload) {
  return {
    message: {
      subject: payload.subject,
      body: {
        contentType: payload.bodyContentType,
        content: payload.renderedBody
      },
      toRecipients: [
        {
          emailAddress: {
            address: payload.recipientEmail
          }
        }
      ],
      internetMessageHeaders: [
        {
          name: "x-forgeos-attempt-id",
          value: payload.attemptId
        }
      ]
    },
    saveToSentItems: true
  };
}
