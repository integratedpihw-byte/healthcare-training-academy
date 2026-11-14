/**
 * PERFORMANCE TESTING ONLY. Adds a large, clearly-labeled synthetic workforce to the
 * Sunshine Care Group (DEMO) tenant of a *_perf database:
 *   N employees with academy accounts, enrollments, assignments, notifications.
 * Usage: dotenv -e .env.perf -- tsx scripts/perf/volume.ts 5000
 */
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

async function main() {
  // Runs as the schema owner so lifecycle guards can be paused for the synthetic bulk
  // load (inside one transaction; triggers are re-enabled before commit).
  const url = new URL(process.env.MIGRATION_DATABASE_URL!);
  if (!url.pathname.endsWith("_perf")) throw new Error("Refusing to load volume data outside a *_perf database");
  const n = Number(process.argv[2] ?? 5000);
  const pool = new Pool({ connectionString: url.toString() });
  const db = drizzle(pool);
  const [t] = (await db.execute<{ id: string; org: string }>(sql`select t.id, o.id org from tenants t join organizations o on o.tenant_id = t.id where t.slug = 'demo-sunshine'`)).rows;
  if (!t) throw new Error("Seed the demo first (npm run db:seed -- --demo)");
  const started = Date.now();
  await db.transaction(async (tx) => {
    for (const tbl of ["enrollments", "training_assignments"]) await tx.execute(sql.raw(`alter table ${tbl} disable trigger user`));
    await tx.execute(sql`
      insert into facilities (tenant_id, organization_id, name, facility_type, state, city)
      select ${t.id}::uuid, ${t.org}::uuid, 'Load Facility ' || g || ' (DEMO-LOAD)', 'ASSISTED_LIVING_FACILITY', 'FL', 'Orlando' from generate_series(1, 20) g`);
    await tx.execute(sql`
      insert into users (email, password_hash, first_name, last_name)
      select 'load' || g || '@sunshine-load.example', (select password_hash from users where email = 'learner@sunshine.example'), 'Load', 'Worker ' || g
        from generate_series(1, ${n}) g`);
    await tx.execute(sql`
      insert into memberships (tenant_id, user_id, status)
      select ${t.id}::uuid, u.id, 'ACTIVE' from users u where u.email like 'load%@sunshine-load.example'`);
    await tx.execute(sql`
      insert into membership_roles (tenant_id, membership_id, role_id)
      select ${t.id}::uuid, m.id, (select id from roles where tenant_id is null and key = 'learner')
        from memberships m join users u on u.id = m.user_id where u.email like 'load%@sunshine-load.example'`);
    await tx.execute(sql`
      insert into employees (tenant_id, organization_id, user_id, employee_number, first_name, last_name, job_title, position_code, hire_date, primary_facility_id, clinical_exposure)
      select ${t.id}::uuid, ${t.org}::uuid, u.id, 'LOAD-' || row_number() over (), 'Load', u.last_name, 'Caregiver', 'CAREGIVER',
             date '2024-01-01' + (random() * 600)::int,
             (select id from facilities where tenant_id = ${t.id}::uuid and name like 'Load Facility%' order by random() limit 1), true
        from users u where u.email like 'load%@sunshine-load.example'`);
    await tx.execute(sql`
      insert into training_assignments (tenant_id, employee_id, course_id, due_date, status, source, reason)
      select ${t.id}::uuid, e.id, c.id, current_date + ((random() * 120)::int - 30), 'ASSIGNED', 'MANUAL', 'DEMO-LOAD'
        from employees e cross join (select id from courses where status = 'PUBLISHED' and tenant_id is null) c
       where e.employee_number like 'LOAD-%'`);
    await tx.execute(sql`update training_assignments set status = 'OVERDUE' where tenant_id = ${t.id}::uuid and reason = 'DEMO-LOAD' and due_date < current_date`);
    await tx.execute(sql`
      insert into enrollments (tenant_id, user_id, course_id, course_version_id, status, progress_pct, started_at, completed_at, created_at)
      select ${t.id}::uuid, e.user_id, c.id, c.current_version_id, s.st, case when s.st = 'COMPLETED' then 100 else (random() * 90)::int end,
             now() - interval '200 days' * random(), case when s.st = 'COMPLETED' then now() - interval '300 days' * random() end, now() - interval '330 days' * random()
        from employees e cross join (select id, current_version_id from courses where status = 'PUBLISHED' and tenant_id is null) c
        cross join lateral (select (array['IN_PROGRESS','COMPLETED','COMPLETED'])[1 + (random() * 2)::int]::enrollment_status st) s
       where e.employee_number like 'LOAD-%'`);
    await tx.execute(sql`
      insert into notifications (tenant_id, user_id, type, category, title, body, link, dedupe_key)
      select ${t.id}::uuid, e.user_id, 'reminder.due', 'none', 'DEMO-LOAD reminder ' || g, 'Synthetic', '/learning', 'load:' || e.id || ':' || g
        from employees e cross join generate_series(1, 5) g where e.employee_number like 'LOAD-%'`);
    for (const tbl of ["enrollments", "training_assignments"]) await tx.execute(sql.raw(`alter table ${tbl} enable trigger user`));
  });
  await db.execute(sql`analyze`);
  const c = (await db.execute<{ e: number; a: number; en: number; nt: number }>(sql`select (select count(*)::int from employees where tenant_id = ${t.id}::uuid) e, (select count(*)::int from training_assignments where tenant_id = ${t.id}::uuid) a, (select count(*)::int from enrollments where tenant_id = ${t.id}::uuid) en, (select count(*)::int from notifications where tenant_id = ${t.id}::uuid) nt`)).rows[0];
  console.log(`✓ DEMO-LOAD volume in ${Math.round((Date.now() - started) / 1000)}s: ${c.e} employees, ${c.a} assignments, ${c.en} enrollments, ${c.nt} notifications`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
