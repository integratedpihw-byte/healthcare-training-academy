import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireFeature, requireTenant } from "@/lib/auth/context";
import { courses } from "@/db/schema";
import { MODES, modesFor } from "@/lib/ai/service";
import { aiConfigured } from "@/lib/ai/provider";
import { STANDARD_POSITIONS } from "@/lib/workforce/rules";
import { Alert, PageHeader } from "@/components/ui";
import { AssistantForm } from "./assistant-form";

export const metadata = { title: "AI education assistant" };
const uuid = (s?: string) => (s && /^[0-9a-f-]{36}$/i.test(s) ? s : undefined);

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ mode?: string; attemptId?: string; questionId?: string; courseId?: string }> }) {
  const ctx = await requireTenant();
  requireFeature(ctx, "aiAssistant");
  const sp = await searchParams;
  const list = await ctx.tx((tx) => tx.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.status, "PUBLISHED")).orderBy(asc(courses.title)));
  const modes = modesFor(ctx.access).map((k) => ({ key: k, ...MODES[k] }));
  return (
    <>
      <PageHeader title="AI education assistant" description="Ask questions about healthcare training topics. Answers are grounded in approved course content and the platform's regulatory library, with citations." actions={<Link href="/learning" className="text-sm font-semibold text-teal-700 hover:underline">← My Learning</Link>} />
      <div className="max-w-3xl space-y-4">
        <Alert tone="blue">For education only. The assistant cannot diagnose patients, prescribe or recommend treatment for a patient, approve competencies, issue certificates or change compliance status. Never enter patient or personal information.</Alert>
        {!aiConfigured() ? <Alert tone="amber">The AI assistant is not configured on this platform yet. Your platform administrator must set the AI provider key on the server.</Alert> : (
          <AssistantForm modes={modes} courses={list} positions={STANDARD_POSITIONS} initial={{ mode: sp.mode, attemptId: uuid(sp.attemptId), questionId: uuid(sp.questionId), courseId: uuid(sp.courseId) }} />
        )}
      </div>
    </>
  );
}
