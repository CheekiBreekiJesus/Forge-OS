import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { ProductEmailSnapshot } from "@/domain/product-types";
import type {
  ComposeEmailInput,
  EmailComposition,
  EmailLink,
  EmailMediaBlock
} from "./types";
import { renderLegalFooter, renderSignature } from "./signature";
import { plainTextToHtml, sanitizeEmailHtml } from "./sanitize";
import { isEmbeddableImageUrl, isValidHttpsUrl } from "./url-utils";

const PLACEHOLDERS = {
  "pt-PT": {
    productImage: "[Imagem do produto]",
    cupMockup: "[Mockup do copo personalizado]",
    companyLogo: "[Logótipo da empresa]"
  },
  en: {
    productImage: "[Product image]",
    cupMockup: "[Personalized cup mockup]",
    companyLogo: "[Company logo]"
  }
} as const;

export function buildTrustedLinks(
  company: CompanyProfileSnapshot,
  products: ProductEmailSnapshot[],
  locale: "pt-PT" | "en"
): EmailLink[] {
  const links: EmailLink[] = [];
  if (company.websiteUrl && isValidHttpsUrl(company.websiteUrl)) {
    links.push({
      id: "website",
      kind: "website",
      label: locale === "pt-PT" ? "Website" : "Website",
      url: company.websiteUrl
    });
  }
  for (const product of products) {
    if (product.productPageUrl && isValidHttpsUrl(product.productPageUrl)) {
      links.push({
        id: `product-${product.id}`,
        kind: "product",
        label: product.defaultCtaLabel || product.emailTitle || product.name,
        url: product.productPageUrl
      });
    }
    if (product.customizerUrl && isValidHttpsUrl(product.customizerUrl)) {
      links.push({
        id: `customizer-${product.id}`,
        kind: "customizer",
        label:
          locale === "pt-PT"
            ? `Personalizar ${product.name}`
            : `Customize ${product.name}`,
        url: product.customizerUrl
      });
    }
  }
  return links;
}

export function buildDefaultMediaBlocks(
  company: CompanyProfileSnapshot,
  products: ProductEmailSnapshot[],
  locale: "pt-PT" | "en"
): EmailMediaBlock[] {
  const ph = PLACEHOLDERS[locale];
  const blocks: EmailMediaBlock[] = [];

  const logoUrl =
    company.logoPublicUrl && isEmbeddableImageUrl(company.logoPublicUrl)
      ? company.logoPublicUrl
      : null;

  blocks.push({
    id: "company-logo",
    altText: company.tradingName || company.legalName,
    kind: "company-logo",
    label: ph.companyLogo,
    localAssetId: company.logoLocalAssetId,
    placeholderText: ph.companyLogo,
    publicUrl: logoUrl
  });

  for (const product of products) {
    const imgUrl =
      product.imageUrl && isEmbeddableImageUrl(product.imageUrl)
        ? product.imageUrl
        : product.thumbnailUrl && isEmbeddableImageUrl(product.thumbnailUrl)
          ? product.thumbnailUrl
          : null;

    blocks.push({
      id: `product-image-${product.id}`,
      altText: product.emailTitle || product.name,
      kind: "product-image",
      label: ph.productImage,
      localAssetId: null,
      placeholderText: ph.productImage,
      publicUrl: imgUrl
    });
  }

  return blocks;
}

function renderMediaBlockPlain(block: EmailMediaBlock): string {
  if (block.publicUrl) {
    return `${block.label}: ${block.publicUrl}`;
  }
  return block.placeholderText;
}

function renderMediaBlockHtml(block: EmailMediaBlock): string {
  if (block.publicUrl) {
    return `<p><img src="${block.publicUrl}" alt="${block.altText}" style="max-width:320px;height:auto;" /></p>`;
  }
  return `<p><em>${block.placeholderText}</em></p>`;
}

function renderLinksPlain(links: EmailLink[]): string {
  if (links.length === 0) return "";
  return links.map((l) => `${l.label}: ${l.url}`).join("\n");
}

function renderLinksHtml(links: EmailLink[]): string {
  if (links.length === 0) return "";
  return `<ul>${links.map((l) => `<li><a href="${l.url}" rel="noopener noreferrer" target="_blank">${l.label}</a></li>`).join("")}</ul>`;
}

export function composeEmail(input: ComposeEmailInput): EmailComposition {
  const { aiCopy, locale, companyProfile, senderIdentity, products, provider, model, fallbackUsed } =
    input;

  const links = input.includeLinks ?? buildTrustedLinks(companyProfile, products, locale);
  const mediaBlocks =
    input.includeMedia ?? buildDefaultMediaBlocks(companyProfile, products, locale);

  const localOnlyImageWarning = mediaBlocks.some(
    (b) => !b.publicUrl && (b.localAssetId || b.kind !== "product-placeholder")
  );

  const signature = renderSignature(senderIdentity, companyProfile, locale);
  const legalFooter = renderLegalFooter(companyProfile);

  const bodyParts = [
    aiCopy.greeting,
    aiCopy.introduction,
    aiCopy.offerBody,
    aiCopy.callToAction
  ].filter(Boolean);

  const mediaPlain = mediaBlocks.map(renderMediaBlockPlain).join("\n");
  const linksPlain = renderLinksPlain(links);

  const plainSections = [
    bodyParts.join("\n\n"),
    mediaPlain,
    linksPlain,
    signature.plainText,
    legalFooter
  ].filter((s) => s.trim());

  const plainText = plainSections.join("\n\n");

  const htmlBody = [
    ...bodyParts.map((p) => plainTextToHtml(p)),
    ...mediaBlocks.map(renderMediaBlockHtml),
    renderLinksHtml(links),
    `<p>${signature.html}</p>`,
    legalFooter ? `<p style="font-size:11px;color:#666;">${legalFooter}</p>` : ""
  ]
    .filter(Boolean)
    .join("");

  const html = sanitizeEmailHtml(htmlBody);

  return {
    callToAction: aiCopy.callToAction,
    companyProfileSnapshot: companyProfile,
    fallbackUsed,
    generatedAt: new Date().toISOString(),
    greeting: aiCopy.greeting,
    html,
    introduction: aiCopy.introduction,
    legalFooter,
    links,
    localOnlyImageWarning,
    mediaBlocks,
    model,
    offerBody: aiCopy.offerBody,
    plainText,
    preheader: aiCopy.preheader ?? "",
    provider,
    selectedProductSnapshots: products,
    senderIdentityId: senderIdentity.id,
    senderIdentitySnapshot: senderIdentity,
    signature,
    subject: aiCopy.subject
  };
}

export function snapshotCompanyProfile(
  profile: CompanyProfileSnapshot
): CompanyProfileSnapshot {
  return { ...profile };
}

export function snapshotSenderIdentity(
  identity: SenderIdentitySnapshot
): SenderIdentitySnapshot {
  return { ...identity };
}

export function snapshotProducts(products: ProductEmailSnapshot[]): ProductEmailSnapshot[] {
  return products.map((p) => ({ ...p }));
}
