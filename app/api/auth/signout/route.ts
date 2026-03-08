import { cookies } from "next/headers";
import { clearSession } from "@/lib/auth";

/**
 * Sign out route handler.
 * Revokes the Vercel access token and clears all auth cookies.
 */
export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  // Revoke the access token with Vercel if we have one
  if (accessToken) {
    const credentials = `${process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID}:${process.env.VERCEL_APP_CLIENT_SECRET}`;
    try {
      await fetch("https://api.vercel.com/login/oauth/token/revoke", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
        },
        body: new URLSearchParams({ token: accessToken }),
      });
    } catch (error) {
      console.error("Error revoking token:", error);
    }
  }

  // Clear all auth cookies
  await clearSession();
  cookieStore.set("access_token", "", { maxAge: 0 });

  return Response.json({ success: true });
}
