import { neon } from "@neondatabase/serverless";

/**
 * Create a SQL client for querying the Neon database.
 * Uses the DATABASE_URL environment variable.
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Please connect a Neon database."
    );
  }
  return neon(databaseUrl);
}
