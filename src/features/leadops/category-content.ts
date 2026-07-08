import { formatOrganizationDisplayName } from "@/features/leadops/organization-display";

export function buildCategoryContentLine(
  category: string,
  organizationName: string,
  organizationDisplayNameOverride: string | undefined,
  locale: string
): string {
  const organizationDisplayName =
    organizationDisplayNameOverride?.trim() ||
    formatOrganizationDisplayName(organizationName, category, locale);

  if (!organizationDisplayName && !category.trim()) return "";

  if (locale.startsWith("pt")) {
    return buildPtCategoryLine(category, organizationDisplayName);
  }

  return buildEnCategoryLine(category, organizationDisplayName);
}

function buildPtCategoryLine(category: string, organizationDisplayName: string): string {
  switch (category) {
    case "Municipality":
      return `Considerando as atividades promovidas pelo ${organizationDisplayName}, acreditamos que os nossos copos personalizados poderão ser uma solução adequada para eventos e iniciativas organizadas pelo município ou pelas entidades locais com as quais colabora.`;
    case "Event Company":
      return "Os nossos copos personalizados podem ser adaptados à identidade visual e às necessidades dos eventos que a vossa empresa organiza.";
    case "Association":
      return "Esta solução poderá ser adequada para festas, encontros, angariações de fundos e outras iniciativas promovidas pela associação.";
    case "Sports Club":
      return "Os copos personalizados poderão ser utilizados em jogos, torneios, eventos e iniciativas do clube.";
    case "Hospitality":
      return "Disponibilizamos copos personalizados adequados para restauração, esplanadas, eventos e serviços de bebidas.";
    case "Parish Council":
      return `Considerando as iniciativas promovidas pela ${organizationDisplayName}, os nossos copos personalizados podem apoiar eventos e atividades locais.`;
    case "Student Association":
      return "Os copos personalizados podem ser úteis em festas académicas, eventos e iniciativas promovidas pela associação de estudantes.";
    default:
      if (organizationDisplayName) {
        return `Acreditamos que os nossos copos personalizados podem ser relevantes para a ${organizationDisplayName}.`;
      }
      return "Acreditamos que os nossos copos personalizados podem ser relevantes para a vossa organização.";
  }
}

function buildEnCategoryLine(category: string, organizationDisplayName: string): string {
  switch (category) {
    case "Municipality":
      return `Considering activities promoted by ${organizationDisplayName}, we believe our personalized cups may suit events and initiatives organised by the municipality or local partners.`;
    case "Event Company":
      return "Our personalized cups can be adapted to the visual identity and needs of the events your company organises.";
    case "Association":
      return "This solution may suit parties, gatherings, fundraising, and other association initiatives.";
    case "Sports Club":
      return "Personalized cups may be used at matches, tournaments, events, and club initiatives.";
    case "Hospitality":
      return "We supply personalized cups suitable for restaurants, terraces, events, and beverage service.";
    case "Parish Council":
      return `Considering initiatives promoted by ${organizationDisplayName}, our personalized cups can support local events and activities.`;
    case "Student Association":
      return "Personalized cups can support academic events and student association initiatives.";
    default:
      if (organizationDisplayName) {
        return `We believe our personalized cups may be relevant for ${organizationDisplayName}.`;
      }
      return "We believe our personalized cups may be relevant for your organisation.";
  }
}
