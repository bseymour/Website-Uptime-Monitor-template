"use client";

import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  no_code: "Authorization code was not provided.",
  missing_config:
    "OAuth is not configured. Set NEXT_PUBLIC_VERCEL_APP_CLIENT_ID and VERCEL_APP_CLIENT_SECRET.",
  state_mismatch: "Security validation failed (state mismatch). Please try again.",
  nonce_mismatch: "Security validation failed (nonce mismatch). Please try again.",
  token_exchange_failed: "Failed to exchange authorization code.",
  user_fetch_failed: "Failed to fetch user profile.",
  no_email: "No email associated with your Vercel account.",
  not_allowed: "Your email is not on the allowed list. Contact the admin.",
  unexpected: "An unexpected error occurred. Please try again.",
};

interface LoginCardProps {
  clientId: string;
  error?: string;
}

export function LoginCard({ clientId, error }: LoginCardProps) {
  const isConfigured = clientId.length > 0;

  function handleSignIn() {
    // Redirect to our server-side authorize route which handles PKCE and redirects to Vercel
    window.location.href = "/api/auth/authorize";
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Uptime Monitor
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your Vercel account to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {ERROR_MESSAGES[error] ?? "An error occurred."}
            </div>
          )}
          {!isConfigured && (
            <div className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              OAuth is not configured yet. Set the
              NEXT_PUBLIC_VERCEL_APP_CLIENT_ID environment variable to enable
              sign in.
            </div>
          )}
          <Button
            onClick={handleSignIn}
            disabled={!isConfigured}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            size="lg"
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 76 65"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            Sign In with Vercel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
