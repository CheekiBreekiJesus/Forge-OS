import type {
  ImapMailboxConfig,
  MailboxConnectionTestResult,
  MailboxStaticDiagnostic,
  SmtpMailboxConfig
} from "@/domain/mailbox-connector-types";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";
import {
  readBoolean,
  readPort,
  readTimeoutMs
} from "@/features/mailbox-connector/config-parsing";
import {
  validateImapConfiguration,
  validateSmtpConfiguration
} from "@/features/mailbox-connector/config-validation";
import { verifyImapConnection } from "@/features/mailbox-connector/imap-verifier";
import { verifySmtpConnection } from "@/features/mailbox-connector/smtp-verifier";
import type { ImapClientFactory } from "@/features/mailbox-connector/imap-verifier";
import type { SmtpTransportFactory } from "@/features/mailbox-connector/smtp-verifier";

assertServerOnlyModule();

export type JhGomesMailConfig = {
  enabled: boolean;
  connectionTestEnabled: boolean;
  liveSendEnabled: boolean;
  readSyncEnabled: boolean;
  timeoutMs: number;
  smtp: SmtpMailboxConfig;
  imap: ImapMailboxConfig;
};

export function readJhGomesMailConfig(
  env: Record<string, string | undefined> = process.env
): JhGomesMailConfig {
  const timeoutMs = readTimeoutMs(env.JHGOMES_MAIL_TIMEOUT_MS);
  const smtpPort = readPort(env.JHGOMES_SMTP_PORT, 465);
  const imapPort = readPort(env.JHGOMES_IMAP_PORT, 993);

  return {
    connectionTestEnabled: readBoolean(env.JHGOMES_MAIL_CONNECTION_TEST_ENABLED),
    enabled: readBoolean(env.JHGOMES_MAIL_ENABLED),
    imap: {
      host: env.JHGOMES_IMAP_HOST?.trim() ?? "",
      password: env.JHGOMES_IMAP_PASSWORD?.trim() ?? "",
      port: imapPort ?? 0,
      secure: readBoolean(env.JHGOMES_IMAP_SECURE, true),
      timeoutMs,
      username: env.JHGOMES_IMAP_USERNAME?.trim() ?? ""
    },
    liveSendEnabled: readBoolean(env.JHGOMES_MAIL_LIVE_SEND_ENABLED),
    readSyncEnabled: readBoolean(env.JHGOMES_MAIL_READ_SYNC_ENABLED),
    smtp: {
      host: env.JHGOMES_SMTP_HOST?.trim() ?? "",
      password: env.JHGOMES_SMTP_PASSWORD?.trim() ?? "",
      port: smtpPort ?? 0,
      secure: readBoolean(env.JHGOMES_SMTP_SECURE, true),
      timeoutMs,
      username: env.JHGOMES_SMTP_USERNAME?.trim() ?? ""
    },
    timeoutMs
  };
}

export function buildJhGomesMailStaticDiagnostic(
  config: JhGomesMailConfig = readJhGomesMailConfig()
): MailboxStaticDiagnostic {
  const smtpValidation = validateSmtpConfiguration(config.smtp);
  const imapValidation = validateImapConfiguration(config.imap);

  return {
    connectionTestEnabled: config.connectionTestEnabled,
    enabled: config.enabled,
    imap: {
      configurationValid: imapValidation.configurationValid,
      host: config.imap.host,
      missing: mapMissingEnvKeys(imapValidation.missing, "imap"),
      passwordPresent: Boolean(config.imap.password),
      port: config.imap.port,
      secure: config.imap.secure,
      username: config.imap.username
    },
    liveSendEnabled: config.liveSendEnabled,
    readSyncEnabled: config.readSyncEnabled,
    smtp: {
      configurationValid: smtpValidation.configurationValid,
      host: config.smtp.host,
      missing: mapMissingEnvKeys(smtpValidation.missing, "smtp"),
      passwordPresent: Boolean(config.smtp.password),
      port: config.smtp.port,
      secure: config.smtp.secure,
      username: config.smtp.username
    }
  };
}

function mapMissingEnvKeys(missing: string[], protocol: "smtp" | "imap"): string[] {
  const prefix = protocol === "smtp" ? "JHGOMES_SMTP_" : "JHGOMES_IMAP_";
  return missing.map((field) => {
    switch (field) {
      case "host":
        return `${prefix}HOST`;
      case "port":
        return `${prefix}PORT`;
      case "username":
        return `${prefix}USERNAME`;
      case "password":
        return `${prefix}PASSWORD`;
      default:
        return field;
    }
  });
}

export type JhGomesConnectionTestOptions = {
  config?: JhGomesMailConfig;
  transportFactory?: SmtpTransportFactory;
  clientFactory?: ImapClientFactory;
};

export async function runJhGomesMailConnectionTest(
  options: JhGomesConnectionTestOptions = {}
): Promise<MailboxConnectionTestResult> {
  const config = options.config ?? readJhGomesMailConfig();

  if (!config.connectionTestEnabled) {
    throw new JhGomesMailConnectionTestError(
      "connection_test_disabled",
      "JH Gomes mail connection tests are disabled."
    );
  }

  if (!config.enabled) {
    throw new JhGomesMailConnectionTestError(
      "mail_connector_disabled",
      "JH Gomes mail connector is disabled."
    );
  }

  const smtp = await verifySmtpConnection(config.smtp, {
    transportFactory: options.transportFactory
  });
  const imap = await verifyImapConnection(config.imap, {
    clientFactory: options.clientFactory
  });

  return {
    configurationValid: smtp.configurationValid && imap.configurationValid,
    connectionTestEnabled: config.connectionTestEnabled,
    enabled: config.enabled,
    imap,
    liveSendEnabled: config.liveSendEnabled,
    readSyncEnabled: config.readSyncEnabled,
    smtp,
    testedAt: new Date().toISOString()
  };
}

export class JhGomesMailConnectionTestError extends Error {
  constructor(
    public readonly code: "connection_test_disabled" | "mail_connector_disabled",
    message: string
  ) {
    super(message);
    this.name = "JhGomesMailConnectionTestError";
  }
}

export function isJhGomesLiveSendAllowed(config: JhGomesMailConfig = readJhGomesMailConfig()): boolean {
  return config.enabled && config.liveSendEnabled;
}

export function isJhGomesReadSyncAllowed(config: JhGomesMailConfig = readJhGomesMailConfig()): boolean {
  return config.enabled && config.readSyncEnabled;
}
