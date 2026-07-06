import type { UpsertOutreachTestProfileInput } from "@/domain/outreach-test-profile-types";

export function buildJhGomesOutreachTestProfileDefaults(): UpsertOutreachTestProfileInput {
  return {
    campaignLanguage: "pt-PT",
    companyName: "JH Gomes",
    companyWebsite: "https://www.jhgomes.pt",
    defaultOptOutLine: "Se preferir não receber futuras mensagens, responda com 'remover'.",
    defaultProductFocus: "Copos personalizados em plástico para eventos e restauração",
    defaultSignature:
      "Com os melhores cumprimentos,\nOperador ForgeOS\nJH Gomes\n+351 256 000 001",
    defaultTestRecipient: "",
    replyToEmail: "operador@synthetic.example",
    senderDisplayName: "Operador ForgeOS",
    senderEmail: "operador@synthetic.example"
  };
}
