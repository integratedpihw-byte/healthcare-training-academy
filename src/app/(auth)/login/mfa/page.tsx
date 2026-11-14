import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { Card } from "@/components/ui";
import { MfaForm } from "./mfa-form";

export const metadata = { title: "Two-step verification" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!ctx.user.mfaEnabled || ctx.session.mfaVerified) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Two-step verification</h1>
      <p className="mt-1 text-sm text-slate-600">Enter the 6-digit code from your authenticator app, or a recovery code.</p>
      <MfaForm next={next} />
    </Card>
  );
}
