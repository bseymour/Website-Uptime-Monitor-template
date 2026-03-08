import { cookies } from "next/headers";
import type { UserSession } from "./types";

/**
 * Authentication helpers for Sign In with Vercel.
 *
 * Uses a simple session cookie containing the user's email, name, and avatar.
 * The ALLOWED_EMAILS environment variable controls which accounts can access the app.
 *
 * Setup:
 * 1. Create an App in Vercel Dashboard > Settings > OAuth Apps
 * 2. Set NEXT_PUBLIC_VERCEL_APP_CLIENT_ID and VERCEL_APP_CLIENT_SECRET env vars
 * 3. Set ALLOWED_EMAILS as a comma-separated list (e.g. "alice@example.com,bob@example.com")
 */

const SESSION_COOKIE = "uptime_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string): boolean {
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return true; // If no whitelist, allow all
  return allowed.includes(email.toLowerCase());
}

/**
 * Encode session data and set it as an HTTP-only cookie.
 */
export async function setSession(user: UserSession): Promise<void> {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(user)).toString("base64");
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Read the current user session from cookies.
 * Returns null if not authenticated.
 *
 * In development (or when BYPASS_AUTH=true), returns a mock session
 * so you can preview the dashboard without a working OAuth flow.
 */
export async function getSession(): Promise<UserSession | null> {
  if (process.env.BYPASS_AUTH === "true") {
    return {
      email: process.env.ALLOWED_EMAILS?.split(",")[0]?.trim() ?? "dev@localhost",
      name: "Dev User",
      avatar_url: null,
    };
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;

  try {
    const decoded = Buffer.from(cookie.value, "base64").toString("utf-8");
    return JSON.parse(decoded) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (sign out).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Require authentication. Returns the session or throws a redirect.
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
