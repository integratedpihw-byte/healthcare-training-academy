import Link from "next/link";
import { Card } from "@/components/ui";
import { RegisterIndividualForm } from "./form";

export const metadata = { title: "Create a learner account" };

export default function Page() {
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Create a personal learner account</h1>
      <p className="mt-1 text-sm text-slate-600">For individual healthcare professionals, students and independent learners.</p>
      <RegisterIndividualForm />
      <p className="mt-6 text-sm text-slate-600">Registering a facility? <Link className="text-teal-700 hover:underline" href="/register">Register an organization</Link></p>
    </Card>
  );
}
