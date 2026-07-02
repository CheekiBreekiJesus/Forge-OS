import type {
  EmailDeliveryRequest,
  EmailDeliveryResponse,
  EmailProviderDiagnostic
} from "@/domain/email-delivery-types";
import { assertServerOnlyModule } from "./server-only";
import {
  buildEmailProviderDiagnostic,
  readEmailDeliveryConfig,
  type EmailDeliveryConfig
} from "./config";
import { BrevoEmailDeliveryProvider } from "./brevo-provider";
import { SimulationEmailDeliveryProvider } from "./simulation-provider";

assertServerOnlyModule();

export interface EmailDeliveryProvider {
  diagnostic(): EmailProviderDiagnostic;
  send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse>;
}

export function createEmailDeliveryProvider(
  config: EmailDeliveryConfig = readEmailDeliveryConfig()
): EmailDeliveryProvider {
  if (config.provider === "brevo") {
    return new BrevoEmailDeliveryProvider(config);
  }
  return new SimulationEmailDeliveryProvider(config);
}

export function getEmailProviderDiagnostic(
  config: EmailDeliveryConfig = readEmailDeliveryConfig()
): EmailProviderDiagnostic {
  return buildEmailProviderDiagnostic(config);
}
