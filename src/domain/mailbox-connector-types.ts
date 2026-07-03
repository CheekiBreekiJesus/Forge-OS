export type SmtpMailboxConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  timeoutMs: number;
};

export type ImapMailboxConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  timeoutMs: number;
};

export type MailConnectionStage =
  | "configuration"
  | "dns_connectivity"
  | "tls"
  | "authentication"
  | "mailbox_access";

export type MailConnectionStageResult = {
  stage: MailConnectionStage;
  valid: boolean;
  message: string;
  errorCode?: string;
};

export type MailFolderSummary = {
  path: string;
  delimiter: string;
  flags: string[];
  specialUse?: string;
};

export type SmtpConnectionDiagnostic = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordPresent: boolean;
  configurationValid: boolean;
  stages: MailConnectionStageResult[];
};

export type ImapConnectionDiagnostic = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordPresent: boolean;
  configurationValid: boolean;
  stages: MailConnectionStageResult[];
  folders?: MailFolderSummary[];
};

export type MailboxConnectionTestResult = {
  enabled: boolean;
  connectionTestEnabled: boolean;
  liveSendEnabled: boolean;
  readSyncEnabled: boolean;
  configurationValid: boolean;
  smtp: SmtpConnectionDiagnostic;
  imap: ImapConnectionDiagnostic;
  testedAt: string;
};

export type MailboxStaticDiagnostic = {
  enabled: boolean;
  connectionTestEnabled: boolean;
  liveSendEnabled: boolean;
  readSyncEnabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    passwordPresent: boolean;
    configurationValid: boolean;
    missing: string[];
  };
  imap: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    passwordPresent: boolean;
    configurationValid: boolean;
    missing: string[];
  };
};
