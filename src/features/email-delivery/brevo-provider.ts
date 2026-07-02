import type {
  EmailDeliveryErrorCode,
  EmailDeliveryRequest,
  EmailDeliveryResponse,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import {
  buildEmailProviderDiagnostic,
  isAllowlistedTestRecipient,
  type EmailDeliveryConfig
} from "./config";
import type { EmailDeliveryProvider } from "./provider";
import { assertServerOnlyModule } from "./server-only";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

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
    if (!diagnostic.configured) {
      return blocked("configuration_missing", "Brevo email delivery is not fully configured.");
    }
    if (!this.config.realSendEnabled) {
      return blocked("real_send_disabled", "Real email delivery is disabled.");
    }
    if (request.mode === "provider_test" && !this.config.testSendEnabled) {
      return blocked("test_send_disabled", "Protected test email delivery is disabled.");
    }
    if (request.mode === "provider_test" && !isAllowlistedTestRecipient(this.config, request.toEmail)) {
      return blocked("recipient_not_allowed", "The test recipient is not allowlisted.");
    }

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
        return failed(response.status, payload as BrevoErrorPayload, this.config.brevoApiKey);
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
    const payload: Record<string, unknown> = {
      htmlContent: request.html?.trim() ? request.html : undefined,
      replyTo: this.config.brevoReplyTo
        ? { email: this.config.brevoReplyTo, name: this.config.brevoSenderName }
        : undefined,
      sender: {
        email: this.config.brevoSenderEmail,
        name: this.config.brevoSenderName
      },
      subject: request.subject,
      textContent: request.plainText,
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

function blocked(
  errorCode: EmailDeliveryErrorCode,
  errorMessage: string
): EmailDeliveryResponse {
  return {
    provider: "brevo",
    mode: "provider_test",
    status: "blocked",
    providerMessageId: null,
    retryable: false,
    errorCode,
    errorMessage
  };
}

function failed(status: number, payload: BrevoErrorPayload, apiKey: string): EmailDeliveryResponse {
  const mapped = mapBrevoError(status, payload.code);
  return {
    provider: "brevo",
    mode: "provider_test",
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
