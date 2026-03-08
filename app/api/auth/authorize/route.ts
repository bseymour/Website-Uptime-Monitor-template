import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Initiates the Sign In with Vercel OAuth flow.
 *
 * Generates PKCE code challenge, state, and nonce, stores them in
 * HTTP-only cookies, then redirects to Vercel's authorization endpoint.
 */

function generateSecureRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomBytes, (byte) => charset[byte % charset.length]).join(
    ""
  );
}

export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=missing_config", req.url)
    );
  }

  const state = generateSecureRandomString(43);
  const nonce = generateSecureRandomString(43);
  const code_verifier = crypto.randomBytes(43).toString("hex");
  const code_challenge = crypto
    .createHash("sha256")
    .update(code_verifier)
    .digest("base64url");

  const cookieStore = await cookies();

  cookieStore.set("oauth_state", state, {
    maxAge: 10 * 60,
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  });
  cookieStore.set("oauth_nonce", nonce, {
    maxAge: 10 * 60,
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  });
  cookieStore.set("oauth_code_verifier", code_verifier, {
    maxAge: 10 * 60,
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  });

  const queryParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${req.nextUrl.origin}/api/auth/callback`,
    state,
    nonce,
    code_challenge,
    code_challenge_method: "S256",
    response_type: "code",
    scope: "openid email",
  });

  const authorizationUrl = `https://vercel.com/oauth/authorize?${queryParams.toString()}`;

  return NextResponse.redirect(authorizationUrl);
}
