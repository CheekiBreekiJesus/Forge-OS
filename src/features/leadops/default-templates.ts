import { type TemplateVariableKey } from "@/features/leadops/template-variables";

/**
 * Alternate PT subject lines for A/B testing or manual swap in the campaign editor.
 * Default seeded subject uses subjectOrganizationTarget for municipality-aware formatting.
 */
export const DEFAULT_PT_CUP_OUTREACH_SUBJECT_OPTIONS = [
  "Copos personalizados para {{subjectOrganizationTarget}}",
  "Soluções de embalagem e copos personalizados — {{organizationDisplayName}}",
  "Copos reutilizáveis e de papel personalizados para {{organizationDisplayName}}"
] as const;

export const DEFAULT_PT_CUP_OUTREACH_TEMPLATE = {
  language: "pt-PT" as const,
  templateVersion: 4,
  subjectTemplate: DEFAULT_PT_CUP_OUTREACH_SUBJECT_OPTIONS[0],
  plainTextTemplate: `{{greeting}}

{{personalizedIntro}}

Na {{companySenderName}} especializamo-nos em copos reutilizáveis de plástico personalizados e copos de papel personalizados, com produção adaptada a eventos, restauração e operações do dia-a-dia.

{{recommendedProducts}}

{{broaderRangeLine}}
{{regionLine}}

{{portfolioImageLine}}

{{portfolioSupportingLine}}

Gostaria de saber se faz sentido preparar-lhe um orçamento ou um mockup com o vosso logótipo. Pode responder a este email com o ficheiro de arte ou indicar quantidades e referências.

Com os melhores cumprimentos,
{{senderName}}
{{companySenderName}}
{{senderPhone}}
{{senderEmail}}

{{unsubscribeInstruction}}`,
  htmlTemplate: `<p>{{greeting}}</p>

<p>{{personalizedIntro}}</p>

<p>Na <strong>{{companySenderName}}</strong> especializamo-nos em copos reutilizáveis de plástico personalizados e copos de papel personalizados, com produção adaptada a eventos, restauração e operações do dia-a-dia.</p>

<p>{{recommendedProducts}}</p>

<p>{{broaderRangeLine}}</p>
{{regionLineHtml}}

{{portfolioImageHtml}}

<p>{{portfolioSupportingLine}}</p>

<p>Gostaria de saber se faz sentido preparar-lhe um <strong>orçamento</strong> ou um <strong>mockup</strong> com o vosso logótipo. Pode responder a este email com o ficheiro de arte ou indicar quantidades e referências.</p>

<p>Com os melhores cumprimentos,<br />
{{senderName}}<br />
{{companySenderName}}<br />
{{senderPhone}}<br />
<a href="mailto:{{senderEmail}}">{{senderEmail}}</a></p>

<p style="font-size:12px;color:#666;">{{unsubscribeInstruction}}</p>`
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
    templateVersion: 4,
    subjectTemplate: "Personalized cups for {{subjectOrganizationTarget}}",
    plainTextTemplate: `{{greeting}}

{{personalizedIntro}}

At {{companySenderName}}, we specialize in personalized reusable plastic cups and personalized paper cups for events, hospitality, and day-to-day operations.

{{recommendedProducts}}

{{broaderRangeLine}}
{{regionLine}}

{{portfolioImageLine}}

{{portfolioSupportingLine}}

Would it be helpful if we prepared a quotation or a mockup with your logo? You can reply with artwork or let us know typical quantities and references.

Kind regards,
{{senderName}}
{{companySenderName}}
{{senderPhone}}
{{senderEmail}}

{{unsubscribeInstruction}}`,
    htmlTemplate: `<p>{{greeting}}</p>

<p>{{personalizedIntro}}</p>

<p>At <strong>{{companySenderName}}</strong>, we specialize in personalized reusable plastic cups and personalized paper cups for events, hospitality, and day-to-day operations.</p>

<p>{{recommendedProducts}}</p>

<p>{{broaderRangeLine}}</p>
{{regionLineHtml}}

{{portfolioImageHtml}}

<p>{{portfolioSupportingLine}}</p>

<p>Would it be helpful if we prepared a <strong>quotation</strong> or a <strong>mockup</strong> with your logo? Reply with artwork or typical quantities and references.</p>

<p>Kind regards,<br />
{{senderName}}<br />
{{companySenderName}}<br />
{{senderPhone}}<br />
<a href="mailto:{{senderEmail}}">{{senderEmail}}</a></p>

<p style="font-size:12px;color:#666;">{{unsubscribeInstruction}}</p>`
  };
}

export const DERIVED_TEMPLATE_VARIABLES = [
  "categoryLine",
  "regionLine",
  "regionLineHtml",
  "websiteLine",
  "broaderRangeLine",
  "personalizedIntro",
  "recommendedProducts",
  "portfolioImageUrl",
  "portfolioImageAlt",
  "portfolioImageLine",
  "portfolioImageHtml",
  "portfolioSupportingLine",
  "greeting",
  "organizationDisplayName",
  "subjectOrganizationTarget",
  "companyWebsiteLine"
] as const;

export type DerivedTemplateVariableKey = (typeof DERIVED_TEMPLATE_VARIABLES)[number];

export function isPrimaryTemplateVariable(key: string): key is TemplateVariableKey {
  return !DERIVED_TEMPLATE_VARIABLES.includes(key as DerivedTemplateVariableKey);
}
