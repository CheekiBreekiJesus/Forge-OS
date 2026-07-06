import {
  type TemplateVariableKey
} from "@/features/leadops/template-variables";

export const DEFAULT_PT_CUP_OUTREACH_TEMPLATE = {
  language: "pt-PT" as const,
  templateVersion: 2,
  subjectTemplate: "Copos personalizados para {{subjectOrganizationTarget}}",
  plainTextTemplate: `{{greeting}}

Sou {{senderName}} da {{companySenderName}}. Trabalhamos com copos personalizados em plástico para eventos, restauração e organizações como {{organizationDisplayName}}.

{{categoryLine}}
{{regionLine}}

Se fizer sentido para a sua equipa, terei todo o gosto em preparar uma proposta ou esclarecer dúvidas por email ou telefone.

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
    templateVersion: 2,
    subjectTemplate: "Personalized cups for {{subjectOrganizationTarget}}",
    plainTextTemplate: `{{greeting}}

I am {{senderName}} from {{companySenderName}}. We supply personalized plastic cups for events, hospitality, and organizations like {{organizationDisplayName}}.

{{categoryLine}}
{{regionLine}}

If helpful for your team, I would be glad to prepare a quotation or answer questions by email or phone.

{{unsubscribeInstruction}}`,
    htmlTemplate: ""
  };
}

export const DERIVED_TEMPLATE_VARIABLES = ["categoryLine", "regionLine", "websiteLine"] as const;

export type DerivedTemplateVariableKey = (typeof DERIVED_TEMPLATE_VARIABLES)[number];

export function isPrimaryTemplateVariable(key: string): key is TemplateVariableKey {
  return !DERIVED_TEMPLATE_VARIABLES.includes(key as DerivedTemplateVariableKey);
}
