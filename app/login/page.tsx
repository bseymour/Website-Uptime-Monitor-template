import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginCard } from "@/components/login-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID ?? "";

  return <LoginCard clientId={clientId} error={error} />;
}
