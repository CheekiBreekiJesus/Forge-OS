import type { OutlookGraphErrorClassification, OutlookSendResult } from "./types";

export function classifyGraphHttpStatus(
  httpStatus: number | null,
  timedOutAfterSubmit: boolean
): OutlookSendResult {
  if (timedOutAfterSubmit) {
    return {
      classification: "uncertain",
      httpStatus,
      providerMessageId: null,
      retryable: false,
      errorMessage: "Request may have been submitted before the connection was lost."
    };
  }
  if (httpStatus === 202) {
    return {
      classification: "accepted",
      httpStatus,
      providerMessageId: null,
      retryable: false,
      errorMessage: null
    };
  }
  if (httpStatus === 400) {
    return {
      classification: "permanent_request_failure",
      httpStatus,
      providerMessageId: null,
      retryable: false,
      errorMessage: "Microsoft Graph rejected the send request."
    };
  }
  if (httpStatus === 401) {
    return {
      classification: "reconnect_required",
      httpStatus,
      providerMessageId: null,
      retryable: false,
      errorMessage: "Outlook connection expired. Reconnect required."
    };
  }
  if (httpStatus === 403) {
    return {
      classification: "permission_failure",
      httpStatus,
      providerMessageId: null,
      retryable: false,
      errorMessage: "Mail.Send permission missing or mailbox not authorized."
    };
  }
  if (httpStatus === 429) {
    return {
      classification: "throttled",
      httpStatus,
      providerMessageId: null,
      retryable: true,
      errorMessage: "Microsoft Graph throttled the request."
    };
  }
  if (httpStatus !== null && httpStatus >= 500) {
    return {
      classification: "temporary_provider_failure",
      httpStatus,
      providerMessageId: null,
      retryable: true,
      errorMessage: "Microsoft Graph returned a temporary server error."
    };
  }
  return {
    classification: "uncertain",
    httpStatus,
    providerMessageId: null,
    retryable: false,
    errorMessage: "Unexpected Graph response."
  };
}

export function mapClassificationToDeliveryStatus(
  classification: OutlookGraphErrorClassification
): "accepted" | "blocked" | "failed" | "uncertain" | "throttled" {
  if (classification === "accepted") return "accepted";
  if (classification === "blocked") return "blocked";
  if (classification === "throttled") return "throttled";
  if (classification === "uncertain") return "uncertain";
  return "failed";
}

export function mapClassificationToErrorCode(
  classification: OutlookGraphErrorClassification
):
  | "configuration_missing"
  | "real_send_disabled"
  | "test_send_disabled"
  | "recipient_not_allowed"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "provider_rejected"
  | "provider_unavailable"
  | "network_error"
  | null {
  switch (classification) {
    case "accepted":
    case "uncertain":
    case "blocked":
      return null;
    case "reconnect_required":
      return "unauthorized";
    case "permission_failure":
      return "forbidden";
    case "throttled":
      return "rate_limited";
    case "temporary_provider_failure":
      return "provider_unavailable";
    case "permanent_request_failure":
      return "provider_rejected";
    default: {
      const _exhaustive: never = classification;
      return _exhaustive;
    }
  }
}
