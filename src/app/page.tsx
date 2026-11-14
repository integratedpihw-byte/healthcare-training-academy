import Image from "next/image";
import badgeImage from "@/assets/brand/badge.webp";
import { SiteFooter } from "@/components/site-footer";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { ButtonLink, Logo } from "@/components/ui";

export const dynamic = "force-dynamic";

const AUDIENCES = ["Hospitals", "Clinics & medical practices", "Assisted living facilities", "Group homes", "Adult day care", "Home health agencies", "Skilled nursing", "Behavioral health", "HIV/AIDS organizations", "Pharmacies & laboratories", "Staffing agencies", "Individual learners"];

export default async function Home() {
  const ctx = await getAuthContext();
  if (ctx) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo size="lg" />
        <nav className="flex gap-2">
          <ButtonLink href="/login" variant="ghost">Sign in</ButtonLink>
          <ButtonLink href="/register" variant="teal">Register organization</ButtonLink>
        </nav>
      </header>
      <main id="main">
        <section className="bg-gradient-to-b from-sky-50 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-[1fr_auto]">
            <div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl">Healthcare workforce training, competency and compliance — in one platform.</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600">Onboard staff, assign the right training for each facility and role, validate hands-on competencies and stay audit-ready. Built for Florida first, designed for all 50 states.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register">Start a 14-day trial</ButtonLink>
              <ButtonLink href="/register/individual" variant="secondary">I&apos;m an individual learner</ButtonLink>
            </div>
            </div>
            <Image src={badgeImage} alt="CHITA — Complete Healthcare Innovative Training Academy badge" width={300} height={300} priority unoptimized className="mx-auto hidden h-auto w-72 drop-shadow-xl sm:block lg:w-80" />
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-700">Built for</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {AUDIENCES.map((a) => <li key={a} className="rounded-full bg-navy-50 px-3 py-1 text-sm text-navy-800">{a}</li>)}
          </ul>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Complete Healthcare Innovative Training Academy. Course certificates are not state licenses or accredited continuing education unless explicitly stated.
        <SiteFooter className="mt-3" />
      </footer>
    </div>
  );
}
