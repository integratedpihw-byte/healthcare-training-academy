import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { Alert, Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = await getAuthContext();
  if (ctx && (!ctx.user.mfaEnabled || ctx.session.mfaVerified)) redirect("/dashboard");
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">Access your training and administration workspace.</p>
      <div className="mt-4 space-y-3">
        {sp.reset && <Alert tone="green">Your password was reset. Sign in with your new password.</Alert>}
        {sp.signedOut && <Alert tone="blue">You have been signed out.</Alert>}
      </div>
      <LoginForm next={sp.next} />
      <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
        <Link className="text-teal-700 hover:underline" href="/forgot-password">Forgot password?</Link>
        <span className="text-slate-600">New here? <Link className="font-semibold text-teal-700 hover:underline" href="/register">Register an organization</Link></span>
      </div>
    </Card>
  );
}
