export type CompanyProfile = {
  id: string;
  tenantId: string;
  legalName: string;
  tradingName: string;
  vatNumber: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  websiteUrl: string;
  generalEmail: string;
  generalPhone: string;
  logoLocalAssetId: string | null;
  logoPublicUrl: string;
  defaultLanguage: "pt-PT" | "en";
  defaultCurrency: string;
  legalFooter: string;
  linkedinUrl: string;
  facebookUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanyProfileInput = Omit<
  CompanyProfile,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export type UpdateCompanyProfileInput = Partial<CreateCompanyProfileInput>;

export type UserProfile = {
  id: string;
  tenantId: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  profileImageLocalAssetId: string | null;
  preferredLanguage: "pt-PT" | "en";
  role: string;
  active: boolean;
  isLocalPreview: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserProfileInput = Omit<
  UserProfile,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export type UpdateUserProfileInput = Partial<
  Omit<CreateUserProfileInput, "isLocalPreview">
>;

export type SenderIdentity = {
  id: string;
  tenantId: string;
  userProfileId: string;
  companyProfileId: string;
  displayName: string;
  jobTitle: string;
  fromEmail: string;
  replyToEmail: string;
  phone: string;
  signatureText: string;
  signatureHtml: string;
  defaultLanguage: "pt-PT" | "en";
  isDefault: boolean;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSenderIdentityInput = Omit<
  SenderIdentity,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt"
>;

export type UpdateSenderIdentityInput = Partial<
  Omit<CreateSenderIdentityInput, "userProfileId" | "companyProfileId">
>;

export type LocalAssetType = "logo" | "profile-image" | "product-image" | "other";

export type LocalAsset = {
  id: string;
  tenantId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
  assetType: LocalAssetType;
  createdAt: string;
};

export type CreateLocalAssetInput = Omit<LocalAsset, "id" | "tenantId" | "createdAt">;

/** Snapshot types stored on approved emails. */
export type CompanyProfileSnapshot = Omit<CompanyProfile, "createdAt" | "updatedAt">;
export type SenderIdentitySnapshot = Omit<
  SenderIdentity,
  "createdAt" | "updatedAt" | "archivedAt"
>;
export type UserProfileSnapshot = Omit<UserProfile, "createdAt" | "updatedAt">;
