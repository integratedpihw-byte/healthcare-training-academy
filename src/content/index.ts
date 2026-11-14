import type { CourseContent } from "./types";
import { hipaaPrivacySecurity } from "./courses/hipaa-privacy-security";
import { oshaBloodbornePathogens } from "./courses/osha-bloodborne-pathogens";
import { standardPrecautionsPpe } from "./courses/standard-precautions-ppe";
import { infectionPreventionControl } from "./courses/infection-prevention-control";
import { abuseNeglectExploitation } from "./courses/abuse-neglect-exploitation";
import { patientRights } from "./courses/patient-rights";
import { emergencyPreparedness } from "./courses/emergency-preparedness";
import { medicationSafety } from "./courses/medication-safety";
import { vitalSigns } from "./courses/vital-signs";
import { fallPrevention } from "./courses/fall-prevention";
import { clinicalDocumentation } from "./courses/clinical-documentation";
import { hivAidsFundamentals } from "./courses/hiv-aids-fundamentals";
import { prepPepFundamentals } from "./courses/prep-pep-fundamentals";
import { labSpecimenCollection } from "./courses/lab-specimen-collection";
import { floridaAlfStaffOrientation } from "./courses/florida-alf-staff-orientation";

/**
 * Initial launch library — the 15 priority courses of spec §24, in that order.
 * All are AI-assisted drafts seeded as IN_REVIEW: they reach learners only after the
 * recorded Review → Clinical → Compliance approval chain by qualified reviewers.
 */
export const LIBRARY: CourseContent[] = [
  hipaaPrivacySecurity,
  oshaBloodbornePathogens,
  infectionPreventionControl,
  standardPrecautionsPpe,
  abuseNeglectExploitation,
  patientRights,
  emergencyPreparedness,
  medicationSafety,
  vitalSigns,
  fallPrevention,
  clinicalDocumentation,
  hivAidsFundamentals,
  prepPepFundamentals,
  labSpecimenCollection,
  floridaAlfStaffOrientation,
];
export * from "./types";
