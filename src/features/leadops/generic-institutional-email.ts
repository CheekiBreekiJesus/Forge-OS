const GENERIC_LOCAL_PARTS = new Set([
  "geral",
  "info",
  "contacto",
  "contact",
  "secretaria",
  "administracao",
  "administracao",
  "municipio",
  "camara",
  "eventos",
  "comercial",
  "atendimento"
]);

export function isGenericInstitutionalEmail(email: string | null | undefined): boolean {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized.includes("@")) return false;
  const localPart = normalized.split("@")[0]?.replace(/\./g, "") ?? "";
  if (!localPart) return false;
  if (GENERIC_LOCAL_PARTS.has(localPart)) return true;
  return GENERIC_LOCAL_PARTS.has(localPart.replace(/[^a-z0-9]/g, ""));
}
