import { z } from "zod";

export const TenantRoleSchema = z.enum([
  "director",
  "production_manager",
  "warehouse_operator",
  "sales",
  "admin",
]);

export type TenantRole = z.infer<typeof TenantRoleSchema>;

export const TenantSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  defaultLocale: z.enum(["pt-PT", "en", "es-ES"]),
});

export type Tenant = z.infer<typeof TenantSchema>;

/** Demo tenant for JH Gomes pilot UI. */
export const DEMO_TENANT: Tenant = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "jh-gomes",
  name: "JH Gomes",
  defaultLocale: "pt-PT",
};

export const DEMO_USER = {
  id: "00000000-0000-4000-8000-000000000010",
  name: "João Gomes",
  role: "director" as TenantRole,
  roleLabelKey: "director_general",
};
