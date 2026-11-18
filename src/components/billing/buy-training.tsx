import { ActionForm } from "@/components/action-form";
import { Field, Input, Select } from "@/components/ui";
import { usd } from "@/lib/billing/commerce";
import { buyCourseForSelfAction, buyTrainingAction } from "@/app/(app)/billing/actions";

type Item = { value: string; label: string };

/** Course-seat / package purchase form (billing.manage only). */
export function BuyTraining({ items, online, back = "/billing", fixed }: { items: Item[]; online: boolean; back?: string; fixed?: Item }) {
  return (
    <ActionForm action={buyTrainingAction} submitLabel={online ? "Continue to payment" : "Place order"} pendingText="Placing order…" className="space-y-3">
      <input type="hidden" name="back" value={back} />
      {fixed ? (
        <input type="hidden" name="item" value={fixed.value} />
      ) : (
        <Field label="Course or package" name="item">
          <Select id="item" name="item" required>
            {items.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </Select>
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Seats" name="quantity" hint="One seat = one learner enrollment"><Input id="quantity" name="quantity" type="number" min={1} max={10000} defaultValue={1} required /></Field>
        <Field label="Promo code" name="promoCode"><Input id="promoCode" name="promoCode" autoComplete="off" /></Field>
      </div>
      {online && (
        <Field label="Payment" name="method">
          <Select id="method" name="method"><option value="STRIPE">Pay now by card</option><option value="INVOICE">Send an invoice</option></Select>
        </Field>
      )}
    </ActionForm>
  );
}

export const itemLabel = (name: string, cents: number, extra?: string) => `${name} — ${usd(cents)} per seat${extra ? ` (${extra})` : ""}`;

/** One seat for the signed-in individual learner. */
export function BuySeatForSelf({ courseId, priceCents, online }: { courseId: string; priceCents: number; online: boolean }) {
  return (
    <ActionForm action={buyCourseForSelfAction} submitLabel={online ? `Buy for ${usd(priceCents)}` : `Request this course (${usd(priceCents)})`} pendingText="Placing order…" className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      <Field label="Promo code" name="promoCode"><Input id="promoCode" name="promoCode" autoComplete="off" /></Field>
    </ActionForm>
  );
}
