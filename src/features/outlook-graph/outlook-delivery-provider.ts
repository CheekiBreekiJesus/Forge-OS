import type {
  EmailDeliveryRequest,
  EmailDeliveryResponse,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import {
  isOutlookLiveSendAllowed,
  isOutlookTestRecipientAllowed,
  readOutlookGraphConfig,
  validateOutlookConfiguration,
  type OutlookGraphConfig
} from "./config";
import type { EmailDeliveryProvider } from "@/features/email-delivery/provider";
import {
  mapClassificationToDeliveryStatus,
  mapClassificationToErrorCode
} from "./classify-error";
import { createOutlookGraphEmailProvider } from "./outlook-graph-provider";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export class OutlookGraphDeliveryProvider implements EmailDeliveryProvider {
  constructor(private readonly config: OutlookGraphConfig = readOutlookGraphConfig()) {}

  diagnostic(): EmailProviderDiagnostic {
    const missing = validateOutlookConfiguration(this.config);
    const warnings: string[] = [];
    if (!this.config.graphEnabled) {
      warnings.push("OUTLOOK_GRAPH_ENABLED is false.");
    }
    if (!this.config.liveSendEnabled) {
      warnings.push("OUTLOOK_LIVE_SEND_ENABLED is false.");
    }
    if (this.config.testRecipients.length === 0) {
      warnings.push("OUTLOOK_TEST_RECIPIENTS is empty.");
    }
    return {
      provider: "outlook",
      configured: this.config.graphEnabled && missing.length === 0,
      realSendEnabled: isOutlookLiveSendAllowed(this.config),
      testSendEnabled: isOutlookLiveSendAllowed(this.config),
      sandboxMode: !isOutlookLiveSendAllowed(this.config),
      apiKeyPresent: Boolean(this.config.clientId),
      senderEmailConfigured: true,
      senderNameConfigured: true,
      replyToConfigured: true,
      allowlistConfigured: this.config.testRecipients.length > 0,
      allowlistCount: this.config.testRecipients.length,
      publicBaseUrlConfigured: true,
      unsubscribeSecretConfigured: true,
      webhookSecretConfigured: false,
      missing: this.config.graphEnabled ? missing : ["OUTLOOK_GRAPH_ENABLED"],
      warnings
    };
  }

  async send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse> {
    const diagnostic = this.diagnostic();
    if (!diagnostic.configured) {
      return blocked("configuration_missing", "Outlook Graph is not fully configured.");
    }
    if (!isOutlookLiveSendAllowed(this.config)) {
      return blocked("real_send_disabled", "Real email delivery is disabled.");
    }
    if (request.mode === "provider_test" && !isOutlookTestRecipientAllowed(this.config, request.toEmail)) {
      return blocked("recipient_not_allowed", "The test recipient is not allowlisted.");
    }

    const provider = createOutlookGraphEmailProvider(this.config);
    const attemptId = request.idempotencyKey.slice(0, 64);
    const result = await provider.sendApprovedMessage({
      attemptId,
      approvedDraftVersion: request.approvedContentHash,
      bodyContentType: request.html ? "HTML" : "Text",
      campaignId: request.campaignId,
      locale: "pt-PT",
      recipientEmail: request.toEmail,
      recipientId: request.campaignRecipientId,
      renderedBody: request.html ?? request.plainText,
      senderSnapshot: {},
      subject: request.subject
    });

    const status = mapClassificationToDeliveryStatus(result.classification);
    return {
      provider: "outlook",
      mode: request.mode,
      status,
      providerMessageId: result.providerMessageId,
      retryable: result.retryable,
      errorCode: mapClassificationToErrorCode(result.classification),
      errorMessage: result.errorMessage
    };
  }
}

function blocked(
  errorCode: EmailDeliveryResponse["errorCode"],
  errorMessage: string
): EmailDeliveryResponse {
  return {
    provider: "outlook",
    mode: "provider_test",
    status: "blocked",
    providerMessageId: null,
    retryable: false,
    errorCode: errorCode ?? "invalid_request",
    errorMessage
  };
}
