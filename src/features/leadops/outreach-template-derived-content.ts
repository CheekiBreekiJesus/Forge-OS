/**
 * Derived outreach copy for campaign templates.
 * Keeps default-templates.ts focused on layout while personalization logic stays testable here.
 */

const PT_CORE_CUP_PRODUCTS =
  "copos reutilizáveis de plástico personalizados e copos de papel personalizados";

const EN_CORE_CUP_PRODUCTS = "personalized reusable plastic cups and personalized paper cups";

const PT_CATEGORY_PRODUCT_EXTRAS: Record<string, string[]> = {
  Hospitality: [
    "embalagens take-away",
    "louça descartável sustentável",
    "palhinhas e talheres"
  ],
  "Event Company": [
    "copos descartáveis para eventos",
    "embalagens de catering",
    "sacos e acessórios de serviço"
  ],
  Municipality: [
    "copos para eventos e iniciativas locais",
    "embalagens alimentares",
    "sacos personalizados"
  ],
  Association: [
    "copos descartáveis para festas e encontros",
    "embalagens take-away",
    "talheres e acessórios"
  ],
  "Sports Club": [
    "copos para jogos e eventos",
    "embalagens take-away",
    "copos descartáveis"
  ],
  "Parish Council": [
    "copos para atividades locais",
    "embalagens alimentares",
    "sacos e acessórios"
  ],
  "Student Association": [
    "copos para festas académicas",
    "embalagens take-away",
    "copos descartáveis"
  ]
};

const EN_CATEGORY_PRODUCT_EXTRAS: Record<string, string[]> = {
  Hospitality: ["take-away packaging", "sustainable disposable tableware", "straws and cutlery"],
  "Event Company": ["disposable event cups", "catering packaging", "bags and service accessories"],
  Municipality: ["cups for local events", "food packaging", "personalized bags"],
  Association: ["disposable cups for gatherings", "take-away packaging", "cutlery and accessories"],
  "Sports Club": ["cups for matches and events", "take-away packaging", "disposable cups"],
  "Parish Council": ["cups for local activities", "food packaging", "bags and accessories"],
  "Student Association": [
    "cups for academic events",
    "take-away packaging",
    "disposable cups"
  ]
};

const PT_DEFAULT_EXTRAS = [
  "embalagens take-away",
  "louça descartável sustentável",
  "caixas para sopa, pizza e sushi",
  "bases e artigos para pastelaria"
];

const EN_DEFAULT_EXTRAS = [
  "take-away packaging",
  "sustainable disposable tableware",
  "soup, pizza and sushi boxes",
  "bakery bases and accessories"
];

export const PORTFOLIO_IMAGE_INTEGRATION_NOTE = `Portfolio banner served from /assets/email-outreach/jh-gomes/custom-cups-banner.png. Override portfolioImageUrl with a public HTTPS URL when a tenant uses a different campaign image.`;

export const DEFAULT_PORTFOLIO_IMAGE_ALT_PT =
  "Exemplos de copos reutilizáveis personalizados JH Gomes: 250 ml, 330 ml, 430 ml e 500 ml";

export const DEFAULT_PORTFOLIO_IMAGE_ALT_EN =
  "JH Gomes personalized reusable cup examples: 250 ml, 330 ml, 430 ml, and 500 ml";

export const DEFAULT_PORTFOLIO_PLAIN_TEXT_PT =
  "Formatos disponíveis: 250 ml, 330 ml, 430 ml e 500 ml.";

export const DEFAULT_PORTFOLIO_PLAIN_TEXT_EN =
  "Available sizes: 250 ml, 330 ml, 430 ml, and 500 ml.";

export const DEFAULT_PORTFOLIO_SUPPORTING_LINE_PT =
  "Disponibilizamos copos reutilizáveis em PP nos formatos de 250 ml, 330 ml, 430 ml e 500 ml, com personalização adaptada à identidade da sua marca.";

export const DEFAULT_PORTFOLIO_SUPPORTING_LINE_EN =
  "We supply reusable PP cups in 250 ml, 330 ml, 430 ml, and 500 ml sizes, customized to match your brand identity.";

export function buildPersonalizedIntro(input: {
  organizationDisplayName: string;
  localizedCategory: string;
  region: string;
  companySenderName: string;
  locale: string;
}): string {
  const { organizationDisplayName, localizedCategory, region, companySenderName, locale } = input;

  if (locale.startsWith("pt")) {
    if (organizationDisplayName && localizedCategory && region) {
      return `Escrevo-lhe no âmbito do contacto com a ${organizationDisplayName}. Trabalhamos com organizações de ${localizedCategory} na região de ${region} e pensámos que as soluções da ${companySenderName} poderiam ser úteis na vossa operação.`;
    }
    if (organizationDisplayName && localizedCategory) {
      return `Escrevo-lhe no âmbito do contacto com a ${organizationDisplayName}. Apoiamos regularmente organizações de ${localizedCategory} com consumíveis personalizados e embalagens para o dia-a-dia.`;
    }
    if (organizationDisplayName) {
      return `Escrevo-lhe no âmbito do contacto com a ${organizationDisplayName}. Na ${companySenderName} apoiamos equipas de restauração, eventos, catering e retalho alimentar com produtos personalizados.`;
    }
    return `Escrevo-lhe para apresentar as soluções de copos personalizados e embalagens que fornecemos a empresas de restauração, eventos, catering e organização de eventos.`;
  }

  if (organizationDisplayName && localizedCategory && region) {
    return `I am reaching out to ${organizationDisplayName}. We work with ${localizedCategory} organizations in ${region}, and ${companySenderName} may be able to support your operation.`;
  }
  if (organizationDisplayName && localizedCategory) {
    return `I am reaching out to ${organizationDisplayName}. We regularly support ${localizedCategory} teams with personalized consumables and packaging.`;
  }
  if (organizationDisplayName) {
    return `I am reaching out to ${organizationDisplayName}. At ${companySenderName}, we support hospitality, events, catering, and food-service teams.`;
  }
  return "I am reaching out to introduce personalized cups and packaging solutions for hospitality, events, and catering operations.";
}

export function buildRecommendedProducts(category: string, locale: string): string {
  const extras = locale.startsWith("pt")
    ? PT_CATEGORY_PRODUCT_EXTRAS[category] ?? PT_DEFAULT_EXTRAS
    : EN_CATEGORY_PRODUCT_EXTRAS[category] ?? EN_DEFAULT_EXTRAS;
  const core = locale.startsWith("pt") ? PT_CORE_CUP_PRODUCTS : EN_CORE_CUP_PRODUCTS;

  if (locale.startsWith("pt")) {
    return `Para o vosso contexto, destacamos ${core}, bem como ${formatPortugueseList(extras)}.`;
  }

  return `For your context, we would highlight ${core}, along with ${formatEnglishList(extras)}.`;
}

export function buildBroaderRangeLine(localizedCategory: string, locale: string): string {
  if (locale.startsWith("pt")) {
    if (localizedCategory) {
      return `Para além dos copos, fornecemos uma gama alargada de produtos para ${localizedCategory.toLowerCase()}: louça descartável sustentável, palhinhas, talheres, bases para pastelaria, embalagens take-away e caixas para sopa, pizza, sushi e outros alimentos.`;
    }
    return "Para além dos copos, fornecemos embalagens take-away, louça descartável sustentável, palhinhas, talheres, bases para pastelaria e soluções de embalagem alimentar.";
  }

  if (localizedCategory) {
    return `Beyond cups, we supply a wider range for ${localizedCategory.toLowerCase()}: sustainable disposable tableware, straws, cutlery, bakery bases, take-away packaging, and food boxes.`;
  }
  return "Beyond cups, we supply take-away packaging, sustainable disposable tableware, straws, cutlery, bakery bases, and food packaging.";
}

export function buildPortfolioImageAlt(locale: string): string {
  return locale.startsWith("pt") ? DEFAULT_PORTFOLIO_IMAGE_ALT_PT : DEFAULT_PORTFOLIO_IMAGE_ALT_EN;
}

export function buildPortfolioPlainTextLine(locale: string): string {
  return locale.startsWith("pt")
    ? DEFAULT_PORTFOLIO_PLAIN_TEXT_PT
    : DEFAULT_PORTFOLIO_PLAIN_TEXT_EN;
}

export function buildPortfolioSupportingLine(locale: string): string {
  return locale.startsWith("pt")
    ? DEFAULT_PORTFOLIO_SUPPORTING_LINE_PT
    : DEFAULT_PORTFOLIO_SUPPORTING_LINE_EN;
}

export function buildPortfolioImageLine(_imageUrl: string, _alt: string, locale: string): string {
  return buildPortfolioPlainTextLine(locale);
}

export function buildPortfolioImageHtml(
  imageUrl: string,
  alt: string,
  options?: { width?: number; previewUrl?: string }
): string {
  const deliveredUrl = imageUrl.trim();
  const previewUrl = options?.previewUrl?.trim() ?? "";
  const renderUrl = deliveredUrl || previewUrl;
  const safeAlt = escapeHtmlText(alt);
  const width = options?.width ?? 600;

  if (!renderUrl || !isRenderablePortfolioImageUrl(renderUrl)) {
    return "";
  }

  const safeUrl = escapeHtmlAttribute(renderUrl);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
  <tr>
    <td align="center">
      <img src="${safeUrl}" alt="${safeAlt}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;border-radius:8px;" />
    </td>
  </tr>
</table>`;
}

function isRenderablePortfolioImageUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return true;
    return (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return escapeHtmlAttribute(value);
}

function formatPortugueseList(items: string[]): string {
  const unique = [...new Set(items.filter(Boolean))];
  if (unique.length <= 1) {
    return unique[0] ?? "produtos complementares";
  }
  return `${unique.slice(0, -1).join(", ")} e ${unique[unique.length - 1]}`;
}

function formatEnglishList(items: string[]): string {
  const unique = [...new Set(items.filter(Boolean))];
  if (unique.length <= 1) {
    return unique[0] ?? "complementary products";
  }
  return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
}
