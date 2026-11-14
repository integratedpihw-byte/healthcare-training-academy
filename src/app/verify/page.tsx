import { redirect } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";

async function lookup(fd: FormData) {
  "use server";
  const code = String(fd.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  redirect(`/verify/${encodeURIComponent(code || "-")}`);
}

export default function VerifyPage() {
  return (
    <Card>
      <h1 className="text-xl font-bold text-navy-900">Verify a certificate</h1>
      <p className="mt-1 text-sm text-slate-600">Enter the 10-character verification code printed on the certificate, or scan its QR code.</p>
      <form action={lookup} className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1"><Field label="Verification code" name="code"><Input id="code" name="code" maxLength={14} autoComplete="off" required className="font-mono uppercase tracking-widest" /></Field></div>
        <Button type="submit">Verify</Button>
      </form>
    </Card>
  );
}
