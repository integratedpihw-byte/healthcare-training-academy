import Link from "next/link";
import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";

export function cn(...c: Parameters<typeof clsx>) {
  return clsx(...c);
}

type Variant = "primary" | "secondary" | "danger" | "ghost" | "teal";
const variants: Record<Variant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-navy-600/60",
  teal: "bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-700/60",
  secondary: "bg-white text-navy-900 border border-slate-300 hover:bg-slate-50",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-navy-800 hover:bg-navy-50",
};
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed";

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(btnBase, variants[variant], className)} {...p} />;
}

export function ButtonLink({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(btnBase, variants[variant], className)} {...p} />;
}

export function Card({ className, children, title, actions }: { className?: string; children: ReactNode; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-red-50 text-red-800 ring-red-600/20",
  blue: "bg-sky-100 text-navy-800 ring-navy-600/20",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
  gray: "bg-slate-100 text-slate-700 ring-slate-500/20",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone])}>{children}</span>;
}

export function StatCard({ label, value, hint, tone = "navy" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "navy" | "teal" | "amber" | "red" }) {
  const accent = { navy: "border-l-navy-800", teal: "border-l-teal-500", amber: "border-l-amber-500", red: "border-l-red-600" }[tone];
  return (
    <div className={cn("rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm", accent)}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-navy-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function Field({ label, name, htmlFor, error, hint, children }: { label: string; name: string; htmlFor?: string; error?: string[]; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor ?? name} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !error?.length && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error?.map((e) => (
        <p key={e} className="mt-1 text-xs text-red-700" id={`${name}-error`}>
          {e}
        </p>
      ))}
    </div>
  );
}

const inputCls =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 aria-invalid:border-red-500";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input className={cn(inputCls, className)} {...p} />;
}

export function Select({ className, ...p }: ComponentProps<"select">) {
  return <select className={cn(inputCls, className)} {...p} />;
}

export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputCls, className)} {...p} />;
}

export function Alert({ tone = "red", children }: { tone?: "red" | "green" | "amber" | "blue"; children: ReactNode }) {
  const c = {
    red: "border-red-200 bg-red-50 text-red-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-sky-200 bg-sky-50 text-navy-900",
  }[tone];
  return (
    <div role={tone === "red" ? "alert" : "status"} className={cn("rounded-md border px-4 py-3 text-sm", c)}>
      {children}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-teal-600" tabIndex={0} role="region" aria-label="Table (scroll sideways for more columns)">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-navy-50">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-navy-800">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ className, ...p }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-2.5 align-top text-slate-700", className)} {...p} />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-slate-500">{children}</div>;
}

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
      DEMO DATA — this organization contains fictional demonstration records only.
    </div>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg aria-hidden viewBox="0 0 32 32" className="h-8 w-8">
        <rect width="32" height="32" rx="8" fill={light ? "#ffffff" : "#0b2545"} />
        <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#13a3b0" />
      </svg>
      <span className={cn("leading-tight", light ? "text-white" : "text-navy-900")}>
        <span className="block text-sm font-bold tracking-tight">Complete Healthcare</span>
        <span className="block whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.08em] opacity-80">Innovative Training Academy</span>
      </span>
    </span>
  );
}

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  HOSPITAL: "Hospital",
  MEDICAL_PRACTICE: "Medical Practice",
  CLINIC: "Clinic",
  ASSISTED_LIVING_FACILITY: "Assisted Living Facility (ALF)",
  GROUP_HOME: "Group Home",
  ADULT_DAY_CARE: "Adult Day Care",
  HOME_HEALTH_AGENCY: "Home Health Agency",
  SKILLED_NURSING_FACILITY: "Skilled Nursing Facility",
  BEHAVIORAL_HEALTH: "Behavioral Health Facility",
  COMMUNITY_HEALTH_CENTER: "Community Health Center",
  HIV_AIDS_ORGANIZATION: "HIV/AIDS Treatment & Prevention Organization",
  PHARMACY: "Pharmacy",
  LABORATORY: "Laboratory",
  STAFFING_AGENCY: "Healthcare Staffing Agency",
  OTHER: "Other",
};

/** Display time zone for timestamps (Florida-first; shown with an explicit "ET" label). */
export const DISPLAY_TZ = "America/New_York";
/** Date and time in Eastern Time, labelled, so server and browser always agree. */
export function fmtDateTime(d: Date | null | undefined, seconds = false) {
  if (!d) return "—";
  return `${d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: seconds ? "medium" : "short", timeZone: DISPLAY_TZ })} ET`;
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T00:00:00` : d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
