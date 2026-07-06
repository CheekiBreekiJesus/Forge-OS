import type {
  EmailDeliveryErrorCode,
  EmailDeliveryRequest,
  EmailDeliveryResponse,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import {
  buildEmailProviderDiagnostic,
  isAllowlistedTestRecipient,
  redactApiKey,
  type EmailDeliveryConfig
} from "./config";
import type { EmailDeliveryProvider } from "./provider";
import { assertServerOnlyModule } from "./server-only";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

assertServerOnlyModule();

type BrevoErrorPayload = {
  code?: string;
  message?: string;
};

type BrevoSuccessPayload = {
  messageId?: string;
};

export class BrevoEmailDeliveryProvider implements EmailDeliveryProvider {
  constructor(private readonly config: EmailDeliveryConfig) {}

  diagnostic(): EmailProviderDiagnostic {
    return buildEmailProviderDiagnostic(this.config);
  }

  async send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse> {
    const diagnostic = this.diagnostic();
    const isSelfTest = request.mode === "delivery_self_test";

    if (isSelfTest) {
      if (!this.config.testSendEnabled) {
        return blocked("test_send_disabled", "Email delivery self-test is disabled.", request.mode);
      }
      if (!this.config.brevoApiKey) {
        return blocked("configuration_missing", "BREVO_API_KEY is missing.", request.mode);
      }
      if (!EMAIL_RE.test(this.config.brevoSenderEmail)) {
        return blocked("configuration_missing", "BREVO_SENDER_EMAIL is missing or invalid.", request.mode);
      }
      if (!this.config.brevoSenderName) {
        return blocked("configuration_missing", "BREVO_SENDER_NAME is missing.", request.mode);
      }
      if (!isAllowlistedTestRecipient(this.config, request.toEmail)) {
        return blocked("recipient_not_allowed", "The self-test recipient is not allowlisted.", request.mode);
      }
    } else {
      if (!diagnostic.configured) {
        return blocked("configuration_missing", "Brevo email delivery is not fully configured.", request.mode);
      }
      if (!this.config.realSendEnabled) {
        return blocked("real_send_disabled", "Real email delivery is disabled.", request.mode);
      }
      if (request.mode === "provider_test" && !this.config.testSendEnabled) {
        return blocked("test_send_disabled", "Protected test email delivery is disabled.", request.mode);
      }
      if (request.mode === "provider_test" && !isAllowlistedTestRecipient(this.config, request.toEmail)) {
        return blocked("recipient_not_allowed", "The test recipient is not allowlisted.", request.mode);
      }
      if (!request.unsubscribeUrl?.trim()) {
        return blocked("invalid_request", "Real provider delivery requires a valid unsubscribe URL.", request.mode);
      }
    }

    logDevelopmentSendAttempt(request, this.config.brevoApiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(BREVO_ENDPOINT, {
        body: JSON.stringify(this.buildPayload(request)),
        headers: {
          accept: "application/json",
          "api-key": this.config.brevoApiKey,
          "content-type": "application/json"
        },
        method: "POST",
        signal: controller.signal
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        return failed(response.status, payload as BrevoErrorPayload, this.config.brevoApiKey, request.mode);
      }

      const success = payload as BrevoSuccessPayload;
      return {
        provider: "brevo",
        mode: request.mode,
        status: "accepted",
        providerMessageId: success.messageId ?? null,
        retryable: false,
        errorCode: null,
        errorMessage: null
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          provider: "brevo",
          mode: request.mode,
          status: "failed",
          providerMessageId: null,
          retryable: true,
          errorCode: "timeout",
          errorMessage: "Brevo request timed out."
        };
      }
      return {
        provider: "brevo",
        mode: request.mode,
        status: "failed",
        providerMessageId: null,
        retryable: true,
        errorCode: "network_error",
        errorMessage: "Brevo request failed before a response was received."
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPayload(request: EmailDeliveryRequest) {
    const unsubscribeUrl = request.unsubscribeUrl ?? "";
    const isSelfTest = request.mode === "delivery_self_test";
    const payload: Record<string, unknown> = {
      htmlContent: isSelfTest
        ? request.html
        : appendHtmlUnsubscribe(request.html, unsubscribeUrl),
      replyTo: this.config.brevoReplyTo
        ? { email: this.config.brevoReplyTo, name: this.config.brevoSenderName }
        : undefined,
      sender: {
        email: this.config.brevoSenderEmail,
        name: this.config.brevoSenderName
      },
      subject: request.subject,
      tags: isSelfTest
        ? ["forgeos:self-test"]
        : [
            `tenant:${request.tenantId}`,
            `campaign:${request.campaignId}`,
            `recipient:${request.campaignRecipientId}`
          ],
      textContent: isSelfTest
        ? request.plainText
        : appendTextUnsubscribe(request.plainText, unsubscribeUrl),
      to: [
        {
          email: request.toEmail,
          name: request.toName || request.toEmail
        }
      ]
    };

    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  }
}

function appendTextUnsubscribe(content: string, unsubscribeUrl: string): string {
  return `${content.trim()}\n\n--\nOpt-out: ${unsubscribeUrl}`;
}

function appendHtmlUnsubscribe(content: string | undefined, unsubscribeUrl: string): string | undefined {
  if (!content?.trim()) return undefined;
  return `${content.trim()}<p><a href="${escapeHtml(unsubscribeUrl)}">Opt out of future outreach</a></p>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function blocked(
  errorCode: EmailDeliveryErrorCode,
  errorMessage: string,
  mode: EmailDeliveryRequest["mode"] = "provider_test"
): EmailDeliveryResponse {
  return {
    provider: "brevo",
    mode,
    status: "blocked",
    providerMessageId: null,
    retryable: false,
    errorCode,
    errorMessage
  };
}

function failed(
  status: number,
  payload: BrevoErrorPayload,
  apiKey: string,
  mode: EmailDeliveryRequest["mode"]
): EmailDeliveryResponse {
  const mapped = mapBrevoError(status, payload.code);
  return {
    provider: "brevo",
    mode,
    status: "failed",
    providerMessageId: null,
    retryable: mapped.retryable,
    errorCode: mapped.code,
    errorMessage: sanitizeProviderMessage(payload.message, apiKey) ?? mapped.message
  };
}

function mapBrevoError(
  status: number,
  code: string | undefined
): { code: EmailDeliveryErrorCode; message: string; retryable: boolean } {
  if (status === 401) return { code: "unauthorized", message: "Brevo rejected the API key.", retryable: false };
  if (status === 402) return { code: "not_enough_credits", message: "Brevo account has insufficient credits.", retryable: false };
  if (status === 403) return { code: "forbidden", message: "Brevo rejected the request permissions.", retryable: false };
  if (status === 429) return { code: "rate_limited", message: "Brevo rate limit exceeded.", retryable: true };
  if (status >= 500) return { code: "provider_unavailable", message: "Brevo is temporarily unavailable.", retryable: true };
  if (code === "not_enough_credits") {
    return { code: "not_enough_credits", message: "Brevo account has insufficient credits.", retryable: false };
  }
  return { code: "provider_rejected", message: "Brevo rejected the email request.", retryable: false };
}

function sanitizeProviderMessage(message: string | undefined, apiKey: string): string | null {
  if (!message) return null;
  const escapedKey = apiKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const apiKeyPattern = escapedKey ? new RegExp(escapedKey, "g") : null;
  const redacted = message.replace(/xkeysib-[a-z0-9-]+/gi, "[redacted]");
  return (apiKeyPattern ? redacted.replace(apiKeyPattern, "[redacted]") : redacted).slice(0, 240);
}

function logDevelopmentSendAttempt(request: EmailDeliveryRequest, apiKey: string): void {
  if (process.env.NODE_ENV === "production") return;
  const runtimeMode = process.env.FORGEOS_RUNTIME_MODE?.trim().toLowerCase();
  if (runtimeMode && runtimeMode !== "development") return;

  console.info("[email-delivery] provider send attempt", {
    mode: request.mode,
    provider: "brevo",
    recipient: request.toEmail,
    subject: request.subject,
    apiKey: redactApiKey(apiKey),
    campaignRecipientId: request.campaignRecipientId || null
  });
}
