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
  COMPETENCY_VERIFICATION: "Competency",
  PROFESSIONAL_DEVELOPMENT: "Professional development",
  INSTRUCTOR: "Instructor",
  SPECIALIZED_TRAINING: "Specialized training",
};
/** Title printed at the top of each certificate type (brief §4). */
export const CERT_TITLE: Record<string, string> = {
  COURSE_COMPLETION: "Certificate of Course Completion",
  CONTINUING_EDUCATION: "Continuing Education Certificate",
  COMPETENCY_VERIFICATION: "Certificate of Competency",
  PROFESSIONAL_DEVELOPMENT: "Professional Development Certificate",
  INSTRUCTOR: "Instructor Certificate",
  SPECIALIZED_TRAINING: "Specialized Training Certificate",
};
export const PROGRAM_LABEL: Record<string, { label: string; help: string }> = {
  GENERAL_EDUCATION: { label: "General education", help: "Educational course. Not a license, state certification or occupational credential." },
  EMPLOYER_REQUIRED: { label: "Employer-required training", help: "Training that employers commonly require. Completion is documented for the employer's records." },
  STATE_REGULATED_TRAINING: { label: "Supports state-regulated training", help: "Covers topics a state rule requires, but completing it here does not by itself meet the rule. See the course notice for what else is needed." },
  STATE_APPROVED_PROGRAM: { label: "State-approved program", help: "Approved by the state body named in the approval record." },
  CONTINUING_EDUCATION: { label: "Continuing education", help: "Approved for continuing education credit by the provider named in the approval record." },
  PROFESSION_SPECIFIC: { label: "Profession-specific training", help: "Training for a specific occupation. Not a license or certification." },
};
