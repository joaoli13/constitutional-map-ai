import {neon} from "@neondatabase/serverless";

let cachedSql: ReturnType<typeof neon> | null = null;

export function getNeonSql() {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error("NEON_DATABASE_URL is not configured.");
  }

  if (!cachedSql) {
    cachedSql = neon(connectionString);
  }

  return cachedSql;
}
