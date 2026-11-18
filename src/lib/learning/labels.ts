import type { Tone } from "@/components/ui";

export const DEPARTMENT_LABEL: Record<string, string> = {
  MANDATORY_COMPLIANCE: "Mandatory Compliance",
  CLINICAL_PATIENT_CARE: "Clinical Patient Care",
  HIV_INFECTIOUS_DISEASE: "HIV/AIDS & Infectious Disease",
  LABORATORY_PHLEBOTOMY: "Laboratory & Phlebotomy",
  MEDICATION_MANAGEMENT: "Medication Management",
  SPECIALIZED_EDUCATION: "Specialized Education",
  FACILITY_PROGRAM: "Facility Programs",
  EMERGENCY_MANAGEMENT: "Emergency Management & Response",
  PUBLIC_HEALTH: "Public Health Practice",
  CASE_MANAGEMENT: "Case Management & Care Coordination",
  HOME_HEALTH: "Home Health Worker Training",
  MENTAL_HEALTH: "Mental Health & Behavioral Health",
};

export const ENROLLMENT_LABEL: Record<string, { label: string; tone: Tone }> = {
  NOT_STARTED: { label: "Not started", tone: "gray" },
  IN_PROGRESS: { label: "In progress", tone: "blue" },
  AWAITING_ASSESSMENT: { label: "Final exam pending", tone: "amber" },
  COMPLETED: { label: "Completed", tone: "green" },
  FAILED: { label: "Failed", tone: "red" },
  WITHDRAWN: { label: "Withdrawn", tone: "gray" },
};

export const LESSON_TYPE_LABEL: Record<string, string> = {
  TEXT: "Reading",
  PRESENTATION: "Presentation",
  VIDEO: "Video",
  ILLUSTRATION: "Illustrated lesson",
  INTERACTIVE: "Interactive activity",
  CASE_STUDY: "Case study",
  KNOWLEDGE_CHECK: "Knowledge check",
  DOWNLOAD: "Download",
};

export const CONTENT_STATUS_TONE: Record<string, Tone> = {
  DRAFT: "gray",
  IN_REVIEW: "amber",
  CLINICAL_APPROVED: "blue",
  COMPLIANCE_APPROVED: "blue",
  PUBLISHED: "green",
  ARCHIVED: "gray",
};

export function minutes(m: number) {
  return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`;
}
