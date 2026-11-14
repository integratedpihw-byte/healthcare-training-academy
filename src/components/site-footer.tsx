import Link from "next/link";
import { supportEmail } from "@/lib/site";

/** Legal and help links shown on every public and signed-in page. */
export function SiteFooter({ className = "" }: { className?: string }) {
  const email = supportEmail();
  return (
    <footer className={`text-xs text-slate-600 ${className}`}>
      <nav aria-label="Legal and help" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        <Link href="/help" className="py-1 underline-offset-2 hover:underline">Help</Link>
        <Link href="/terms" className="py-1 underline-offset-2 hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="py-1 underline-offset-2 hover:underline">Privacy Policy</Link>
        {email && <a href={`mailto:${email}`} className="py-1 underline-offset-2 hover:underline">{email}</a>}
      </nav>
    </footer>
  );
}
