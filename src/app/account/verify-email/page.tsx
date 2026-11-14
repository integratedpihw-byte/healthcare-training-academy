import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { resendVerificationAction } from "@/app/(auth)/actions";
import { Alert, Card } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Confirm your email" };

export default async function VerifyEmailPrompt({ searchParams }: { searchParams: Promise<{ sent?: string; throttled?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.user.emailVerified) redirect("/dashboard");
  const sp = await searchParams;
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Confirm your email address</h1>
      <p className="mt-2 text-sm text-slate-700">We sent a confirmation link to <strong>{ctx.user.email}</strong>. Open it to finish setting up your account. The link works for 48 hours.</p>
      <div className="mt-4 space-y-3">
        {sp.sent && <Alert tone="green">Confirmation email sent. Check your inbox and spam folder.</Alert>}
        {sp.throttled && <Alert tone="amber">Too many emails were requested. Please wait an hour and try again.</Alert>}
      </div>
      <form action={resendVerificationAction} className="mt-5">
        <SubmitButton variant="secondary" pendingText="Sending…">Send the link again</SubmitButton>
      </form>
      <p className="mt-5 text-xs text-slate-600">Wrong address? Sign out and register again with the correct one.</p>
    </Card>
  );
}
