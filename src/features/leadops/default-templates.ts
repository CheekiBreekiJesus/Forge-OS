import {
  type TemplateVariableKey
} from "@/features/leadops/template-variables";

export const DEFAULT_PT_CUP_OUTREACH_TEMPLATE = {
  language: "pt-PT" as const,
  templateVersion: 1,
  subjectTemplate: "Copos personalizados para {{companyName}}",
  plainTextTemplate: `Exmo(a). Sr(a). {{contactName}},

Sou {{senderName}} da {{companySenderName}}. Trabalhamos com copos personalizados em plástico para eventos, restauração e organizações como a {{companyName}}.

{{categoryLine}}
{{regionLine}}
{{websiteLine}}

Se fizer sentido para a sua equipa, terei todo o gosto em preparar uma proposta ou esclarecer dúvidas por email ou telefone.

Com os melhores cumprimentos,
{{senderName}}
{{companySenderName}}
{{senderPhone}}
{{senderEmail}}

{{unsubscribeInstruction}}`,
  htmlTemplate: ""
};

export type CampaignTemplateSeed = {
  subjectTemplate: string;
  plainTextTemplate: string;
  htmlTemplate: string;
  language: string;
  templateVersion: number;
};

export function buildDefaultCampaignTemplate(language: string): CampaignTemplateSeed {
  if (language.startsWith("pt")) {
    return { ...DEFAULT_PT_CUP_OUTREACH_TEMPLATE };
  }

  return {
    language: "en",
    templateVersion: 1,
    subjectTemplate: "Personalized cups for {{companyName}}",
    plainTextTemplate: `Dear {{contactName}},

I am {{senderName}} from {{companySenderName}}. We supply personalized plastic cups for events, hospitality, and organizations like {{companyName}}.

{{categoryLine}}
{{regionLine}}
{{websiteLine}}

If helpful for your team, I would be glad to prepare a quotation or answer questions by email or phone.

Kind regards,
{{senderName}}
{{companySenderName}}
{{senderPhone}}
{{senderEmail}}

{{unsubscribeInstruction}}`,
    htmlTemplate: ""
  };
}

export const DERIVED_TEMPLATE_VARIABLES = ["categoryLine", "regionLine", "websiteLine"] as const;

export type DerivedTemplateVariableKey = (typeof DERIVED_TEMPLATE_VARIABLES)[number];

export function isPrimaryTemplateVariable(key: string): key is TemplateVariableKey {
  return !DERIVED_TEMPLATE_VARIABLES.includes(key as DerivedTemplateVariableKey);
}
