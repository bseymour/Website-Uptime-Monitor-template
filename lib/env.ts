/**
 * Environment variable validation and helpers.
 * Validates required environment variables at startup.
 */

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please check your .env file or Vercel project settings.`
    );
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Validates that all required environment variables are set.
 * Call this early in the application lifecycle (e.g., in a proxy or startup check).
 */
export function validateEnv(): void {
  // Only validate in production or when not bypassing auth
  if (process.env.BYPASS_AUTH !== "true") {
    getRequiredEnv("NEXT_PUBLIC_VERCEL_APP_CLIENT_ID");
    getRequiredEnv("VERCEL_APP_CLIENT_SECRET");
  }

  // Database is always required
  getRequiredEnv("DATABASE_URL");

  // ALLOWED_EMAILS is required unless bypassing auth
  if (process.env.BYPASS_AUTH !== "true") {
    const allowedEmails = getOptionalEnv("ALLOWED_EMAILS");
    if (!allowedEmails) {
      console.warn(
        "WARNING: ALLOWED_EMAILS is not set. All authenticated users will be allowed access."
      );
    }
  }
}

/**
 * Get validated environment variables with type safety.
 */
export const env = {
  databaseUrl: () => getRequiredEnv("DATABASE_URL"),
  vercelClientId: () => getOptionalEnv("NEXT_PUBLIC_VERCEL_APP_CLIENT_ID", ""),
  vercelClientSecret: () => getOptionalEnv("VERCEL_APP_CLIENT_SECRET", ""),
  allowedEmails: () => getOptionalEnv("ALLOWED_EMAILS", ""),
  cronSecret: () => getOptionalEnv("CRON_SECRET", ""),
  resendApiKey: () => getOptionalEnv("RESEND_API_KEY", ""),
  alertEmails: () => getOptionalEnv("ALERT_EMAILS", ""),
  alertFromEmail: () =>
    getOptionalEnv(
      "ALERT_FROM_EMAIL",
      "Uptime Monitor <onboarding@resend.dev>"
    ),
  bypassAuth: () => process.env.BYPASS_AUTH === "true",
} as const;
