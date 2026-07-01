/** Lead import batch and staging types for Email Outreach MVP Step 1. */

export type ImportBatchStatus = "pending" | "preview" | "completed" | "failed";

export type ImportFieldKey =
  | "companyName"
  | "contactName"
  | "email"
  | "phone"
  | "website"
  | "region"
  | "country"
  | "industry"
  | "notes"
  | "sourceDatabase"
  | "status"
  | "language";

export type ImportFieldMapping = Partial<Record<ImportFieldKey, string>>;

export type ImportBatch = {
  id: string;
  tenantId: string;
  filename: string;
  fileType: "csv" | "xlsx";
  source: string;
  fileFingerprint: string;
  mapping: ImportFieldMapping;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  possibleDuplicateRows: number;
  missingEmailRows: number;
  importedOrganizations: number;
  importedContacts: number;
  skippedRows: number;
  createdAt: string;
  completedAt: string | null;
};

export type ImportRowAction =
  | "create_organization"
  | "create_contact"
  | "attach_to_existing"
  | "skip_duplicate"
  | "skip_invalid"
  | "review";

export type ImportRowStatus =
  | "valid"
  | "invalid"
  | "duplicate"
  | "possible_duplicate"
  | "missing_email"
  | "review";

export type DuplicateMatchKind = "contact_email" | "organization_strong" | "organization_possible";

export type ImportDuplicateMatch = {
  kind: DuplicateMatchKind;
  existingLeadId: string;
  existingContactId?: string;
  reason: string;
};

export type ImportRowValues = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  region: string;
  country: string;
  industry: string;
  notes: string;
  sourceDatabase: string;
  status: string;
  language: string;
};

export type ImportRow = {
  id: string;
  tenantId: string;
  importBatchId: string;
  rowIndex: number;
  originalValues: ImportRowValues;
  normalizedValues: ImportRowValues;
  validationErrors: string[];
  warnings: string[];
  duplicateMatches: ImportDuplicateMatch[];
  proposedAction: ImportRowAction;
  status: ImportRowStatus;
  resultLeadId: string | null;
  resultContactId: string | null;
  createdAt: string;
};

export type LeadContactEmailStatus = "unknown" | "valid_syntax" | "missing" | "duplicate";

export type LeadContact = {
  id: string;
  tenantId: string;
  leadId: string;
  name: string;
  normalizedEmail: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
  emailStatus: LeadContactEmailStatus;
  lastContactedAt: string | null;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadContactInput = Omit<
  LeadContact,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "active" | "archivedAt" | "archivedBy" | "archiveReason"
>;

export type CreateImportBatchInput = Omit<
  ImportBatch,
  "id" | "tenantId" | "createdAt" | "completedAt" | "status"
> & { status?: ImportBatchStatus };
