export const TEMPLATE_VARIABLES = [
  "companyName",
  "contactName",
  "category",
  "region",
  "website",
  "senderName",
  "companySenderName",
  "senderPhone",
  "senderEmail",
  "unsubscribeInstruction"
] as const;

export type TemplateVariableKey = (typeof TEMPLATE_VARIABLES)[number];

export const TEMPLATE_VARIABLE_LABELS: Record<TemplateVariableKey, { en: string; "pt-PT": string }> =
  {
    companyName: { en: "Organization name", "pt-PT": "Nome da organização" },
    contactName: { en: "Contact name", "pt-PT": "Nome do contacto" },
    category: { en: "Category / industry", "pt-PT": "Categoria / indústria" },
    region: { en: "Region", "pt-PT": "Região" },
    website: { en: "Website", "pt-PT": "Website" },
    senderName: { en: "Sender name", "pt-PT": "Nome do remetente" },
    companySenderName: { en: "Company name", "pt-PT": "Nome da empresa" },
    senderPhone: { en: "Sender phone", "pt-PT": "Telefone do remetente" },
    senderEmail: { en: "Sender email", "pt-PT": "Email do remetente" },
    unsubscribeInstruction: {
      en: "Opt-out instruction",
      "pt-PT": "Instrução de cancelamento"
    }
  };

export const DEFAULT_UNSUBSCRIBE_INSTRUCTION_PT =
  "Se preferir não receber contactos comerciais, responda a este email com o assunto \"Remover\".";

export const DEFAULT_UNSUBSCRIBE_INSTRUCTION_EN =
  'If you prefer not to receive commercial contact, reply to this email with the subject "Remove".';

export function defaultUnsubscribeInstruction(language: string): string {
  return language.startsWith("pt") ? DEFAULT_UNSUBSCRIBE_INSTRUCTION_PT : DEFAULT_UNSUBSCRIBE_INSTRUCTION_EN;
}
