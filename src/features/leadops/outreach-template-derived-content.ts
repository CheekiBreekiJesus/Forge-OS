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

export const PORTFOLIO_IMAGE_INTEGRATION_NOTE = `Cup Customizer integration: replace portfolioImageUrl with a public HTTPS URL exported from a CustomizerSimulation mockupAssetId. Until then, the renderer shows a text placeholder when the URL is empty.`;

export const DEFAULT_PORTFOLIO_IMAGE_ALT_PT =
  "Exemplo de copo personalizado JH Gomes";

export const DEFAULT_PORTFOLIO_IMAGE_ALT_EN = "JH Gomes personalized cup sample";

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

export function buildPortfolioImageLine(imageUrl: string, alt: string, locale: string): string {
  if (imageUrl.trim()) {
    return locale.startsWith("pt")
      ? `Exemplo de produto: ${imageUrl}`
      : `Product sample: ${imageUrl}`;
  }

  return locale.startsWith("pt") ? `[${alt}]` : `[${alt}]`;
}

export function buildPortfolioImageHtml(imageUrl: string, alt: string): string {
  if (imageUrl.trim()) {
    return `<img src="${imageUrl}" alt="${alt}" style="max-width:320px;height:auto;border-radius:8px;" />`;
  }

  return `<em>${alt}</em>`;
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
