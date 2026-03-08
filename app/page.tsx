import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Page() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
  redirect("/login");
}
