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
import { icsIntroduction } from "./courses/public-health/ics-introduction";
import { icsInitialResponse } from "./courses/public-health/ics-initial-response";
import { nimsIntroduction } from "./courses/public-health/nims-introduction";
import { nrfIntroduction } from "./courses/public-health/nrf-introduction";
import { phEmergencyResponse } from "./courses/public-health/ph-emergency-response";
import { phFoundations } from "./courses/public-health/ph-foundations";
import { epidemiologySurveillance } from "./courses/public-health/epidemiology-surveillance";
import { riskCommunication } from "./courses/public-health/risk-communication";
import { healthEquitySdoh } from "./courses/public-health/health-equity-sdoh";
import { culturalLinguisticCompetence } from "./courses/public-health/cultural-linguistic-competence";
import { caseManagementFundamentals } from "./courses/public-health/case-management-fundamentals";
import { ryanWhiteCaseManagement } from "./courses/public-health/ryan-white-case-management";
import { motivationalInterviewingTransitions } from "./courses/public-health/motivational-interviewing-transitions";
import { hhaTraining } from "./courses/home-health/hha-training";
import { personalCareAssistant } from "./courses/home-health/personal-care-assistant";
import { dementiaCare } from "./courses/home-health/dementia-care";
import { medicationAssistance } from "./courses/home-health/medication-assistance";
import { homeInfectionControl } from "./courses/home-health/infection-control-safety";
import { specializedHomeHealth } from "./courses/home-health/specialized-home-health";
import { mhFundamentals } from "./courses/mental-health/mh-fundamentals";
import { crisisAwareness } from "./courses/mental-health/crisis-awareness";
import { mhSupportWorker } from "./courses/mental-health/support-worker";
import { substanceUse } from "./courses/mental-health/substance-use";
import { traumaInformedCare } from "./courses/mental-health/trauma-informed-care";
import { suicidePrevention } from "./courses/mental-health/suicide-prevention";

/**
 * Library: the 15 priority launch courses of spec §24, followed by the public health
 * workforce expansion (emergency management, public health practice, case management).
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
  // Public health workforce expansion
  icsIntroduction,
  icsInitialResponse,
  nimsIntroduction,
  nrfIntroduction,
  phEmergencyResponse,
  phFoundations,
  epidemiologySurveillance,
  riskCommunication,
  healthEquitySdoh,
  culturalLinguisticCompetence,
  caseManagementFundamentals,
  ryanWhiteCaseManagement,
  motivationalInterviewingTransitions,
  // Home Health division
  hhaTraining,
  personalCareAssistant,
  dementiaCare,
  medicationAssistance,
  homeInfectionControl,
  specializedHomeHealth,
  // Mental Health division
  mhFundamentals,
  crisisAwareness,
  mhSupportWorker,
  substanceUse,
  traumaInformedCare,
  suicidePrevention,
];
export * from "./types";
