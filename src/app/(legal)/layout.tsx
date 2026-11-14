import Link from "next/link";
import { Logo } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-sky-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/"><Logo /></Link>
          <Link href="/login" className="text-sm font-semibold text-teal-700 hover:underline">Sign in</Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-navy-900 [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-700 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:text-slate-700">
          {children}
        </article>
      </main>
      <SiteFooter className="py-6" />
    </div>
  );
}
