import Link from "next/link";
import { Logo } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between bg-navy-900 p-10 text-white lg:flex">
        <Link href="/" className="self-start"><Logo light size="xl" /></Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Training, competency and compliance for every healthcare team.</h2>
          <ul className="mt-6 space-y-3 text-sm text-navy-100">
            <li>• Isolated, secure workspace for each organization</li>
            <li>• Role-based access from administrators to learners</li>
            <li>• Florida-first regulatory framework, built to expand nationally</li>
          </ul>
        </div>
        <p className="text-xs text-navy-100/80">Internal course certificates are not state licenses or accredited CE unless explicitly stated.</p>
      </aside>
      <main id="main" className="flex items-center justify-center bg-sky-50 px-4 py-10">
        <div className="w-full max-w-lg">
          <Link href="/" className="mb-6 inline-block lg:hidden"><Logo size="md" withName /></Link>
          {children}
          <SiteFooter className="mt-6" />
        </div>
      </main>
    </div>
  );
}
