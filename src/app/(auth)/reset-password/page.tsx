import Link from "next/link";
import { Alert, Card } from "@/components/ui";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Choose a new password</h1>
      {token ? <ResetForm token={token} /> : (
        <div className="mt-4"><Alert>This reset link is missing its token. <Link className="underline" href="/forgot-password">Request a new link</Link>.</Alert></div>
      )}
    </Card>
  );
}
