import type { OutlookGraphConfig } from "./config";
import {
  isOutlookLiveSendAllowed,
  readOutlookGraphConfig,
  validateOutlookConfiguration
} from "./config";
import type {
  OutlookApprovedSendPayload,
  OutlookConnectionInfo,
  OutlookGraphErrorClassification,
  OutlookSendResult
} from "./types";
import { classifyGraphHttpStatus } from "./classify-error";
import { sendMailViaGraph, type GraphSendOptions } from "./graph-client";
import {
  buildAuthorizationUrl,
  clearCachedTokens,
  exchangeAuthorizationCode,
  getConnectionInfo,
  saveCachedTokens,
  validateMailboxConnection
} from "./token-service";
import { createPendingOAuthSession, consumePendingOAuthSession } from "./oauth-state";
import { generateCodeChallenge } from "./oauth-pkce";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export const OUTLOOK_PROVIDER_ID = "outlook-graph" as const;

export interface EmailSendProvider {
  readonly providerId: typeof OUTLOOK_PROVIDER_ID;
  connect(): { authorizationUrl: string; state: string };
  completeConnect(code: string, state: string): Promise<OutlookConnectionInfo>;
  getConnectionStatus(): Promise<OutlookConnectionInfo>;
  disconnect(): Promise<void>;
  validateConfiguration(): string[];
  validateConnection(): Promise<{ ok: boolean; status: OutlookConnectionInfo["status"] }>;
  sendApprovedMessage(
    payload: OutlookApprovedSendPayload,
    options?: GraphSendOptions
  ): Promise<OutlookSendResult>;
  classifyError(httpStatus: number | null, timedOutAfterSubmit: boolean): OutlookSendResult;
}

export class OutlookGraphEmailProvider implements EmailSendProvider {
  readonly providerId = OUTLOOK_PROVIDER_ID;

  constructor(private readonly config: OutlookGraphConfig = readOutlookGraphConfig()) {}

  connect(): { authorizationUrl: string; state: string } {
    if (!this.config.graphEnabled) {
      throw new Error("OUTLOOK_GRAPH_ENABLED is false.");
    }
    const missing = validateOutlookConfiguration(this.config);
    if (missing.length > 0) {
      throw new Error(`Outlook configuration incomplete: ${missing.join(", ")}`);
    }
    const session = createPendingOAuthSession();
    const codeChallenge = generateCodeChallenge(session.codeVerifier);
    return {
      authorizationUrl: buildAuthorizationUrl(this.config, session.state, codeChallenge),
      state: session.state
    };
  }

  async completeConnect(code: string, state: string): Promise<OutlookConnectionInfo> {
    const session = consumePendingOAuthSession(state);
    if (!session) {
      throw new Error("invalid_or_expired_oauth_state");
    }
    const tokens = await exchangeAuthorizationCode(this.config, code, session.codeVerifier);
    await saveCachedTokens(this.config, tokens);
    return getConnectionInfo(this.config);
  }

  async getConnectionStatus(): Promise<OutlookConnectionInfo> {
    return getConnectionInfo(this.config);
  }

  async disconnect(): Promise<void> {
    await clearCachedTokens(this.config);
  }

  validateConfiguration(): string[] {
    return validateOutlookConfiguration(this.config);
  }

  async validateConnection(): Promise<{ ok: boolean; status: OutlookConnectionInfo["status"] }> {
    return validateMailboxConnection(this.config);
  }

  async sendApprovedMessage(
    payload: OutlookApprovedSendPayload,
    options?: GraphSendOptions
  ): Promise<OutlookSendResult> {
    if (!isOutlookLiveSendAllowed(this.config)) {
      return {
        classification: "blocked",
        httpStatus: null,
        providerMessageId: null,
        retryable: false,
        errorMessage: "Live Outlook sending is disabled."
      };
    }
    return sendMailViaGraph(this.config, payload, options);
  }

  classifyError(httpStatus: number | null, timedOutAfterSubmit: boolean): OutlookSendResult {
    return classifyGraphHttpStatus(httpStatus, timedOutAfterSubmit);
  }
}

export function createOutlookGraphEmailProvider(
  config?: OutlookGraphConfig
): OutlookGraphEmailProvider {
  return new OutlookGraphEmailProvider(config);
}

export type { OutlookGraphErrorClassification };
