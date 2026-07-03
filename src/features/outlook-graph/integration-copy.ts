export const outlookIntegrationCopy = {
  en: {
    title: "Microsoft Outlook",
    description: "Connect a mailbox with delegated Mail.Send for local organic outreach.",
    provider: "Microsoft Outlook",
    statuses: {
      disconnected: "Disconnected",
      connecting: "Connecting",
      connected: "Connected",
      expired: "Token expired",
      reconnect_required: "Reconnect required"
    },
    mailbox: "Mailbox",
    displayName: "Account",
    scopes: "Granted scopes",
    lastValidated: "Last validation",
    liveSend: "Live send",
    liveSendDisabled: "Live send disabled",
    liveSendDisabledBanner: "Envio real desativado",
    connect: "Connect Outlook",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    testConnection: "Test connection",
    backToSettings: "Back to settings",
    loading: "Loading connection status…",
    validationOk: "Mailbox validated successfully.",
    validationFailed: "Could not validate mailbox.",
    disconnectedOk: "Outlook disconnected and local token cache cleared.",
    graphDisabled: "Outlook Graph integration is disabled in environment configuration."
  },
  "pt-PT": {
    title: "Microsoft Outlook",
    description:
      "Ligue uma caixa de correio com Mail.Send delegado para outreach orgânico local.",
    provider: "Microsoft Outlook",
    statuses: {
      disconnected: "Desligado",
      connecting: "A ligar",
      connected: "Ligado",
      expired: "Token expirado",
      reconnect_required: "Reconexão necessária"
    },
    mailbox: "Caixa de correio",
    displayName: "Conta",
    scopes: "Permissões concedidas",
    lastValidated: "Última validação",
    liveSend: "Envio real",
    liveSendDisabled: "Envio real desativado",
    liveSendDisabledBanner: "Envio real desativado",
    connect: "Ligar Outlook",
    reconnect: "Religar",
    disconnect: "Desligar",
    testConnection: "Testar ligação",
    backToSettings: "Voltar às definições",
    loading: "A carregar estado da ligação…",
    validationOk: "Caixa de correio validada com sucesso.",
    validationFailed: "Não foi possível validar a caixa de correio.",
    disconnectedOk: "Outlook desligado e cache de tokens local removido.",
    graphDisabled: "A integração Outlook Graph está desativada na configuração."
  }
} as const;

export type OutlookIntegrationLocale = keyof typeof outlookIntegrationCopy;

export function getOutlookIntegrationCopy(locale: string) {
  return outlookIntegrationCopy[locale as OutlookIntegrationLocale] ?? outlookIntegrationCopy.en;
}
