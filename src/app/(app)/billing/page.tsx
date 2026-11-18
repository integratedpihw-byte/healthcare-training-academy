import { seq } from "@/db/seq";
import { desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/context";
import { invoices, payments, subscriptions } from "@/db/schema";
import { FEATURE_LABELS, PLANS, quote, usd, type Feature, type PlanCode } from "@/lib/billing/plans";
import { usage } from "@/lib/billing/service";
import { stripeConfigured } from "@/lib/billing/stripe";
import { ActionForm } from "@/components/action-form";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, fmtDate } from "@/components/ui";
import { checkoutAction, portalAction } from "./actions";
import { myPurchases, shopCatalog, subscriptionIncludesLibrary, usd as commerceUsd } from "@/lib/billing/commerce";
import { BuyTraining, itemLabel } from "@/components/billing/buy-training";

export const metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgrade?: string; checkout?: string; portal?: string; order?: string }> }) {
  const ctx = await requirePermission("billing.view");
  const sp = await searchParams;
  const [subs, inv, pay, use] = await ctx.tx(async (tx) =>
    seq([
      tx.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)),
      tx.select().from(invoices).orderBy(desc(invoices.issuedAt)).limit(24),
      tx.select().from(payments).orderBy(desc(payments.createdAt)).limit(24),
      usage(tx),
    ]),
  );
  const sub = subs[0];
  const [shop, purchases] = await ctx.tx(async (tx) => seq([shopCatalog(tx), myPurchases(tx)]));
  const shopItems = [
    ...shop.packages.map((p) => ({ value: `PACKAGE:${p.id}`, label: itemLabel(`Package: ${p.name}`, p.priceCents, `${p.courseIds.length} courses`) })),
    ...shop.priced.map((c) => ({ value: `COURSE:${c.id}`, label: itemLabel(`${c.title} (${c.code})`, c.price_cents) })),
  ];
  const e = ctx.entitlements;
  const canManage = ctx.can("billing.manage");
  const online = stripeConfigured();
  const upgrade = sp.upgrade && sp.upgrade in FEATURE_LABELS ? (sp.upgrade as Feature) : null;
  return (
    <>
      <PageHeader title="Billing" description="Your subscription, usage and invoices. Billing records are kept separate from employee training records." actions={canManage && sub?.stripeCustomerId ? <form action={portalAction}><Button type="submit" variant="secondary">Manage payment methods & invoices</Button></form> : undefined} />
      <div className="space-y-6">
        {upgrade && <Alert tone="amber">{FEATURE_LABELS[upgrade]} is not included in your current plan ({e.plan.name}). Compare plans below.</Alert>}
        {sp.checkout === "success" && <Alert tone="green">Thank you — your payment was received. {sp.order ? "Seats appear as soon as Stripe confirms the payment (usually within a minute)." : "Your plan updates as soon as Stripe confirms it."}</Alert>}
        {sp.checkout === "cancelled" && <Alert tone="blue">Checkout was cancelled; nothing was charged.</Alert>}
        {sp.portal === "unavailable" && <Alert tone="amber">Online billing management is not available for this subscription. Contact your platform administrator.</Alert>}
        {e.restricted && <Alert tone="red">Your subscription is not active. Existing training records and certificates remain available, but new staff and content cannot be added until a plan is chosen.</Alert>}
        <Card title="Subscription">
          {sub ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
              <div><dt className="text-xs text-slate-500">Plan</dt><dd className="font-semibold text-navy-900">{PLANS[sub.plan].name}</dd></div>
              <div><dt className="text-xs text-slate-500">Status</dt><dd><Badge tone={sub.status === "ACTIVE" ? "green" : sub.status === "TRIALING" ? "blue" : "amber"}>{sub.status === "INCOMPLETE" ? "Trial ended" : sub.status.replace("_", " ").toLowerCase()}</Badge>{sub.cancelAtPeriodEnd && <div className="text-xs text-amber-700">Cancels at period end</div>}</dd></div>
              <div><dt className="text-xs text-slate-500">Billing cycle</dt><dd>{sub.billingCycle.toLowerCase()}</dd></div>
              <div><dt className="text-xs text-slate-500">Pricing</dt><dd>{sub.pricingModel.replace("_", " ").toLowerCase()}{sub.unitPriceCents != null && <div className="text-xs text-slate-500">{usd(sub.unitPriceCents)} per unit</div>}</dd></div>
              <div><dt className="text-xs text-slate-500">Seats</dt><dd>{use.employees} of {sub.seats} used</dd></div>
              <div><dt className="text-xs text-slate-500">{sub.status === "TRIALING" ? "Trial ends" : "Renews"}</dt><dd>{fmtDate(sub.status === "TRIALING" ? sub.trialEndsAt : sub.currentPeriodEnd)}</dd></div>
            </dl>
          ) : <EmptyState>No subscription on file.</EmptyState>}
          {sub?.customTerms && <p className="mt-3 text-sm text-slate-600">Custom terms: {sub.customTerms}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="text-slate-500">Facilities: {use.facilities}{e.maxFacilities != null ? ` of ${e.maxFacilities}` : " (unlimited)"}</span>
            <span className="text-slate-300">·</span>
            {Object.entries(FEATURE_LABELS).map(([k, l]) => <Badge key={k} tone={e.features.has(k as Feature) ? "green" : "gray"}>{e.features.has(k as Feature) ? "✓" : "—"} {l}</Badge>)}
          </div>
        </Card>

        <Card title="Training purchases">
          <p className="mb-4 text-sm text-slate-600">
            {subscriptionIncludesLibrary(sub) ? "Your subscription includes the full course library. " : "Priced courses need a paid seat for each learner. "}
            Buy seats for your staff (employer-sponsored training) or a training package; each seat covers one learner&apos;s enrollment.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy-900">Seats</h3>
              <Table head={["Course", "Purchased", "Used", "Remaining"]} empty="No seats purchased yet.">
                {purchases.seats.map((x) => (
                  <tr key={x.id}><Td><div>{x.course}</div><div className="text-xs text-slate-500">{x.code}{x.revoked_at ? " · withdrawn after refund" : x.expires_at ? ` · expires ${fmtDate(x.expires_at)}` : ""}</div></Td><Td>{x.total}</Td><Td>{x.used}</Td><Td>{x.revoked_at ? 0 : x.total - x.used}</Td></tr>
                ))}
              </Table>
              <h3 className="mb-2 mt-5 text-sm font-semibold text-navy-900">Orders</h3>
              <Table head={["Placed", "Item", "Total", "Status"]} empty="No orders yet.">
                {purchases.orders.map((o) => (
                  <tr key={o.id}><Td className="text-xs">{fmtDate(o.createdAt)}</Td><Td><div>{o.itemName}</div><div className="text-xs text-slate-500">{o.quantity} seat{o.quantity === 1 ? "" : "s"}{o.promoCode ? ` · ${o.promoCode}` : ""}</div></Td><Td>{commerceUsd(o.totalCents)}{o.refundedCents > 0 && <div className="text-xs text-red-700">−{commerceUsd(o.refundedCents)}</div>}</Td><Td><Badge tone={o.status === "PAID" ? "green" : o.status === "PENDING" ? "amber" : "gray"}>{o.status.replace("_", " ").toLowerCase()}</Badge></Td></tr>
                ))}
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy-900">Buy training</h3>
              {!canManage ? <p className="text-sm text-slate-600">Ask a billing administrator to buy seats.</p> : shopItems.length ? <BuyTraining items={shopItems} online={online} /> : <p className="text-sm text-slate-600">No priced courses or packages are offered right now — every course is included.</p>}
            </div>
          </div>
        </Card>
        <Card title="Plans">
          <div className="grid gap-4 lg:grid-cols-3">
            {(["STARTER", "PROFESSIONAL", "ENTERPRISE"] as PlanCode[]).map((code) => {
              const p = PLANS[code];
              const m = quote(code, "MONTHLY", 1);
              const current = sub?.plan === code;
              return (
                <div key={code} className={`rounded-xl border p-4 ${current ? "border-teal-500 ring-1 ring-teal-500" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between"><h3 className="font-semibold text-navy-900">{p.name}</h3>{current && <Badge tone="teal">Current</Badge>}</div>
                  <p className="text-xs text-slate-500">{p.audience}</p>
                  <p className="mt-2 text-lg font-semibold text-navy-900">{usd(m.unitCents)}<span className="text-xs font-normal text-slate-500"> / {p.unit} / month · annual saves 2 months</span></p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">{p.highlights.map((h) => <li key={h}>• {h}</li>)}</ul>
                  {canManage && online && (
                    <ActionForm action={checkoutAction} submitLabel={current ? "Change seats / cycle" : `Choose ${p.name}`} variant={current ? "secondary" : "teal"} className="mt-3 space-y-2">
                      <input type="hidden" name="plan" value={code} />
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Billing" name="cycle" htmlFor={`cycle-${code}`}><Select id={`cycle-${code}`} name="cycle" defaultValue="ANNUAL"><option value="MONTHLY">Monthly</option><option value="ANNUAL">Annual</option></Select></Field>
                        <Field label={p.unit === "facility" ? "Facilities" : "Employees"} name="quantity" htmlFor={`qty-${code}`}><Input id={`qty-${code}`} name="quantity" type="number" min={1} defaultValue={p.unit === "facility" ? Math.max(1, use.facilities) : Math.max(use.employees, 1)} /></Field>
                      </div>
                    </ActionForm>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            {online ? "Payments are processed securely by Stripe; card details never reach this application." : "Online payment is not configured on this platform — your platform administrator sets plans, including custom enterprise pricing."} Custom enterprise pricing and facility-based agreements are available on request. Prices are in USD and exclude applicable taxes.
          </p>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Invoices">
            <Table head={["Invoice", "Period", "Amount", "Status"]} empty={inv.length === 0 ? <EmptyState>No invoices yet.</EmptyState> : undefined}>
              {inv.map((i) => (
                <tr key={i.id}><Td>{i.hostedUrl ? <a href={i.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{i.number}</a> : i.number}</Td><Td>{fmtDate(i.periodStart)} – {fmtDate(i.periodEnd)}</Td><Td>{usd(i.amountDueCents)}</Td><Td><Badge tone={i.status === "PAID" ? "green" : i.status === "OPEN" ? "amber" : "gray"}>{i.status}</Badge></Td></tr>
              ))}
            </Table>
          </Card>
          <Card title="Payment history">
            <Table head={["Date", "Amount", "Status"]} empty={pay.length === 0 ? <EmptyState>No payments yet.</EmptyState> : undefined}>
              {pay.map((p) => (
                <tr key={p.id}><Td>{fmtDate(p.paidAt ?? p.createdAt)}</Td><Td>{usd(p.amountCents)}</Td><Td><Badge tone={p.status === "SUCCEEDED" ? "green" : "amber"}>{p.status}</Badge></Td></tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
