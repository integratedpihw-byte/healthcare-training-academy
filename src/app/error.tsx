"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Shown when a page fails unexpectedly. Details stay in server logs; the reference lets support find them. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="flex min-h-[70vh] items-center justify-center bg-sky-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm" role="alert">
        <h1 className="text-xl font-bold text-navy-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-700">The page could not be loaded. Your saved work is not affected. Try again, and if it keeps happening, contact support with the reference below.</p>
        {error.digest && <p className="mt-3 text-xs text-slate-600">Reference: <code className="font-mono">{error.digest}</code></p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">Try again</button>
          <Link href="/dashboard" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50">Go to dashboard</Link>
          <Link href="/help" className="self-center text-sm font-semibold text-teal-700 hover:underline">Help</Link>
        </div>
      </div>
    </main>
  );
}
