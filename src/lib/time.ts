/**
 * Interpret a wall-clock "YYYY-MM-DDTHH:mm" in an IANA time zone (e.g. a class
 * scheduled for 9:00 in Florida) and return the UTC instant. Handles DST.
 */
export function zonedToUtc(local: string, timeZone: string): Date {
  const [d, t] = local.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const offset = (at: number) => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(at));
    const g = (k: string) => Number(parts.find((p) => p.type === k)!.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - at;
  };
  let ts = guess - offset(guess);
  ts = guess - offset(ts); // second pass settles DST transitions
  return new Date(ts);
}

/** UTC instant → "YYYY-MM-DDTHH:mm" wall clock in the zone (for form defaults). */
export function utcToZonedInput(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(date);
  const g = (k: string) => parts.find((p) => p.type === k)!.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** Time zones an organization can choose for displaying dates and times. */
export const TIME_ZONES = [
  { id: "America/New_York", label: "Eastern Time" },
  { id: "America/Chicago", label: "Central Time" },
  { id: "America/Denver", label: "Mountain Time" },
  { id: "America/Phoenix", label: "Arizona (no daylight saving)" },
  { id: "America/Los_Angeles", label: "Pacific Time" },
  { id: "America/Anchorage", label: "Alaska Time" },
  { id: "Pacific/Honolulu", label: "Hawaii Time" },
  { id: "America/Puerto_Rico", label: "Atlantic Time (Puerto Rico)" },
] as const;
export const DEFAULT_TIME_ZONE = "America/New_York";
