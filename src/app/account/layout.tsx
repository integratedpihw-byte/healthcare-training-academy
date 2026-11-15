import Link from "next/link";
import { Logo } from "@/components/ui";
import { logoutAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sky-50">
      <header className="flex items-center justify-between bg-navy-900 px-6 py-3">
        <Link href="/"><Logo light withName /></Link>
        <form action={logoutAction}><button type="submit" className="text-sm text-white hover:underline">Sign out</button></form>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 py-12">{children}</main>
    </div>
  );
}
