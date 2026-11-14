import { seq } from "@/db/seq";
import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { departments, employeeFacilities, facilities } from "@/db/schema";
import { Alert, Badge, Card, EmptyState, FACILITY_TYPE_LABELS, Field, Input, PageHeader, Select, Table, Td, fmtDate } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { FacilityFields } from "@/components/facility-fields";
import { createDepartmentAction, saveFacilityAction, toggleFacilityAction } from "../actions";

export const metadata = { title: "Facilities & departments" };

export default async function FacilitiesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const ctx = await requirePermission("org.facilities.manage");
  const { saved } = await searchParams;
  const [facs, depts] = await ctx.tx(async (tx) =>
    seq([
      tx
        .select({
          f: facilities,
          employees: sql<number>`(select count(*)::int from ${employeeFacilities} ef where ef.facility_id = "facilities"."id")`,
        })
        .from(facilities)
        .orderBy(asc(facilities.name)),
      tx.select({ d: departments, facilityName: facilities.name }).from(departments).leftJoin(facilities, eq(facilities.id, departments.facilityId)).orderBy(asc(departments.name)),
    ]),
  );
  return (
    <>
      <PageHeader title="Facilities & departments" description="Facility type and license information determine which training requirements apply to each employee." />
      <div className="space-y-6">
        {saved && <Alert tone="green">Facility saved.</Alert>}
        <Card title={`Facilities (${facs.length})`}>
          <Table head={["Facility", "Type", "License", "Employees", "Status", ""]} empty={facs.length === 0 ? <EmptyState>No facilities yet.</EmptyState> : undefined}>
            {facs.map(({ f, employees }) => (
              <tr key={f.id}>
                <Td className="font-medium text-navy-900">{f.name}<div className="text-xs font-normal text-slate-500">{[f.city, f.state].filter(Boolean).join(", ")}</div></Td>
                <Td>{FACILITY_TYPE_LABELS[f.facilityType]}</Td>
                <Td>{f.licenseNumber ?? "—"}{f.licenseExpires && <div className="text-xs text-slate-500">Expires {fmtDate(f.licenseExpires)}</div>}</Td>
                <Td>{employees}</Td>
                <Td>{f.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</Td>
                <Td className="whitespace-nowrap text-right">
                  <Link href={`/admin/facilities/${f.id}`} className="mr-3 text-sm font-semibold text-teal-700 hover:underline">Edit</Link>
                  <form action={toggleFacilityAction} className="inline">
                    <input type="hidden" name="facilityId" value={f.id} />
                    <input type="hidden" name="active" value={String(!f.isActive)} />
                    <button type="submit" className="text-sm text-slate-600 hover:underline">{f.isActive ? "Deactivate" : "Reactivate"}</button>
                  </form>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card title="Add a facility">
            <ActionForm action={saveFacilityAction} submitLabel="Create facility" pendingText="Creating…" resetOnSuccess>
              <FacilityFields />
            </ActionForm>
          </Card>
          <Card title={`Departments (${depts.length})`}>
            <ul className="mb-5 divide-y divide-slate-100 text-sm">
              {depts.length === 0 && <li className="py-2 text-slate-500">No departments yet.</li>}
              {depts.map(({ d, facilityName }) => (
                <li key={d.id} className="py-2"><div className="font-medium text-navy-900">{d.name}</div><div className="text-xs text-slate-500">{facilityName ?? "Organization-wide"}</div></li>
              ))}
            </ul>
            <ActionForm action={createDepartmentAction} submitLabel="Add department" variant="secondary" resetOnSuccess>
              <Field label="Department name" name="name" htmlFor="dept-name"><Input id="dept-name" name="name" required /></Field>
              <Field label="Facility" name="facilityId" htmlFor="dept-facility">
                <Select id="dept-facility" name="facilityId" defaultValue="">
                  <option value="">Organization-wide</option>
                  {facs.map(({ f }) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Select>
              </Field>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
