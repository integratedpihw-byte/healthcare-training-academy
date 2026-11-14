export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
} | undefined;

export function formValues(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  // Repeated keys (checkbox groups) are joined with newlines.
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$") && k !== "password" && k !== "confirm") o[k] = k in o ? `${o[k]}\n${v}` : v;
  return o;
}

/** Database error text, unwrapping the driver error that Drizzle attaches as `cause`. */
export function dbErrorMessage(e: unknown): string {
  if (!(e instanceof Error)) return "";
  const c = (e as Error & { cause?: unknown }).cause;
  return `${e.message} ${c instanceof Error ? c.message : ""}`;
}
