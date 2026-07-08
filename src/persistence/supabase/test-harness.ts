import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

export async function applySupabaseMigrations(connectionString: string): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query(sql);
    }

    const seedPath = path.join(process.cwd(), "supabase", "seed", "outreach_integration.sql");
    const seed = await readFile(seedPath, "utf8");
    await client.query(seed);
  } finally {
    await client.end();
  }
}

export async function resetPublicSchema(connectionString: string): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("drop schema if exists public cascade; create schema public;");
    await client.query("create extension if not exists pgcrypto;");
  } finally {
    await client.end();
  }
}

export function readIntegrationDatabaseUrl(): string | null {
  return process.env.FORGEOS_TEST_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || null;
}
