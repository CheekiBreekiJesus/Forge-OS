import type {
  EmailDeliveryRequest,
  EmailDeliveryResponse,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import {
  buildEmailProviderDiagnostic,
  type EmailDeliveryConfig
} from "./config";
import type { EmailDeliveryProvider } from "./provider";
import { assertServerOnlyModule } from "./server-only";

assertServerOnlyModule();

export class SimulationEmailDeliveryProvider implements EmailDeliveryProvider {
  constructor(private readonly config: EmailDeliveryConfig) {}

  diagnostic(): EmailProviderDiagnostic {
    return buildEmailProviderDiagnostic(this.config);
  }

  async send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse> {
    const mode =
      request.mode === "provider_test" || request.mode === "delivery_self_test"
        ? request.mode
        : "simulation";
    return {
      provider: "simulation",
      mode,
      status: "accepted",
      providerMessageId: `simulation-${request.idempotencyKey}`,
      retryable: false,
      errorCode: null,
      errorMessage: null
    };
  }
}
