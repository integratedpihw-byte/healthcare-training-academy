import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sky-50">
      <h1 className="text-2xl font-bold text-navy-900">Page not found</h1>
      <Link href="/dashboard" className="text-sm font-semibold text-teal-700 underline">Go to dashboard</Link>
    </main>
  );
}
