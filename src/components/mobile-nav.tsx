"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export interface MobileNavItem { key: string; href: string; label: string; badge?: number }

/** Phone navigation: a Menu button that opens the full list, so no destination is hidden off-screen. */
export function MobileNav({ items }: { items: MobileNavItem[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const current = items.find((i) => path === i.href || path.startsWith(`${i.href}/`));
  return (
    <nav aria-label="Main (mobile)" className="border-b border-slate-200 bg-white md:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" className="flex min-h-11 w-full items-center justify-between px-4 text-sm font-semibold text-navy-900">
        <span className="flex items-center gap-2">{open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}Menu</span>
        <span className="text-xs font-medium text-slate-600">{current?.label ?? ""}</span>
      </button>
      <ul id="mobile-menu" hidden={!open} className="border-t border-slate-100 pb-2">
        {items.map((i) => {
          const active = i === current;
          return (
            <li key={i.key}>
              <Link href={i.href} aria-current={active ? "page" : undefined} className={"flex min-h-11 items-center justify-between px-4 text-sm " + (active ? "bg-teal-50 font-semibold text-teal-800" : "text-navy-900 hover:bg-slate-50")}>
                {i.label}
                {i.badge ? <span className="rounded-full bg-teal-700 px-1.5 text-[10px] font-bold text-white">{i.badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
