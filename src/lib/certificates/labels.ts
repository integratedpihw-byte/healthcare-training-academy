import type { Tone } from "@/components/ui";
export const CERT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "green" },
  EXPIRED: { label: "Expired", tone: "amber" },
  SUPERSEDED: { label: "Superseded", tone: "gray" },
  REVOKED: { label: "Revoked", tone: "red" },
};
export const CERT_KIND: Record<string, string> = {
  COURSE_COMPLETION: "Course completion",
  CONTINUING_EDUCATION: "Continuing education",
  COMPETENCY_VERIFICATION: "Competency verification",
};
