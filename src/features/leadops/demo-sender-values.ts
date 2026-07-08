export const DEMO_SENDER_EMAILS = ["joao.gomes@demo.local"] as const;
export const DEMO_SENDER_PHONES = ["+351 910 000 000", "+351910000000"] as const;
export const DEMO_SENDER_NAMES = ["João Gomes", "Joao Gomes"] as const;

export function normalizePhone(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

export function isDemoSenderEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return DEMO_SENDER_EMAILS.some((demo) => demo === normalized);
}

export function isDemoSenderPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return DEMO_SENDER_PHONES.some((demo) => normalizePhone(demo) === normalized);
}

export function isDemoSenderName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return DEMO_SENDER_NAMES.some((demo) => demo.toLowerCase() === normalized);
}

export function containsDemoSenderValues(parts: string[]): boolean {
  return parts.some((part) => {
    const value = part.trim();
    if (!value) return false;
    if (isDemoSenderEmail(value)) return true;
    if (isDemoSenderPhone(value)) return true;
    if (isDemoSenderName(value)) return true;
    return false;
  });
}
