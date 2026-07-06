import type { UpsertOutreachTestProfileInput } from "@/domain/outreach-test-profile-types";
import {
  DEFAULT_OUTREACH_LOGO_PATH,
  DEFAULT_OUTREACH_SHOWCASE_PATH
} from "@/features/email-composition/outreach-branding-config";

export function buildJhGomesOutreachTestProfileDefaults(): UpsertOutreachTestProfileInput {
  return {
    campaignLanguage: "pt-PT",
    companyLogoReference: DEFAULT_OUTREACH_LOGO_PATH,
    companyName: "JH Gomes",
    companyWebsite: "https://www.jhgomes.pt",
    defaultOptOutLine: "Se preferir não receber futuras mensagens, responda com 'remover'.",
    defaultProductFocus: "Copos personalizados em plástico para eventos e restauração",
    defaultSignature:
      "Com os melhores cumprimentos,\nOperador ForgeOS\nJH Gomes\n+351 256 000 001",
    defaultTestRecipient: "",
    footerCtaLabel: "Ver copos personalizados",
    footerCtaUrl: "https://www.jhgomes.pt",
    replyToEmail: "operador@synthetic.example",
    senderDisplayName: "Operador ForgeOS",
    senderEmail: "operador@synthetic.example",
    showcaseImageReference: DEFAULT_OUTREACH_SHOWCASE_PATH
  };
}
