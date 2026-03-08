import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { setSession, isEmailAllowed } from "@/lib/auth";

/**
 * OAuth callback handler for Sign In with Vercel (PKCE flow).
 * Based on the official Vercel reference implementation.
 */

interface TokenData {
  access_token: string;
  token_type: string;
  id_token: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return Response.redirect(new URL("/login?error=unexpected", request.url));
  }

  if (!code) {
    return Response.redirect(new URL("/login?error=no_code", request.url));
  }

  // Read stored PKCE / state / nonce cookies
  const storedState = request.cookies.get("oauth_state")?.value;
  const storedNonce = request.cookies.get("oauth_nonce")?.value;
  const codeVerifier = request.cookies.get("oauth_code_verifier")?.value;

  // Validate state to prevent CSRF
  if (!state || !storedState || state !== storedState) {
    return Response.redirect(new URL("/login?error=state_mismatch", request.url));
  }

  // Validate required environment variables
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing OAuth configuration: NEXT_PUBLIC_VERCEL_APP_CLIENT_ID or VERCEL_APP_CLIENT_SECRET");
    return Response.redirect(new URL("/login?error=missing_config", request.url));
  }

  // Exchange code for tokens
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier ?? "",
    redirect_uri: `${request.nextUrl.origin}/api/auth/callback`,
  });

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(
      "https://api.vercel.com/login/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody,
      },
    );
  } catch (error) {
    console.error("Failed to exchange OAuth code:", error);
    return Response.redirect(new URL("/login?error=token_exchange_failed", request.url));
  }

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text().catch(() => "Unknown error");
    console.error("OAuth token exchange failed:", errorText);
    return Response.redirect(new URL("/login?error=token_exchange_failed", request.url));
  }

  let tokenData: TokenData;
  try {
    tokenData = await tokenResponse.json();
  } catch (error) {
    console.error("Failed to parse token response:", error);
    return Response.redirect(new URL("/login?error=token_exchange_failed", request.url));
  }

  // Validate nonce from id_token
  if (tokenData.id_token && storedNonce) {
    try {
      const payload = tokenData.id_token.split(".")[1];
      const decoded = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf-8"),
      );
      if (decoded.nonce !== storedNonce) {
        return Response.redirect(new URL("/login?error=nonce_mismatch", request.url));
      }
    } catch {
      // If we can't decode the id_token, skip nonce validation
    }
  }

  // Fetch user info
  let userInfoResponse: Response;
  try {
    userInfoResponse = await fetch(
      "https://api.vercel.com/login/oauth/userinfo",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return Response.redirect(new URL("/login?error=user_fetch_failed", request.url));
  }

  if (!userInfoResponse.ok) {
    const errorText = await userInfoResponse.text().catch(() => "Unknown error");
    console.error("User info fetch failed:", errorText);
    return Response.redirect(new URL("/login?error=user_fetch_failed", request.url));
  }

  let userInfo: any;
  try {
    userInfo = await userInfoResponse.json();
  } catch (error) {
    console.error("Failed to parse user info response:", error);
    return Response.redirect(new URL("/login?error=user_fetch_failed", request.url));
  }

  const email: string | undefined = userInfo.email;
  const name: string = userInfo.name || userInfo.preferred_username || "User";
  const avatarUrl: string | null = userInfo.picture || null;

  if (!email) {
    return Response.redirect(new URL("/login?error=no_email", request.url));
  }

  // Check whitelist
  if (!isEmailAllowed(email)) {
    return Response.redirect(new URL("/login?error=not_allowed", request.url));
  }

  // Set our app session cookie
  await setSession({ email, name, avatar_url: avatarUrl });

  // Store access_token for token revocation on sign out
  const cookieStore = await cookies();
  cookieStore.set("access_token", tokenData.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: tokenData.expires_in,
    path: "/",
  });

  // Clear OAuth flow cookies
  cookieStore.set("oauth_state", "", { maxAge: 0 });
  cookieStore.set("oauth_nonce", "", { maxAge: 0 });
  cookieStore.set("oauth_code_verifier", "", { maxAge: 0 });

  return Response.redirect(new URL("/dashboard", request.url));
}


