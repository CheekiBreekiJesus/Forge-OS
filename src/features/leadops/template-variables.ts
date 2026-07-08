export const TEMPLATE_VARIABLES = [
  "companyName",
  "contactName",
  "category",
  "region",
  "website",
  "personalizedIntro",
  "recommendedProducts",
  "portfolioImageUrl",
  "portfolioImageAlt",
  "senderName",
  "companySenderName",
  "senderPhone",
  "senderEmail",
  "unsubscribeInstruction"
] as const;

/** Snake_case aliases accepted in templates for external tooling compatibility. */
export const TEMPLATE_VARIABLE_ALIASES: Record<string, TemplateVariableKey> = {
  company_name: "companyName",
  contact_name: "contactName",
  industry: "category",
  city_or_region: "region",
  personalized_intro: "personalizedIntro",
  recommended_products: "recommendedProducts",
  portfolio_image_url: "portfolioImageUrl",
  portfolio_image_alt: "portfolioImageAlt",
  sender_name: "senderName",
  sender_email: "senderEmail",
  sender_phone: "senderPhone",
  unsubscribe_text: "unsubscribeInstruction"
};

export type TemplateVariableKey = (typeof TEMPLATE_VARIABLES)[number];

export const TEMPLATE_VARIABLE_LABELS: Record<TemplateVariableKey, { en: string; "pt-PT": string }> =
  {
    companyName: { en: "Organization name", "pt-PT": "Nome da organização" },
    contactName: { en: "Contact name", "pt-PT": "Nome do contacto" },
    category: { en: "Category / industry", "pt-PT": "Categoria / indústria" },
    region: { en: "Region", "pt-PT": "Região" },
    website: { en: "Website", "pt-PT": "Website" },
    personalizedIntro: {
      en: "Personalized opening line",
      "pt-PT": "Introdução personalizada"
    },
    recommendedProducts: {
      en: "Recommended products line",
      "pt-PT": "Linha de produtos recomendados"
    },
    portfolioImageUrl: {
      en: "Portfolio image URL (HTTPS)",
      "pt-PT": "URL da imagem de portfólio (HTTPS)"
    },
    portfolioImageAlt: {
      en: "Portfolio image alt text",
      "pt-PT": "Texto alternativo da imagem de portfólio"
    },
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
