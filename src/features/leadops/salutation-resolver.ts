import { isGenericInstitutionalEmail } from "@/features/leadops/generic-institutional-email";

export type ContactSalutation = "male" | "female" | "unknown";

export type SalutationResolverInput = {
  contactName: string;
  organizationName: string;
  email?: string;
  salutationOverride?: string;
  contactSalutation?: ContactSalutation;
  locale: string;
};

export type SalutationResolverResult = {
  greeting: string;
  resolvedContactName: string;
  usedInstitutionalFallback: boolean;
  treatedContactAsUnnamed: boolean;
};

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string): string {
  return normalize(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isGenuineContactName(contactName: string, organizationName: string): boolean {
  const contact = normalize(contactName);
  if (!contact) return false;

  const org = normalize(organizationName);
  if (org && normalizeKey(contact) === normalizeKey(org)) return false;

  if (org && normalizeKey(contact).includes(normalizeKey(org)) && contact.length <= org.length + 4) {
    return false;
  }

  if (org && normalizeKey(org).includes(normalizeKey(contact)) && contact.length < org.length) {
    return false;
  }

  return true;
}

export function resolveSalutation(input: SalutationResolverInput): SalutationResolverResult {
  const locale = input.locale;
  const organizationName = normalize(input.organizationName);
  const rawContact = normalize(input.contactName);
  const override = normalize(input.salutationOverride ?? "");

  if (override) {
    return {
      greeting: override.endsWith(",") ? override : `${override},`,
      resolvedContactName: isGenuineContactName(rawContact, organizationName) ? rawContact : "",
      usedInstitutionalFallback: false,
      treatedContactAsUnnamed: !isGenuineContactName(rawContact, organizationName)
    };
  }

  const genericEmail = isGenericInstitutionalEmail(input.email);
  const hasGenuineContact =
    isGenuineContactName(rawContact, organizationName) && !genericEmail;

  if (!hasGenuineContact) {
    return {
      greeting: locale.startsWith("pt") ? "Exmos. Senhores," : "Dear Sir or Madam,",
      resolvedContactName: "",
      usedInstitutionalFallback: true,
      treatedContactAsUnnamed: true
    };
  }

  const salutation = input.contactSalutation ?? "unknown";
  if (locale.startsWith("pt")) {
    if (salutation === "male") {
      return {
        greeting: `Exmo. Senhor ${rawContact},`,
        resolvedContactName: rawContact,
        usedInstitutionalFallback: false,
        treatedContactAsUnnamed: false
      };
    }
    if (salutation === "female") {
      return {
        greeting: `Exma. Senhora ${rawContact},`,
        resolvedContactName: rawContact,
        usedInstitutionalFallback: false,
        treatedContactAsUnnamed: false
      };
    }
    return {
      greeting: `Exmo(a). Senhor(a) ${rawContact},`,
      resolvedContactName: rawContact,
      usedInstitutionalFallback: false,
      treatedContactAsUnnamed: false
    };
  }

  if (salutation === "male") {
    return { greeting: `Dear Mr ${rawContact},`, resolvedContactName: rawContact, usedInstitutionalFallback: false, treatedContactAsUnnamed: false };
  }
  if (salutation === "female") {
    return { greeting: `Dear Ms ${rawContact},`, resolvedContactName: rawContact, usedInstitutionalFallback: false, treatedContactAsUnnamed: false };
  }
  return {
    greeting: `Dear ${rawContact},`,
    resolvedContactName: rawContact,
    usedInstitutionalFallback: false,
    treatedContactAsUnnamed: false
  };
}
