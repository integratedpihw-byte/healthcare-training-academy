import Link from "next/link";
import { Logo } from "@/components/ui";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Logo withName />
        <h1 className="mt-6 text-xl font-bold text-navy-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-700">The page may have been moved, or the link may be incomplete.</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/dashboard" className="text-teal-700 underline">Go to dashboard</Link>
          <Link href="/help" className="text-teal-700 underline">Help</Link>
        </div>
      </div>
    </main>
  );
}
