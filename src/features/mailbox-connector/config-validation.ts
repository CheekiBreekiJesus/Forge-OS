import type {
  ImapMailboxConfig,
  MailConnectionStageResult,
  MailFolderSummary,
  SmtpMailboxConfig
} from "@/domain/mailbox-connector-types";
import {
  isSecurePortExpected,
  isValidEmailAddress,
  isValidHostname
} from "./config-parsing";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";

assertServerOnlyModule();

export type SmtpValidationResult = {
  config: SmtpMailboxConfig | null;
  configurationValid: boolean;
  missing: string[];
  stages: MailConnectionStageResult[];
};

export function validateSmtpConfiguration(
  input: Partial<SmtpMailboxConfig> & { timeoutMs?: number }
): SmtpValidationResult {
  const missing: string[] = [];
  const stages: MailConnectionStageResult[] = [];

  const host = input.host?.trim() ?? "";
  const port = input.port ?? 0;
  const secure = input.secure ?? false;
  const username = input.username?.trim() ?? "";
  const password = input.password ?? "";
  const timeoutMs = input.timeoutMs ?? 15000;

  if (!host) missing.push("host");
  else if (!isValidHostname(host)) missing.push("host");

  if (!Number.isInteger(port) || port < 1 || port > 65535) missing.push("port");

  if (!username) missing.push("username");
  else if (!isValidEmailAddress(username)) missing.push("username");

  if (!password) missing.push("password");

  let portSecureMismatch = false;
  if (Number.isInteger(port) && port > 0 && !isSecurePortExpected(port, secure)) {
    portSecureMismatch = true;
  }

  const configurationValid =
    missing.length === 0 && !portSecureMismatch;

  stages.unshift({
    stage: "configuration",
    valid: configurationValid,
    message: portSecureMismatch
      ? `Port ${port} does not match secure=${secure} expectation.`
      : missing.length === 0
        ? "SMTP configuration fields are present and syntactically valid."
        : `SMTP configuration is incomplete or invalid: ${missing.join(", ")}.`,
    errorCode: configurationValid ? undefined : portSecureMismatch ? "port_secure_mismatch" : "configuration_invalid"
  });

  if (!configurationValid) {
    return { config: null, configurationValid: false, missing, stages };
  }

  return {
    config: { host, port, secure, username, password, timeoutMs },
    configurationValid: true,
    missing,
    stages
  };
}

export type ImapValidationResult = {
  config: ImapMailboxConfig | null;
  configurationValid: boolean;
  missing: string[];
  stages: MailConnectionStageResult[];
};

export function validateImapConfiguration(
  input: Partial<ImapMailboxConfig> & { timeoutMs?: number }
): ImapValidationResult {
  const missing: string[] = [];
  const stages: MailConnectionStageResult[] = [];

  const host = input.host?.trim() ?? "";
  const port = input.port ?? 0;
  const secure = input.secure ?? false;
  const username = input.username?.trim() ?? "";
  const password = input.password ?? "";
  const timeoutMs = input.timeoutMs ?? 15000;

  if (!host) missing.push("host");
  else if (!isValidHostname(host)) missing.push("host");

  if (!Number.isInteger(port) || port < 1 || port > 65535) missing.push("port");

  if (!username) missing.push("username");
  else if (!isValidEmailAddress(username)) missing.push("username");

  if (!password) missing.push("password");

  let portSecureMismatch = false;
  if (Number.isInteger(port) && port > 0 && !isSecurePortExpected(port, secure)) {
    portSecureMismatch = true;
  }

  const configurationValid =
    missing.length === 0 && !portSecureMismatch;

  stages.unshift({
    stage: "configuration",
    valid: configurationValid,
    message: portSecureMismatch
      ? `Port ${port} does not match secure=${secure} expectation.`
      : missing.length === 0
        ? "IMAP configuration fields are present and syntactically valid."
        : `IMAP configuration is incomplete or invalid: ${missing.join(", ")}.`,
    errorCode: configurationValid ? undefined : portSecureMismatch ? "port_secure_mismatch" : "configuration_invalid"
  });

  if (!configurationValid) {
    return { config: null, configurationValid: false, missing, stages };
  }

  return {
    config: { host, port, secure, username, password, timeoutMs },
    configurationValid: true,
    missing,
    stages
  };
}

export function summarizeImapFolders(
  mailboxes: Array<{
    path: string;
    delimiter: string;
    flags?: Set<string>;
    specialUse?: string;
  }>
): MailFolderSummary[] {
  return mailboxes.map((mailbox) => ({
    path: mailbox.path,
    delimiter: mailbox.delimiter,
    flags: mailbox.flags ? Array.from(mailbox.flags) : [],
    specialUse: mailbox.specialUse
  }));
}
