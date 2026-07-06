import { createHash } from "node:crypto";
import type {
  EmailDeliveryRequest,
  EmailDeliverySelfTestInput,
  EmailDeliverySelfTestResult
} from "@/domain/email-delivery-types";
import { readEmailDeliveryConfig } from "@/features/email-delivery/config";
import type { EmailDeliveryProvider } from "@/features/email-delivery/provider";
import { createEmailDeliveryProvider } from "@/features/email-delivery/provider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SELF_TEST_CONFIRMATION = "SEND SELF TEST";
export const EMAIL_DELIVERY_SELF_TEST_SENTINEL = "__email_delivery_self_test__";

export function buildSelfTestIdempotencyKey(
  recipientEmail: string,
  subject: string,
  messageBody: string
): string {
  const digest = createHash("sha256")
    .update([recipientEmail.trim().toLowerCase(), subject.trim(), messageBody.trim()].join("|"))
    .digest("hex")
    .slice(0, 16);
  return `self-test:${recipientEmail.trim().toLowerCase()}:${digest}`;
}

export function validateSelfTestInput(input: EmailDeliverySelfTestInput): string | null {
  if (input.confirmation !== SELF_TEST_CONFIRMATION) {
    return "Explicit self-test confirmation is required.";
  }

  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (!recipientEmail) {
    return "Recipient email is required.";
  }
  if (!EMAIL_RE.test(recipientEmail)) {
    return "Recipient email is invalid.";
  }

  if (!input.subject.trim()) {
    return "Subject is required.";
  }
  if (!input.messageBody.trim()) {
    return "Message body is required.";
  }

  const config = readEmailDeliveryConfig();
  if (!config.testSendEnabled) {
    return "OUTREACH_TEST_SEND_ENABLED is false.";
  }

  if (config.provider === "brevo") {
    if (!config.brevoApiKey) return "BREVO_API_KEY is missing.";
    if (!EMAIL_RE.test(config.brevoSenderEmail)) return "BREVO_SENDER_EMAIL is missing or invalid.";
    if (!config.brevoSenderName) return "BREVO_SENDER_NAME is missing.";
  }

  if (config.provider === "simulation") {
    return null;
  }

  const diagnosticProvider = createEmailDeliveryProvider(config);
  const diagnostic = diagnosticProvider.diagnostic();
  if (diagnostic.emailDeliveryProvider === "gmail" && !diagnostic.gmailConfigured) {
    return "Gmail provider is not configured yet.";
  }
  if (diagnostic.emailDeliveryProvider === "outlook" && !diagnostic.outlookConfigured) {
    return "Outlook provider is not configured yet.";
  }

  return null;
}

export function buildSelfTestDeliveryRequest(
  input: EmailDeliverySelfTestInput,
  tenantId: string = "local-tenant"
): EmailDeliveryRequest {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const subject = input.subject.trim();
  const messageBody = input.messageBody.trim();
  const idempotencyKey = buildSelfTestIdempotencyKey(recipientEmail, subject, messageBody);

  return {
    approvedContentHash: idempotencyKey,
    campaignId: EMAIL_DELIVERY_SELF_TEST_SENTINEL,
    campaignRecipientId: EMAIL_DELIVERY_SELF_TEST_SENTINEL,
    html: `<p>${escapeHtml(messageBody)}</p>`,
    idempotencyKey,
    initiatedBy: input.initiatedBy ?? "settings-self-test",
    leadId: EMAIL_DELIVERY_SELF_TEST_SENTINEL,
    mode: "delivery_self_test",
    plainText: messageBody,
    subject,
    tenantId,
    toEmail: recipientEmail,
    toName: recipientEmail
  };
}

export async function sendEmailDeliverySelfTest(
  input: EmailDeliverySelfTestInput,
  provider: EmailDeliveryProvider = createEmailDeliveryProvider()
): Promise<EmailDeliverySelfTestResult> {
  const validationError = validateSelfTestInput(input);
  if (validationError) {
    return {
      errorCode: validationError.includes("OUTREACH_TEST_SEND_ENABLED")
        ? "test_send_disabled"
        : validationError.includes("BREVO_API_KEY")
          ? "configuration_missing"
          : validationError.includes("invalid")
            ? "invalid_request"
            : "configuration_missing",
      errorMessage: validationError,
      idempotencyKey: buildSelfTestIdempotencyKey(
        input.recipientEmail,
        input.subject,
        input.messageBody
      ),
      mode: "delivery_self_test",
      provider: readEmailDeliveryConfig().provider,
      providerMessageId: null,
      retryable: false,
      status: "blocked"
    };
  }

  const request = buildSelfTestDeliveryRequest(input);
  const delivery = await provider.send(request);

  if (process.env.NODE_ENV !== "production") {
    const runtimeMode = process.env.FORGEOS_RUNTIME_MODE?.trim().toLowerCase();
    if (!runtimeMode || runtimeMode === "development") {
      console.info("[email-delivery] self-test result", {
        recipient: request.toEmail,
        status: delivery.status,
        errorCode: delivery.errorCode,
        errorMessage: delivery.errorMessage,
        providerMessageId: delivery.providerMessageId
      });
    }
  }

  return {
    ...delivery,
    idempotencyKey: request.idempotencyKey
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
