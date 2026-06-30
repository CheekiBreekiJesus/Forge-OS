import type {
  CompanyProfileSnapshot,
  SenderIdentitySnapshot
} from "@/domain/profile-types";
import type { ProductEmailSnapshot } from "@/domain/product-types";

export type EmailLink = {
  id: string;
  label: string;
  url: string;
  kind: "website" | "product" | "customizer" | "other";
};

export type EmailMediaBlock = {
  id: string;
  kind: "company-logo" | "product-image" | "cup-mockup" | "product-placeholder" | "customizer-card";
  label: string;
  altText: string;
  publicUrl: string | null;
  localAssetId: string | null;
  placeholderText: string;
};

export type EmailSignature = {
  plainText: string;
  html: string;
};

export type AIGeneratedCopy = {
  subject: string;
  preheader?: string;
  greeting: string;
  introduction: string;
  offerBody: string;
  callToAction: string;
  contextUsed: string[];
};

export type EmailComposition = {
  subject: string;
  preheader: string;
  greeting: string;
  introduction: string;
  offerBody: string;
  callToAction: string;
  links: EmailLink[];
  mediaBlocks: EmailMediaBlock[];
  signature: EmailSignature;
  legalFooter: string;
  plainText: string;
  html: string;
  provider: string;
  model: string;
  fallbackUsed: boolean;
  generatedAt: string;
  senderIdentityId: string | null;
  senderIdentitySnapshot: SenderIdentitySnapshot | null;
  companyProfileSnapshot: CompanyProfileSnapshot | null;
  selectedProductSnapshots: ProductEmailSnapshot[];
  localOnlyImageWarning: boolean;
};

export type ComposeEmailInput = {
  aiCopy: AIGeneratedCopy;
  locale: "pt-PT" | "en";
  companyProfile: CompanyProfileSnapshot;
  senderIdentity: SenderIdentitySnapshot;
  products: ProductEmailSnapshot[];
  provider: string;
  model: string;
  fallbackUsed: boolean;
  includeMedia?: EmailMediaBlock[];
  includeLinks?: EmailLink[];
};
