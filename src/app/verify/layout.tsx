import Link from "next/link";
import { Logo } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify a certificate" };

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4"><Link href="/"><Logo /></Link></header>
      <main id="main" className="mx-auto max-w-2xl px-4 py-10">{children}</main>
    </div>
  );
}
