import Link from "next/link";
import { notFound } from "next/navigation";
import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { tenantDetail } from "@/lib/platform/queries";
import { Badge, Card, FACILITY_TYPE_LABELS, Field, Input, PageHeader, Select, Table, Td, Textarea, fmtDate } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { decideTenantAction, setPlanAction } from "../../actions";
import { STATUS_TONE } from "@/lib/platform/status";

export const metadata = { title: "Tenant" };

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = await tenantDetail(systemDb(), id);
  if (!d) notFound();
  const t = d.tenant;
  return (
    <>
      <PageHeader title={t.name} description={`Registered ${fmtDate(t.createdAt)} · ${t.type === "INDIVIDUAL" ? "Individual learner" : "Organization"}`} actions={<Link href="/platform" className="text-sm font-semibold text-teal-700 hover:underline">All tenants</Link>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={<span className="flex items-center gap-2">Status <Badge tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge></span>}>
          {t.rejectionReason && <p className="mb-3 text-sm text-slate-600">Reason: {t.rejectionReason}</p>}
          <div className="space-y-4">
            {t.status === "PENDING_APPROVAL" && (
              <>
                <ActionForm action={decideTenantAction} submitLabel="Approve organization" variant="teal">
                  <input type="hidden" name="tenantId" value={t.id} /><input type="hidden" name="decision" value="approve" />
                  <p className="text-sm text-slate-600">Verify the organization and facility license information before approving.</p>
                </ActionForm>
                <ActionForm action={decideTenantAction} submitLabel="Reject" variant="danger">
                  <input type="hidden" name="tenantId" value={t.id} /><input type="hidden" name="decision" value="reject" />
                  <Field label="Reason (shared with the applicant)" name="reason" htmlFor="reject-reason"><Input id="reject-reason" name="reason" required /></Field>
                </ActionForm>
              </>
            )}
            {t.status === "ACTIVE" && (
              <ActionForm action={decideTenantAction} submitLabel="Suspend tenant" variant="danger" confirm="Suspend this tenant? All of its users lose access immediately.">
                <input type="hidden" name="tenantId" value={t.id} /><input type="hidden" name="decision" value="suspend" />
                <Field label="Reason" name="reason" htmlFor="suspend-reason"><Input id="suspend-reason" name="reason" required /></Field>
              </ActionForm>
            )}
            {t.status === "SUSPENDED" && (
              <ActionForm action={decideTenantAction} submitLabel="Reactivate tenant" variant="teal">
                <input type="hidden" name="tenantId" value={t.id} /><input type="hidden" name="decision" value="reactivate" />
              </ActionForm>
            )}
          </div>
        </Card>
        <Card title="Organization">
          {d.org ? (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-slate-500">Legal name</dt><dd>{d.org.legalName}</dd></div>
              <div><dt className="text-xs text-slate-500">Contact</dt><dd>{d.org.email ?? "—"} {d.org.phone && `· ${d.org.phone}`}</dd></div>
              <div><dt className="text-xs text-slate-500">Location</dt><dd>{[d.org.city, d.org.state].filter(Boolean).join(", ")}</dd></div>
            </dl>
          ) : <p className="text-sm text-slate-600">Personal learner account.</p>}
        </Card>
        <Card title="Subscription">
          {d.subscription ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Plan</dt><dd className="font-medium">{d.subscription.plan}</dd></div>
              <div className="flex justify-between"><dt>Status</dt><dd>{d.subscription.status}</dd></div>
              <div className="flex justify-between"><dt>Seats</dt><dd>{d.subscription.seats}</dd></div>
              {d.subscription.trialEndsAt && <div className="flex justify-between"><dt>Trial ends</dt><dd>{fmtDate(d.subscription.trialEndsAt)}</dd></div>}
              {d.subscription.stripeSubscriptionId && <div className="flex justify-between"><dt>Stripe</dt><dd className="font-mono text-xs">{d.subscription.stripeSubscriptionId}</dd></div>}
            </dl>
          ) : <p className="text-sm text-slate-600">None</p>}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-navy-900">Set plan manually (custom pricing, trials)</summary>
            <ActionForm action={setPlanAction} submitLabel="Save plan" className="mt-3 space-y-2">
              <input type="hidden" name="tenantId" value={id} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Plan" name="plan" htmlFor="pl-plan"><Select id="pl-plan" name="plan" defaultValue={d.subscription?.plan ?? "STARTER"}>{["STARTER", "PROFESSIONAL", "ENTERPRISE", "INDIVIDUAL_LEARNER"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="Status" name="status" htmlFor="pl-status"><Select id="pl-status" name="status" defaultValue={d.subscription?.status ?? "TRIALING"}>{["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="Cycle" name="billingCycle" htmlFor="pl-cycle"><Select id="pl-cycle" name="billingCycle" defaultValue={d.subscription?.billingCycle ?? "MONTHLY"}>{["MONTHLY", "ANNUAL", "CUSTOM"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="Pricing" name="pricingModel" htmlFor="pl-pricing"><Select id="pl-pricing" name="pricingModel" defaultValue={d.subscription?.pricingModel ?? "PER_EMPLOYEE"}>{["PER_EMPLOYEE", "PER_FACILITY", "FLAT", "CUSTOM"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="Seats" name="seats" htmlFor="pl-seats"><Input id="pl-seats" name="seats" type="number" min={1} defaultValue={d.subscription?.seats ?? 25} /></Field>
                <Field label="Facility limit" name="facilityLimit" htmlFor="pl-fac"><Input id="pl-fac" name="facilityLimit" type="number" min={0} defaultValue={d.subscription?.facilityLimit ?? ""} /></Field>
                <Field label="Unit price (cents)" name="unitPriceCents" htmlFor="pl-price"><Input id="pl-price" name="unitPriceCents" type="number" min={0} defaultValue={d.subscription?.unitPriceCents ?? ""} /></Field>
                <Field label="Trial ends" name="trialEndsAt" htmlFor="pl-trial"><Input id="pl-trial" name="trialEndsAt" type="date" defaultValue={d.subscription?.trialEndsAt ? d.subscription.trialEndsAt.toISOString().slice(0, 10) : ""} /></Field>
              </div>
              <Field label="Custom terms" name="customTerms" htmlFor="pl-terms"><Textarea id="pl-terms" name="customTerms" rows={2} defaultValue={d.subscription?.customTerms ?? ""} /></Field>
              <Field label="Reason (audited)" name="reason" htmlFor="pl-reason"><Input id="pl-reason" name="reason" required minLength={5} /></Field>
            </ActionForm>
          </details>
        </Card>
        <Card title={`Facilities (${d.facilities.length})`} className="lg:col-span-2">
          <Table head={["Facility", "Type", "License #", "City"]}>
            {d.facilities.map((f) => <tr key={f.id}><Td>{f.name}</Td><Td>{FACILITY_TYPE_LABELS[f.facilityType]}</Td><Td>{f.licenseNumber ?? "—"}</Td><Td>{f.city ?? "—"}</Td></tr>)}
          </Table>
        </Card>
        <Card title="Members">
          <ul className="space-y-1 text-sm">{d.members.map((m) => <li key={m.email}>{m.firstName} {m.lastName}<span className="block text-xs text-slate-500">{m.email}</span></li>)}</ul>
        </Card>
        <Card title="Recent tenant activity" className="lg:col-span-3">
          <Table head={["When", "Action", "Entity"]}>
            {d.audit.map((a) => <tr key={a.id}><Td>{a.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</Td><Td><code className="text-xs">{a.action}</code></Td><Td className="text-xs">{a.entityType}</Td></tr>)}
          </Table>
        </Card>
      </div>
    </>
  );
}
