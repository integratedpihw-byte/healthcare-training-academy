import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { allPackages, allPromos, platformRevenue, pricedCourses, usd } from "@/lib/billing/commerce";
import { stripeConfigured } from "@/lib/billing/stripe";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, ButtonLink, Card, Field, Input, PageHeader, Select, StatCard, Table, Td, Textarea, fmtDate } from "@/components/ui";
import { cancelOrderAction, createPromoAction, markPaidAction, refundAction, savePackageAction, setPriceAction, togglePackageAction, togglePromoAction } from "./actions";

export const metadata = { title: "Training revenue" };

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "gray" | "blue"> = { PAID: "green", PENDING: "amber", PARTIALLY_REFUNDED: "blue", REFUNDED: "red", CANCELLED: "gray" };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function RevenuePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const sys = systemDb();
  const [rev, courses, promos, packages] = [
    await platformRevenue(sys, { from: sp.from && DATE.test(sp.from) ? sp.from : undefined, to: sp.to && DATE.test(sp.to) ? sp.to : undefined }),
    await pricedCourses(sys),
    await allPromos(sys),
    await allPackages(sys),
  ];
  const published = courses.filter((c) => c.status === "PUBLISHED");
  const pending = rev.orders.filter((x) => x.o.status === "PENDING");
  const qs = `from=${rev.from}&to=${rev.to}`;
  const exportLinks = (view: string) => (
    <div className="flex gap-2">
      {(["pdf", "xlsx", "csv"] as const).map((f) => (
        <ButtonLink key={f} href={`/api/platform/revenue?view=${view}&format=${f}&${qs}`} variant="secondary" prefetch={false}>{f === "xlsx" ? "Excel" : f.toUpperCase()}</ButtonLink>
      ))}
    </div>
  );
  return (
    <>
      <PageHeader title="Training revenue" description="Course prices, training packages, promo codes, orders, refunds and revenue. Prices apply to organizations and learners without an active subscription; courses without a price are included for everyone." />
      {!stripeConfigured() && <Alert tone="amber">Online card payment is not configured, so orders are placed as invoices. Mark them paid here when payment arrives.</Alert>}
      <form className="my-6 flex flex-wrap items-end gap-3" method="get">
        <Field label="From" name="from"><Input type="date" id="from" name="from" defaultValue={rev.from} /></Field>
        <Field label="To" name="to"><Input type="date" id="to" name="to" defaultValue={rev.to} /></Field>
        <button className="rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Apply</button>
      </form>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Net revenue" value={usd(rev.totals.net)} tone="teal" hint={`${rev.from} to ${rev.to}`} />
        <StatCard label="Gross" value={usd(rev.totals.gross)} />
        <StatCard label="Refunds" value={usd(rev.totals.refunds)} tone={rev.totals.refunds ? "amber" : "navy"} />
        <StatCard label="Seats sold" value={rev.totals.seats} hint={`${pending.length} order${pending.length === 1 ? "" : "s"} awaiting payment`} />
      </div>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Revenue by course or package" actions={exportLinks("course")}>
            <Table head={["Item", "Orders", "Seats", "Net"]} empty="No paid orders in this period.">
              {rev.byCourse.map((r) => (
                <tr key={r.item}><Td>{r.item}</Td><Td>{r.orders}</Td><Td>{r.seats}</Td><Td className="font-medium">{usd(r.net)}</Td></tr>
              ))}
            </Table>
          </Card>
          <Card title="Revenue by organization" actions={exportLinks("organization")}>
            <Table head={["Organization", "Orders", "Seats", "Net"]} empty="No paid orders in this period.">
              {rev.byOrg.map((r) => (
                <tr key={r.organization}><Td>{r.organization}</Td><Td>{r.orders}</Td><Td>{r.seats}</Td><Td className="font-medium">{usd(r.net)}</Td></tr>
              ))}
            </Table>
          </Card>
        </div>

        <Card title="Orders">
          <Table head={["Placed", "Organization", "Item", "Seats", "Total", "Status", "Actions"]} empty="No orders yet.">
            {rev.orders.map(({ o, org }) => (
              <tr key={o.id}>
                <Td className="text-xs">{fmtDate(o.createdAt)}</Td>
                <Td>{org}</Td>
                <Td><div>{o.itemName}</div>{o.promoCode && <div className="text-xs text-slate-500">Promo {o.promoCode} (−{usd(o.discountCents)})</div>}</Td>
                <Td>{o.quantity}</Td>
                <Td><div>{usd(o.totalCents)}</div>{o.refundedCents > 0 && <div className="text-xs text-red-700">−{usd(o.refundedCents)} refunded</div>}</Td>
                <Td><Badge tone={STATUS_TONE[o.status]}>{o.status.replace("_", " ").toLowerCase()}</Badge><div className="mt-1 text-xs text-slate-500">{o.paymentMethod.toLowerCase()}</div></Td>
                <Td>
                  {o.status === "PENDING" && (
                    <details key={`pay-${o.id}`}>
                      <summary className="cursor-pointer text-xs font-semibold text-teal-700">Record payment</summary>
                      <ActionForm action={markPaidAction} submitLabel="Mark paid" className="mt-2 w-60 space-y-2">
                        <input type="hidden" name="orderId" value={o.id} />
                        <Input name="reference" placeholder="Check or transfer reference" required minLength={3} aria-label="Payment reference" />
                      </ActionForm>
                      <ActionForm action={cancelOrderAction} submitLabel="Cancel order" variant="ghost" className="mt-2" confirm="Cancel this order?">
                        <input type="hidden" name="orderId" value={o.id} />
                      </ActionForm>
                    </details>
                  )}
                  {(o.status === "PAID" || o.status === "PARTIALLY_REFUNDED") && o.totalCents > o.refundedCents && (
                    <details key={`refund-${o.id}`}>
                      <summary className="cursor-pointer text-xs font-semibold text-teal-700">Refund</summary>
                      <ActionForm action={refundAction} submitLabel="Issue refund" variant="danger" className="mt-2 w-64 space-y-2" confirm="Issue this refund? Card refunds go back through Stripe.">
                        <input type="hidden" name="orderId" value={o.id} />
                        <Input name="amount" type="number" step="0.01" min="0.01" max={(o.totalCents - o.refundedCents) / 100} defaultValue={(o.totalCents - o.refundedCents) / 100} aria-label="Refund amount (USD)" />
                        <Textarea name="reason" rows={2} placeholder="Reason (shown in the audit log)" required minLength={10} aria-label="Refund reason" />
                      </ActionForm>
                    </details>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Course prices">
          <p className="mb-3 text-sm text-slate-600">Only published library courses can be sold. A price of $0 or no price means the course is included for everyone.</p>
          <Table head={["Course", "Status", "Price", "Change"]}>
            {courses.map((c) => (
              <tr key={c.id}>
                <Td><div className="font-medium text-navy-900">{c.title}</div><div className="text-xs text-slate-500">{c.code}</div></Td>
                <Td className="text-xs">{c.status.replace("_", " ").toLowerCase()}</Td>
                <Td>{c.price_cents != null ? usd(c.price_cents) : <span className="text-xs text-slate-500">Included</span>}</Td>
                <Td>
                  <div className="flex items-start gap-2">
                    <ActionForm action={setPriceAction} submitLabel="Save" className="flex items-center gap-2">
                      <input type="hidden" name="courseId" value={c.id} />
                      <Input name="price" type="number" min="0" step="0.01" className="w-28" defaultValue={c.price_cents != null ? c.price_cents / 100 : ""} placeholder="USD" aria-label={`Price for ${c.code}`} required />
                    </ActionForm>
                    {c.price_cents != null && (
                      <ActionForm action={setPriceAction} submitLabel="Remove" variant="ghost">
                        <input type="hidden" name="courseId" value={c.id} />
                        <input type="hidden" name="clear" value="1" />
                      </ActionForm>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Training packages">
            <Table head={["Package", "Courses", "Price", ""]} empty="No packages yet.">
              {packages.map((p) => (
                <tr key={p.id}>
                  <Td><div className="font-medium text-navy-900">{p.name}</div><div className="text-xs text-slate-500">{p.code}{p.audience ? ` · ${p.audience}` : ""}</div></Td>
                  <Td>{p.courseIds.length}</Td>
                  <Td>{usd(p.priceCents)} <span className="text-xs text-slate-500">per seat</span></Td>
                  <Td>
                    <ActionForm action={togglePackageAction} submitLabel={p.isActive ? "Retire" : "Reactivate"} variant="ghost">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={p.isActive ? "0" : "1"} />
                    </ActionForm>
                  </Td>
                </tr>
              ))}
            </Table>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-teal-700">Create or update a package</summary>
              <ActionForm action={savePackageAction} submitLabel="Save package" className="mt-3 space-y-3" resetOnSuccess>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Code" name="code" hint="Saving an existing code updates it"><Input id="code" name="code" required placeholder="HHA-STARTER" /></Field>
                  <Field label="Price per seat (USD)" name="price"><Input id="price" name="price" type="number" min="0" step="0.01" required /></Field>
                </div>
                <Field label="Name" name="name"><Input id="name" name="name" required /></Field>
                <Field label="Audience" name="audience"><Input id="audience" name="audience" placeholder="New home health aides" /></Field>
                <Field label="Description" name="description"><Textarea id="description" name="description" rows={2} /></Field>
                <fieldset className="max-h-56 overflow-y-auto rounded-md border border-slate-200 p-3">
                  <legend className="px-1 text-sm font-medium">Courses</legend>
                  {published.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 py-0.5 text-sm"><input type="checkbox" name="courseIds" value={c.id} /> {c.code} — {c.title}</label>
                  ))}
                  {!published.length && <p className="text-sm text-slate-500">No published library courses yet.</p>}
                </fieldset>
              </ActionForm>
            </details>
          </Card>

          <Card title="Promo codes">
            <Table head={["Code", "Discount", "Used", "Expires", ""]} empty="No promo codes yet.">
              {promos.map((p) => (
                <tr key={p.id}>
                  <Td><div className="font-mono text-sm">{p.code}</div>{!p.isActive && <Badge>inactive</Badge>}</Td>
                  <Td>{p.percentOff != null ? `${p.percentOff}%` : usd(p.amountOffCents ?? 0)}</Td>
                  <Td>{p.redeemedCount}{p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ""}</Td>
                  <Td className="text-xs">{p.expiresAt ? fmtDate(p.expiresAt) : "Never"}</Td>
                  <Td>
                    <ActionForm action={togglePromoAction} submitLabel={p.isActive ? "Deactivate" : "Activate"} variant="ghost">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={p.isActive ? "0" : "1"} />
                    </ActionForm>
                  </Td>
                </tr>
              ))}
            </Table>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-teal-700">Create a promo code</summary>
              <ActionForm action={createPromoAction} submitLabel="Create code" className="mt-3 space-y-3" resetOnSuccess>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Code" name="code" htmlFor="promo-code"><Input id="promo-code" name="code" required placeholder="SPRING25" /></Field>
                  <Field label="Type" name="kind"><Select id="kind" name="kind"><option value="PERCENT">Percent off</option><option value="AMOUNT">Amount off (USD)</option></Select></Field>
                  <Field label="Value" name="value"><Input id="value" name="value" type="number" min="0.01" step="0.01" required /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Maximum uses" name="maxRedemptions" hint="Blank for unlimited"><Input id="maxRedemptions" name="maxRedemptions" type="number" min="1" /></Field>
                  <Field label="Expires on" name="expiresOn"><Input id="expiresOn" name="expiresOn" type="date" /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Only for course" name="courseId"><Select id="courseId" name="courseId"><option value="">Any item</option>{courses.filter((c) => c.price_cents != null).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</Select></Field>
                  <Field label="Only for package" name="packageId"><Select id="packageId" name="packageId"><option value="">Any item</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
                </div>
                <Field label="Description" name="description" htmlFor="promo-description"><Input id="promo-description" name="description" /></Field>
              </ActionForm>
            </details>
          </Card>
        </div>
      </div>
    </>
  );
}
