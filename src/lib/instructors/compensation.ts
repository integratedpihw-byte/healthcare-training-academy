/**
 * Instructor compensation rates and calculated amounts (expansion brief §8).
 * Rates are organization data protected by RLS and permission policies; amounts are
 * calculated from completed classes and recorded attendance — nothing is paid out by
 * the platform.
 */
import { asc, desc, sql } from "drizzle-orm";
import { z } from "zod";
import type { Tx } from "@/db/client";
import { instructorCompensation } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { ServiceResult } from "@/lib/tenancy/service";

export const RATE_TYPE_LABEL: Record<string, string> = {
  PER_SESSION: "Per class",
  PER_HOUR: "Per hour taught",
  PER_LEARNER: "Per learner present",
};

export const rateSchema = z.object({
  instructorId: z.string().uuid(),
  rateType: z.enum(["PER_SESSION", "PER_HOUR", "PER_LEARNER"]),
  rate: z.coerce.number().min(0).max(100000),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function setRate(tx: Tx, ctx: { tenantId: string; userId: string }, raw: unknown): Promise<ServiceResult<null>> {
  const p = rateSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: p.error.flatten().fieldErrors as Record<string, string[]> };
  const v = p.data;
  const [ins] = (await tx.execute<{ id: string }>(sql`select id from instructors where id = ${v.instructorId}::uuid and (tenant_id = ${ctx.tenantId}::uuid)`)).rows;
  if (!ins) return { ok: false, error: "Instructor not found." };
  const values = { tenantId: ctx.tenantId, instructorId: v.instructorId, rateType: v.rateType, rateCents: Math.round(v.rate * 100), effectiveFrom: v.effectiveFrom, notes: v.notes || null, createdById: ctx.userId };
  await tx
    .insert(instructorCompensation)
    .values(values)
    .onConflictDoUpdate({ target: [instructorCompensation.instructorId, instructorCompensation.effectiveFrom], set: { rateType: values.rateType, rateCents: values.rateCents, notes: values.notes, createdById: ctx.userId } });
  await writeAudit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "instructor.rate_set", entityType: "instructor", entityId: v.instructorId, after: { rateType: v.rateType, rateCents: values.rateCents, effectiveFrom: v.effectiveFrom } });
  return { ok: true, data: null };
}

export async function ratesFor(tx: Tx) {
  return tx.select().from(instructorCompensation).orderBy(asc(instructorCompensation.instructorId), desc(instructorCompensation.effectiveFrom));
}

export interface CompRow {
  instructor: string;
  sessions: number;
  hours: number;
  learners: number;
  basis: string;
  amountCents: number | null;
}

/** Amount owed per instructor for completed classes in [from, to], using the rate in effect on each class date. */
export async function compensation(tx: Tx, from: string, to: string): Promise<CompRow[]> {
  const rows = (
    await tx.execute<{ instructor_id: string; name: string; session_id: string; hours: number; present: number; rate_type: string | null; rate_cents: number | null }>(sql`
      select i.id instructor_id, u.first_name || ' ' || u.last_name name, s.id session_id,
             extract(epoch from (s.ends_at - s.starts_at)) / 3600.0 hours,
             (select count(*)::int from attendance a where a.session_id = s.id and a.status = 'PRESENT') present,
             r.rate_type, r.rate_cents
        from training_sessions s
        join instructors i on i.id = s.instructor_id
        join users u on u.id = i.user_id
        left join lateral (
          select c.rate_type, c.rate_cents from instructor_compensation c
           where c.instructor_id = i.id and c.effective_from <= to_char(s.starts_at at time zone 'America/New_York', 'YYYY-MM-DD')
           order by c.effective_from desc limit 1) r on true
       where s.status = 'COMPLETED' and s.starts_at >= ${from}::date and s.starts_at < (${to}::date + 1)
       order by name`)
  ).rows;
  const by = new Map<string, CompRow & { types: Set<string>; missing: boolean }>();
  for (const r of rows) {
    const cur = by.get(r.instructor_id) ?? { instructor: r.name, sessions: 0, hours: 0, learners: 0, basis: "", amountCents: 0, types: new Set<string>(), missing: false };
    cur.sessions += 1;
    cur.hours += Number(r.hours);
    cur.learners += r.present;
    if (r.rate_type == null || r.rate_cents == null) cur.missing = true;
    else {
      cur.types.add(r.rate_type);
      const amt = r.rate_type === "PER_SESSION" ? r.rate_cents : r.rate_type === "PER_HOUR" ? Math.round(r.rate_cents * Number(r.hours)) : r.rate_cents * r.present;
      cur.amountCents = (cur.amountCents ?? 0) + amt;
    }
    by.set(r.instructor_id, cur);
  }
  return [...by.values()].map(({ types, missing, ...r }) => ({
    ...r,
    hours: Math.round(r.hours * 100) / 100,
    basis: missing ? (types.size ? "Partly calculated — some classes have no rate" : "No rate on file") : [...types].map((t) => RATE_TYPE_LABEL[t]).join(", "),
    amountCents: missing && !types.size ? null : r.amountCents,
  }));
}

