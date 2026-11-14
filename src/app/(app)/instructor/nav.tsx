import Link from "next/link";
import type { TenantContext } from "@/lib/auth/context";

/** Sub-navigation for the Instructor Portal; links appear only when the user can use them. */
export function InstructorNav({ ctx, active }: { ctx: TenantContext; active: string }) {
  const items = [
    { key: "home", href: "/instructor", label: "Grading & retakes", show: ctx.can("assessments.grade") || ctx.can("training.assign") || ctx.can("assessments.review") },
    { key: "classes", href: "/instructor/classes", label: "Classes", show: ctx.has("instructorLed") && (ctx.can("training.schedule.manage") || ctx.can("assessments.grade")) },
    { key: "instructors", href: "/instructor/instructors", label: "Instructors", show: ctx.can("instructors.manage") },
    { key: "messages", href: "/instructor/messages", label: "Messages", show: ctx.can("assessments.grade") || ctx.can("training.schedule.manage") },
    { key: "assistant", href: "/learning/assistant?mode=lesson_draft", label: "Lesson assistant (AI)", show: ctx.has("aiAssistant") && ctx.can("courses.author") },
    { key: "profile", href: "/instructor/profile", label: "My profile", show: true },
  ].filter((i) => i.show);
  return (
    <nav aria-label="Instructor portal" className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {items.map((i) => (
        <Link key={i.key} href={i.href} aria-current={active === i.key ? "page" : undefined} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active === i.key ? "bg-navy-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{i.label}</Link>
      ))}
    </nav>
  );
}
