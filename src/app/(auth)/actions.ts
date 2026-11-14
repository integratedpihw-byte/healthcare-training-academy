"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { systemDb } from "@/db/server";
import {
  login,
  requestPasswordReset,
  resetPassword,
  revokeSession,
  sendVerificationEmail,
  emailVerificationRequired,
  verifyMfaForSession,
} from "@/lib/auth/service";
import { clearSessionCookie, requestMeta, sessionToken, setSessionCookie } from "@/lib/auth/context";
import { registerIndividual, registerOrganization } from "@/lib/tenancy/service";
import { formValues, type FormState } from "@/lib/forms";
import { rateLimit } from "@/lib/auth/rate-limit";

/** Self-registration ceiling per network address (shared NATs considered). */
async function registrationAllowed(): Promise<boolean> {
  const { ip } = await requestMeta();
  return (await rateLimit(systemDb(), `register:ip:${ip ?? "unknown"}`, 20, 60 * 60)).allowed;
}
const TOO_MANY: FormState = { error: "Too many registrations from this network. Please try again in an hour." };

/** Only allow same-site relative redirects (prevents open redirect). */
function safeNext(n: FormDataEntryValue | null): string {
  const s = typeof n === "string" ? n : "";
  // Control characters and backslashes are rejected: browsers strip or normalize them, which could turn a path into "//host".
  return /^\/(?![\/\\])[^\\\u0000-\u001f\u007f]*$/.test(s) ? s : "/dashboard";
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: z.string().email(), password: z.string().min(1).max(256) })
    .safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: "Enter your email and password.", values: formValues(fd) };

  const r = await login(systemDb(), parsed.data, await requestMeta());
  switch (r.status) {
    case "ok":
      await setSessionCookie(r.token);
      redirect(safeNext(fd.get("next")));
    case "mfa_required":
      await setSessionCookie(r.token);
      redirect(`/login/mfa?next=${encodeURIComponent(safeNext(fd.get("next")))}`);
    case "locked":
      return { error: `Too many failed attempts. This account is locked until ${r.until.toLocaleTimeString("en-US", { timeStyle: "short", timeZone: "America/New_York" }) + " ET"}.`, values: formValues(fd) };
    case "rate_limited":
      return { error: `Too many sign-in attempts. Try again in ${Math.ceil(r.retryAfterSeconds / 60)} minute(s).`, values: formValues(fd) };
    default:
      return { error: "Incorrect email or password.", values: formValues(fd) };
  }
}

export async function mfaAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = await sessionToken();
  if (!token) redirect("/login");
  const code = String(fd.get("code") ?? "").replace(/\s/g, "");
  const r = await verifyMfaForSession(systemDb(), token, code, await requestMeta());
  if (r === "ok") redirect(safeNext(fd.get("next")));
  return { error: r === "rate_limited" ? "Too many attempts. Wait a few minutes and try again." : "That code is not valid. Check your authenticator app, or use an unused recovery code." };
}

export async function logoutAction() {
  const token = await sessionToken();
  if (token) await revokeSession(systemDb(), token);
  await clearSessionCookie();
  redirect("/login?signedOut=1");
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "");
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email address." };
  await requestPasswordReset(systemDb(), email, await requestMeta());
  return { ok: true, message: "If an account exists for that email, a reset link has been sent. The link expires in 30 minutes." };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  if (password !== String(fd.get("confirm") ?? "")) return { error: "Passwords do not match.", fieldErrors: { confirm: ["Passwords do not match"] } };
  const r = await resetPassword(systemDb(), token, password);
  if (!r.ok) return { error: r.error, fieldErrors: r.issues ? { password: r.issues } : undefined };
  redirect("/login?reset=1");
}

export async function registerOrganizationAction(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("password") !== fd.get("confirm")) return { error: "Passwords do not match.", fieldErrors: { confirm: ["Passwords do not match"] }, values: formValues(fd) };
  if (!(await registrationAllowed())) return { ...TOO_MANY, values: formValues(fd) };
  const r = await registerOrganization(
    systemDb(),
    {
      organizationName: fd.get("organizationName"),
      legalName: fd.get("legalName") || undefined,
      facilityName: fd.get("facilityName"),
      facilityType: fd.get("facilityType"),
      licenseNumber: fd.get("licenseNumber") ?? "",
      state: fd.get("state") || "FL",
      city: fd.get("city") ?? "",
      phone: fd.get("phone") ?? "",
      adminFirstName: fd.get("adminFirstName"),
      adminLastName: fd.get("adminLastName"),
      adminEmail: fd.get("adminEmail"),
      password: fd.get("password"),
      plan: fd.get("plan") || "STARTER",
      acceptTerms: fd.get("acceptTerms") === "on",
    },
    await requestMeta(),
  );
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  const l = await login(systemDb(), { email: String(fd.get("adminEmail")), password: String(fd.get("password")) }, await requestMeta());
  if (l.status === "ok") await setSessionCookie(l.token);
  await sendVerificationEmail(systemDb(), r.data.userId);
  redirect(emailVerificationRequired() ? "/account/verify-email?sent=1" : "/account/organization-status?registered=1");
}

export async function registerIndividualAction(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("password") !== fd.get("confirm")) return { error: "Passwords do not match.", fieldErrors: { confirm: ["Passwords do not match"] }, values: formValues(fd) };
  if (!(await registrationAllowed())) return { ...TOO_MANY, values: formValues(fd) };
  const r = await registerIndividual(systemDb(), {
    firstName: fd.get("firstName"),
    lastName: fd.get("lastName"),
    email: fd.get("email"),
    password: fd.get("password"),
    state: fd.get("state") || "FL",
    acceptTerms: fd.get("acceptTerms") === "on",
  });
  if (!r.ok) return { error: r.error, fieldErrors: r.fieldErrors, values: formValues(fd) };
  const l = await login(systemDb(), { email: String(fd.get("email")), password: String(fd.get("password")) }, await requestMeta());
  if (l.status === "ok") await setSessionCookie(l.token);
  await sendVerificationEmail(systemDb(), r.data.userId);
  redirect(emailVerificationRequired() ? "/account/verify-email?sent=1" : "/dashboard");
}

export async function resendVerificationAction(): Promise<void> {
  const token = await sessionToken();
  const { resolveSession } = await import("@/lib/auth/service");
  const s = await resolveSession(systemDb(), token);
  if (!s) redirect("/login");
  const sent = await sendVerificationEmail(systemDb(), s.userId);
  redirect(`/account/verify-email?${sent ? "sent=1" : "throttled=1"}`);
}
