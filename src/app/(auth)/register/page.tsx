import Link from "next/link";
import { Card } from "@/components/ui";
import { RegisterOrgForm } from "./register-org-form";

export const metadata = { title: "Register your organization" };

export default function RegisterPage() {
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Register your organization</h1>
      <p className="mt-1 text-sm text-slate-600">
        Create an isolated workspace for your facility. A platform administrator reviews every new organization before activation.
      </p>
      <RegisterOrgForm />
      <p className="mt-6 text-sm text-slate-600">
        Individual healthcare professional or student? <Link className="font-semibold text-teal-700 hover:underline" href="/register/individual">Create a personal learner account</Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">Already registered? <Link className="font-semibold text-teal-700 underline" href="/login">Sign in</Link></p>
    </Card>
  );
}
