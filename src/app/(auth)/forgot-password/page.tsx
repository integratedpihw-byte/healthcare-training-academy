import Link from "next/link";
import { Card } from "@/components/ui";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-600">We will email you a secure link to choose a new password.</p>
      <ForgotForm />
      <p className="mt-6 text-sm"><Link className="text-teal-700 hover:underline" href="/login">Back to sign in</Link></p>
    </Card>
  );
}
