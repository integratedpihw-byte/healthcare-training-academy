"use server";

import { revalidatePath } from "next/cache";
import { systemDb } from "@/db/server";
import { requirePlatformAdmin } from "@/lib/auth/context";
import { cancelOrder, createPromo, fulfillOrder, refundOrder, savePackage, setCoursePrice, setPackageActive, setPromoActive } from "@/lib/billing/commerce";
import { formValues, type FormState } from "@/lib/forms";
import { courseOrders } from "@/db/schema";
import { eq } from "drizzle-orm";

const UUID = /^[0-9a-f-]{36}$/i;
const obj = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")));
const done = (message: string): FormState => {
  revalidatePath("/platform/revenue");
  return { ok: true, message };
};

export async function setPriceAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const clear = fd.get("clear") === "1";
  const r = await setCoursePrice(systemDb(), ctx.user.id, { courseId: fd.get("courseId"), price: clear ? 0 : fd.get("price") }, clear);
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  return done(clear ? "Price removed — the course is included for everyone." : "Price saved.");
}

export async function savePackageAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const r = await savePackage(systemDb(), ctx.user.id, { ...obj(fd), courseIds: fd.getAll("courseIds").map(String) });
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  return done("Package saved.");
}

export async function togglePackageAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const id = String(fd.get("id"));
  if (!UUID.test(id)) return { error: "Invalid request." };
  await setPackageActive(systemDb(), ctx.user.id, id, fd.get("active") === "1");
  return done("Package updated.");
}

export async function createPromoAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const r = await createPromo(systemDb(), ctx.user.id, obj(fd));
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  return done("Promo code created.");
}

export async function togglePromoAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const id = String(fd.get("id"));
  if (!UUID.test(id)) return { error: "Invalid request." };
  await setPromoActive(systemDb(), ctx.user.id, id, fd.get("active") === "1");
  return done("Promo code updated.");
}

export async function markPaidAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const id = String(fd.get("orderId"));
  if (!UUID.test(id)) return { error: "Invalid request." };
  const reference = String(fd.get("reference") ?? "").trim();
  if (reference.length < 3) return { error: "Enter the payment reference (check or transfer number)." };
  const [o] = await systemDb().select({ m: courseOrders.paymentMethod }).from(courseOrders).where(eq(courseOrders.id, id));
  if (!o) return { error: "Order not found." };
  const r = await fulfillOrder(systemDb(), id, { method: o.m === "INVOICE" ? "INVOICE" : "MANUAL", actorUserId: ctx.user.id, note: `Payment received: ${reference.slice(0, 200)}` });
  return r.fulfilled ? done("Order marked paid; seats are available.") : { error: `This order is already ${r.status.toLowerCase().replace("_", " ")}.` };
}

export async function cancelOrderAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const id = String(fd.get("orderId"));
  if (!UUID.test(id)) return { error: "Invalid request." };
  const r = await cancelOrder(systemDb(), ctx.user.id, id);
  return r.ok ? done("Order cancelled.") : { error: r.error };
}

export async function refundAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePlatformAdmin();
  const id = String(fd.get("orderId"));
  if (!UUID.test(id)) return { error: "Invalid request." };
  try {
    const r = await refundOrder(systemDb(), ctx.user.id, id, obj(fd));
    if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
    return done(r.data.status === "REFUNDED" ? "Refunded in full. Unused seats were withdrawn; learners already enrolled keep their records." : "Partial refund recorded.");
  } catch (e) {
    return { error: e instanceof Error ? `Stripe refused the refund: ${e.message}` : "Refund failed." };
  }
}
