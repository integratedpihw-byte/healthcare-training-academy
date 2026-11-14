/**
 * Transactional email abstraction. EMAIL_PROVIDER=console logs messages (development);
 * EMAIL_PROVIDER=resend sends through Resend's HTTP API. Add providers by implementing send().
 * Never put PHI in email bodies.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  delivered: boolean;
  provider: string;
  id?: string;
}

/** In-memory outbox for the console provider (inspected by tests). */
export const consoleOutbox: EmailMessage[] = [];

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  if (provider === "resend") {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      }),
    });
    if (!res.ok) throw new Error(`Email send failed: ${res.status}`);
    const body = (await res.json()) as { id?: string };
    return { delivered: true, provider, id: body.id };
  }
  consoleOutbox.push(msg);
  if (consoleOutbox.length > 100) consoleOutbox.shift();
  if (process.env.NODE_ENV !== "test") {
    console.info(`[email:console] to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
  }
  return { delivered: true, provider: "console" };
}
