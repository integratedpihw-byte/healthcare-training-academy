/**
 * Platform regulatory library — Florida and federal (spec §11).
 *
 * Research date: 2026-11-13. Each rule records exactly what the source says about
 * audience, initial timing and frequency. Where the source sets no recurring interval,
 * frequencyMonths is null (the database refuses an unverified frequency). Rules whose
 * text could not be confirmed against a source are NEEDS_REVIEW and assert nothing.
 *
 * IMPORTANT: this library was compiled with AI-assisted research. It is a starting
 * point for a qualified compliance reviewer, not legal advice. Applicability (e.g.
 * whether an organization is a HIPAA covered entity) must be decided by each
 * organization in the Compliance Center, and recorded with a rationale.
 */
import type { FacilityType } from "@/db/schema/_shared";

export type Category = "AHCA" | "FL_DOH" | "FL_BON" | "FL_BOP" | "FL_DCF" | "CMS" | "HRSA" | "OSHA" | "HHS_OCR" | "CDC" | "HIPAA" | "MEDICARE_MEDICAID" | "PROGRAM_340B";
export type Kind = "TRAINING_MANDATE" | "CONTINUING_EDUCATION" | "COMPETENCY_ASSESSMENT" | "PROGRAM_REQUIREMENT" | "GUIDANCE" | "NO_TRAINING_MANDATE_IDENTIFIED";

export interface SourceDef {
  key: string;
  agency: string;
  category: Category;
  jurisdiction: "FEDERAL" | "FL";
  sourceKind: "STATUTE" | "REGULATION" | "GUIDANCE" | "PROGRAM_MANUAL";
  title: string;
  url: string;
  isOfficial: boolean;
  notes?: string;
}

export interface RuleDef {
  source: string;
  category: Category;
  kind: Kind;
  jurisdiction: "FEDERAL" | "FL";
  agency: string;
  citation: string;
  title: string;
  requirementText: string;
  audienceText: string;
  facilityTypes?: FacilityType[];
  facilityLicenseTypes?: string[];
  positionCodes?: string[];
  jobDuties?: string[];
  requiresClinicalExposure?: boolean;
  requiresBloodborneExposure?: boolean;
  /** Only when the source states a recurring interval. */
  frequencyMonths?: number;
  frequencyText: string;
  initialTimingText: string;
  /** Only when the source states a day count from hire/assignment. */
  initialDueDaysFromHire?: number;
  effectiveDate?: string;
  status: "VERIFIED" | "NEEDS_REVIEW";
  verificationNote: string;
  pendingChangeNote?: string;
  suggestedCourseCodes?: string[];
}

export const RESEARCH_DATE = "2026-11-13";
export const REVIEWER_PLACEHOLDER = "Platform regulatory research (AI-assisted) — assign a qualified compliance reviewer";

/** Job-duty tags used by rules; employees carry them in job_duties. */
export const JOB_DUTY_TAGS: { code: string; label: string }[] = [
  { code: "PERSONAL_CARE", label: "Provides personal care / regular resident or patient contact" },
  { code: "MEDICATION_ASSISTANCE", label: "Assists with self-administration of medication" },
  { code: "FOOD_SERVICE", label: "Prepares or serves food" },
  { code: "RESPIRATOR_USE", label: "Required to wear a respirator" },
  { code: "HAZARDOUS_CHEMICALS", label: "Works with hazardous chemicals" },
  { code: "HIGH_COMPLEXITY_TESTING", label: "Performs high-complexity laboratory testing" },
  { code: "VACCINE_COORDINATOR", label: "Primary or backup vaccine coordinator" },
  { code: "PATIENT_INTERACTION", label: "Interacts with patients (civil rights training scope)" },
  { code: "BILLING", label: "Billing and collections" },
];

/** Facility license-type tags used by rules; facilities carry one in license_type. */
export const LICENSE_TYPE_TAGS: { code: string; label: string }[] = [
  { code: "ALF_STANDARD", label: "Assisted living facility (standard license)" },
  { code: "ALF_SPECIALIZED_DEMENTIA", label: "ALF advertising specialized Alzheimer's/dementia care or with secured areas" },
  { code: "MEDICARE_ADVANTAGE_ORGANIZATION", label: "Medicare Advantage organization" },
  { code: "CLIA_HIGH_COMPLEXITY", label: "CLIA high-complexity laboratory" },
  { code: "VFC_PROVIDER", label: "Vaccines for Children program provider" },
  { code: "340B_COVERED_ENTITY", label: "340B covered entity" },
];

const OSHA = (n: string) => `https://www.osha.gov/laws-regs/regulations/standardnumber/1910/${n}`;
const LII_CFR = (t: number, s: string) => `https://www.law.cornell.edu/cfr/text/${t}/${s}`;
const FL_STAT = (ch: string, sec: string) =>
  `http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=${ch}/${sec.split(".")[0].padStart(4, "0")}/Sections/${sec.split(".")[0].padStart(4, "0")}.${sec.split(".")[1]}.html`;

export const SOURCES: SourceDef[] = [
  { key: "osha-1030", agency: "OSHA", category: "OSHA", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "29 CFR 1910.1030 — Bloodborne pathogens", url: OSHA("1910.1030"), isOfficial: true },
  { key: "osha-1200", agency: "OSHA", category: "OSHA", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "29 CFR 1910.1200 — Hazard communication", url: OSHA("1910.1200"), isOfficial: true },
  { key: "osha-134", agency: "OSHA", category: "OSHA", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "29 CFR 1910.134 — Respiratory protection", url: OSHA("1910.134"), isOfficial: true },
  { key: "hipaa-530", agency: "HHS Office for Civil Rights", category: "HIPAA", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "45 CFR 164.530 — Administrative requirements (Privacy Rule)", url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-E/section-164.530", isOfficial: true },
  { key: "hipaa-308", agency: "HHS Office for Civil Rights", category: "HIPAA", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "45 CFR 164.308 — Administrative safeguards (Security Rule)", url: LII_CFR(45, "164.308"), isOfficial: false, notes: "Cornell LII copy of the CFR; official text at ecfr.gov." },
  { key: "ocr-1557", agency: "HHS Office for Civil Rights", category: "HHS_OCR", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "45 CFR 92.9 — Training (Section 1557 nondiscrimination)", url: LII_CFR(45, "92.9"), isOfficial: false, notes: "Cornell LII copy of the CFR." },
  { key: "cms-48395", agency: "CMS", category: "CMS", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "42 CFR 483.95 — Training requirements (long-term care facilities)", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-B/section-483.95", isOfficial: true },
  { key: "cms-48373", agency: "CMS", category: "CMS", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "42 CFR 483.73 — Emergency preparedness (long-term care facilities)", url: LII_CFR(42, "483.73"), isOfficial: false },
  { key: "cms-48215", agency: "CMS", category: "CMS", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "42 CFR 482.15 — Emergency preparedness (hospitals)", url: LII_CFR(42, "482.15"), isOfficial: false },
  { key: "cms-484102", agency: "CMS", category: "CMS", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "42 CFR 484.102 — Emergency preparedness (home health agencies)", url: LII_CFR(42, "484.102"), isOfficial: false },
  { key: "cms-48480", agency: "CMS", category: "CMS", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "42 CFR 484.80 — Home health aide services", url: LII_CFR(42, "484.80"), isOfficial: false },
  { key: "cms-4931451", agency: "CMS (CLIA)", category: "CMS", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "42 CFR 493.1451 — Technical supervisor responsibilities (high complexity testing)", url: LII_CFR(42, "493.1451"), isOfficial: false },
  { key: "cms-422503", agency: "CMS", category: "MEDICARE_MEDICAID", jurisdiction: "FEDERAL", sourceKind: "REGULATION", title: "42 CFR 422.503 — General provisions (Medicare Advantage compliance program)", url: LII_CFR(42, "422.503"), isOfficial: false },
  { key: "hrsa-340b-guide", agency: "HRSA Office of Pharmacy Affairs", category: "PROGRAM_340B", jurisdiction: "FEDERAL", sourceKind: "GUIDANCE", title: "340B Compliance Improvement Guide (HRSA, Oct. 2015)", url: "https://hrsa.gov/sites/default/files/hrsa/opa/compliance-improvement-guide.pdf", isOfficial: true },
  { key: "hrsa-hc-manual", agency: "HRSA Bureau of Primary Health Care", category: "HRSA", jurisdiction: "FEDERAL", sourceKind: "PROGRAM_MANUAL", title: "Health Center Program Compliance Manual", url: "https://bphc.hrsa.gov/compliance/compliance-manual", isOfficial: true, notes: "Not yet reviewed for staff training obligations." },
  { key: "cdc-vfc", agency: "CDC", category: "CDC", jurisdiction: "FEDERAL", sourceKind: "PROGRAM_MANUAL", title: "Vaccines for Children (VFC) program — provider requirements", url: "https://www.cdc.gov/vaccines-for-children/hcp/index.html", isOfficial: true, notes: "Annual coordinator training is documented by state VFC programs; confirm in the current CDC VFC Operations Guide." },
  { key: "cdc-core-ipc", agency: "CDC", category: "CDC", jurisdiction: "FEDERAL", sourceKind: "GUIDANCE", title: "CDC Core Infection Prevention and Control Practices for Safe Healthcare Delivery", url: "https://www.cdc.gov/infection-control/hcp/core-practices/index.html", isOfficial: true, notes: "Guidance, not regulation." },
  { key: "fs-429-52", agency: "Florida Legislature / AHCA", category: "AHCA", jurisdiction: "FL", sourceKind: "STATUTE", title: "s. 429.52, F.S. — Staff training and educational requirements (assisted living)", url: FL_STAT("0400-0499", "429.52"), isOfficial: true },
  { key: "fac-59a-36-011", agency: "AHCA", category: "AHCA", jurisdiction: "FL", sourceKind: "REGULATION", title: "Rule 59A-36.011, F.A.C. — Staff training requirements and competency test (ALF)", url: "https://www.flrules.org/gateway/ruleNo.asp?id=59A-36.011", isOfficial: true, notes: "Last amended 6-5-2024 (flrules.org). Rule text reviewed on the Cornell LII copy." },
  { key: "fs-430-5025", agency: "Florida Department of Elder Affairs / AHCA", category: "AHCA", jurisdiction: "FL", sourceKind: "STATUTE", title: "s. 430.5025, F.S. — Alzheimer's disease and related forms of dementia education and training", url: FL_STAT("0400-0499", "430.5025"), isOfficial: true },
  { key: "fs-400-211", agency: "Florida Legislature / AHCA", category: "AHCA", jurisdiction: "FL", sourceKind: "STATUTE", title: "s. 400.211, F.S. — Nursing home personnel; certified nursing assistant in-service", url: FL_STAT("0400-0499", "400.211"), isOfficial: true },
  { key: "fs-381-0035", agency: "Florida Department of Health", category: "FL_DOH", jurisdiction: "FL", sourceKind: "STATUTE", title: "s. 381.0035, F.S. — Educational course on HIV and AIDS; employees", url: FL_STAT("0300-0399", "381.0035"), isOfficial: true },
  { key: "fs-456-0341", agency: "Florida Department of Health", category: "FL_DOH", jurisdiction: "FL", sourceKind: "STATUTE", title: "s. 456.0341, F.S. — Human trafficking education for licensees", url: FL_STAT("0400-0499", "456.0341"), isOfficial: true },
  { key: "fac-64b9-5-002", agency: "Florida Board of Nursing", category: "FL_BON", jurisdiction: "FL", sourceKind: "REGULATION", title: "Rule 64B9-5.002, F.A.C. — Continuing education requirements (nursing)", url: "https://www.flrules.org/gateway/ruleNo.asp?id=64B9-5.002", isOfficial: true, notes: "Rule text not yet reviewed; last amended 7-30-2019; Board development notice dated 5-15-2024." },
  { key: "fs-465-009", agency: "Florida Board of Pharmacy", category: "FL_BOP", jurisdiction: "FL", sourceKind: "STATUTE", title: "s. 465.009, F.S. — Continuing professional pharmaceutical education", url: FL_STAT("0400-0499", "465.009"), isOfficial: true, notes: "Not yet reviewed." },
  { key: "fl-dcf", agency: "Florida Department of Children and Families", category: "FL_DCF", jurisdiction: "FL", sourceKind: "GUIDANCE", title: "DCF-licensed and contracted programs — staff training rules (F.A.C. chapters 65D/65E)", url: "https://www.myflfamilies.com/", isOfficial: true, notes: "Not yet reviewed." },
];

const ALF: FacilityType[] = ["ASSISTED_LIVING_FACILITY"];
const ALF_DIRECT_CARE = "Direct care staff of an assisted living facility, other than nurses, certified nursing assistants, or home health aides trained under Rule 59A-8.0095, F.A.C.";
const SB1404 = "AHCA development notice of 10-28-2026 (Vol. 52/210) proposes amending chapter 59A-36 to implement 2026-102 L.O.F. (SB 1404). Re-verify when adopted.";
const LII_NOTE = "Text confirmed on the Cornell LII copy of the regulation; confirm against the official publisher before relying on it.";

export const RULES: RuleDef[] = [
  // ---------------------------------------------------------------- OSHA
  {
    source: "osha-1030", category: "OSHA", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "OSHA",
    citation: "29 CFR 1910.1030(g)(2)", title: "Bloodborne pathogens training",
    requirementText: "Train each employee with occupational exposure, at no cost and during working hours, on the elements listed in (g)(2)(vii); additional training when tasks or procedures change and affect exposure.",
    audienceText: "Employees with occupational exposure to blood or other potentially infectious materials.",
    requiresBloodborneExposure: true, frequencyMonths: 12,
    frequencyText: "At least annually thereafter; annual training within one year of the previous training.",
    initialTimingText: "At the time of initial assignment to tasks where occupational exposure may take place.", initialDueDaysFromHire: 0,
    status: "VERIFIED", verificationNote: "Paragraphs (g)(2)(i), (ii), (iv) and (v) confirmed on osha.gov.", suggestedCourseCodes: ["CHITA-MC-004"],
  },
  {
    source: "osha-1200", category: "OSHA", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "OSHA",
    citation: "29 CFR 1910.1200(h)(1)", title: "Hazard communication training",
    requirementText: "Provide effective information and training on hazardous chemicals in the work area (may be by hazard category or specific chemical).",
    audienceText: "Employees exposed to hazardous chemicals in their work area.", jobDuties: ["HAZARDOUS_CHEMICALS"],
    frequencyText: "No recurring interval; repeat whenever a new chemical hazard the employee has not been trained on is introduced.",
    initialTimingText: "At the time of initial assignment.", initialDueDaysFromHire: 0,
    status: "VERIFIED", verificationNote: "Paragraph (h)(1) confirmed on osha.gov.",
  },
  {
    source: "osha-134", category: "OSHA", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "OSHA",
    citation: "29 CFR 1910.134(k)", title: "Respiratory protection training",
    requirementText: "Each employee required to use a respirator must be able to demonstrate knowledge of the items in (k)(1) (need, limitations, fit, use, maintenance, medical signs).",
    audienceText: "Employees required to use respirators.", jobDuties: ["RESPIRATOR_USE"], frequencyMonths: 12,
    frequencyText: "Retraining annually, and when workplace or respirator changes, inadequate knowledge or other situations make it necessary.",
    initialTimingText: "Before the employee is required to use a respirator in the workplace.", initialDueDaysFromHire: 0,
    status: "VERIFIED", verificationNote: "Paragraphs (k)(1) and (k)(5) confirmed on osha.gov. Fit testing (1910.134(f)) is a separate annual requirement not tracked as training.",
  },
  // ---------------------------------------------------------------- HIPAA / OCR
  {
    source: "hipaa-530", category: "HIPAA", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "HHS Office for Civil Rights",
    citation: "45 CFR 164.530(b)", title: "HIPAA Privacy Rule workforce training",
    requirementText: "Train all workforce members on the covered entity's policies and procedures for protected health information, as necessary and appropriate for their functions; document the training.",
    audienceText: "All members of a HIPAA covered entity's workforce. Applicability depends on covered-entity (or business associate) status — decide in the Compliance Center.",
    frequencyText: "No recurring interval specified. Annual refreshers are common practice, not a requirement of this paragraph.",
    initialTimingText: "New workforce members within a reasonable period of time after joining; affected members within a reasonable period after a material change in policies.",
    status: "VERIFIED", verificationNote: "Paragraph (b)(1)–(b)(2) confirmed on eCFR (official).", suggestedCourseCodes: ["CHITA-MC-001"],
  },
  {
    source: "hipaa-308", category: "HIPAA", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "HHS Office for Civil Rights",
    citation: "45 CFR 164.308(a)(5)", title: "HIPAA Security Rule security awareness and training",
    requirementText: "Implement a security awareness and training program for all workforce members, including management. Addressable specifications: security reminders, protection from malicious software, log-in monitoring, password management.",
    audienceText: "All workforce members (including management) of a covered entity or business associate.",
    frequencyText: "No interval specified; security reminders are to be 'periodic'.",
    initialTimingText: "Not specified.",
    status: "VERIFIED", verificationNote: LII_NOTE, suggestedCourseCodes: ["CHITA-MC-001"],
  },
  {
    source: "ocr-1557", category: "HHS_OCR", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "HHS Office for Civil Rights",
    citation: "45 CFR 92.9", title: "Section 1557 civil rights policies training",
    requirementText: "Train relevant employees on the civil rights policies and procedures required by 45 CFR 92.8, to the extent needed for their functions; document the training.",
    audienceText: "Relevant employees of a covered entity: those whose roles involve interacting with patients, plus leadership, legal counsel and billing/collections staff.",
    jobDuties: ["PATIENT_INTERACTION", "BILLING"],
    frequencyText: "No recurring interval; new relevant employees within a reasonable period after joining; affected employees after a material policy change.",
    initialTimingText: "No later than 30 days after implementing the § 92.8 policies, and no later than 300 days after July 5, 2024.",
    effectiveDate: "2024-07-05",
    status: "VERIFIED", verificationNote: LII_NOTE,
    pendingChangeNote: "Portions of the 2024 Section 1557 final rule have been subject to litigation and court stays. Confirm current enforceability with counsel before relying on this rule.",
  },
  // ---------------------------------------------------------------- CMS
  {
    source: "cms-48395", category: "CMS", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "CMS",
    citation: "42 CFR 483.95(a)–(f), (i)", title: "Long-term care facility training program topics",
    requirementText: "Training program for staff covering communication (direct care staff), resident rights and facility responsibilities, abuse/neglect/exploitation (including dementia management and abuse prevention), QAPI, infection control, compliance and ethics, and behavioral health.",
    audienceText: "All new and existing staff, contractors and volunteers of Medicare/Medicaid long-term care facilities, consistent with their roles.",
    facilityTypes: ["SKILLED_NURSING_FACILITY"],
    frequencyText: "No general interval stated; compliance and ethics training must be annual for operating organizations with five or more facilities (483.95(f)). Amount and frequency are otherwise based on the facility assessment.",
    initialTimingText: "Not specified as a day count.",
    status: "VERIFIED", verificationNote: "Section 483.95 structure confirmed on eCFR (official).", suggestedCourseCodes: ["CHITA-MC-001", "CHITA-MC-006"],
  },
  {
    source: "cms-48395", category: "CMS", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "CMS",
    citation: "42 CFR 483.95(g)", title: "Nurse aide in-service training (12 hours per year)",
    requirementText: "In-service training sufficient to ensure continuing competence of nurse aides, no less than 12 hours per year, including dementia management and resident abuse prevention, and areas of weakness identified in performance reviews.",
    audienceText: "Nurse aides in long-term care facilities.", facilityTypes: ["SKILLED_NURSING_FACILITY"], positionCodes: ["CNA"],
    frequencyMonths: 12, frequencyText: "No less than 12 hours per year.", initialTimingText: "Ongoing during employment.",
    status: "VERIFIED", verificationNote: "Paragraph (g)(1) quoted from eCFR (official). Hours-based: track total in-service hours, not a single course.",
  },
  {
    source: "cms-48373", category: "CMS", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "CMS",
    citation: "42 CFR 483.73(d)(1)", title: "Emergency preparedness training — long-term care",
    requirementText: "Initial training in emergency preparedness policies and procedures; maintain documentation; demonstrate staff knowledge of emergency procedures.",
    audienceText: "All new and existing staff, individuals providing services under arrangement, and volunteers, consistent with their expected roles.",
    facilityTypes: ["SKILLED_NURSING_FACILITY"], frequencyMonths: 12,
    frequencyText: "At least annually.", initialTimingText: "Initial training for all new and existing staff (no day count stated).",
    status: "VERIFIED", verificationNote: LII_NOTE, suggestedCourseCodes: ["CHITA-MC-009"],
  },
  {
    source: "cms-48215", category: "CMS", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "CMS",
    citation: "42 CFR 482.15(d)(1)", title: "Emergency preparedness training — hospitals",
    requirementText: "Initial training in emergency preparedness policies and procedures; maintain documentation; demonstrate staff knowledge; retrain when policies change significantly.",
    audienceText: "All new and existing staff, individuals providing services under arrangement, and volunteers, consistent with their expected roles.",
    facilityTypes: ["HOSPITAL"], frequencyMonths: 24,
    frequencyText: "At least every 2 years.", initialTimingText: "Initial training for all new and existing staff (no day count stated).",
    status: "VERIFIED", verificationNote: LII_NOTE, suggestedCourseCodes: ["CHITA-MC-009"],
  },
  {
    source: "cms-484102", category: "CMS", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "CMS",
    citation: "42 CFR 484.102(d)(1)", title: "Emergency preparedness training — home health agencies",
    requirementText: "Initial training in emergency preparedness policies and procedures; maintain documentation; demonstrate staff knowledge.",
    audienceText: "All new and existing staff, individuals providing services under arrangement, and volunteers, consistent with their expected roles.",
    facilityTypes: ["HOME_HEALTH_AGENCY"], frequencyMonths: 24,
    frequencyText: "At least every 2 years.", initialTimingText: "Initial training for all new and existing staff (no day count stated).",
    status: "VERIFIED", verificationNote: LII_NOTE, suggestedCourseCodes: ["CHITA-MC-009"],
  },
  {
    source: "cms-48480", category: "CMS", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "CMS",
    citation: "42 CFR 484.80(d)", title: "Home health aide in-service training (12 hours per 12 months)",
    requirementText: "At least 12 hours of in-service training during each 12-month period; may be offered by any organization and must be supervised by a registered nurse.",
    audienceText: "Home health aides of Medicare-certified home health agencies.", facilityTypes: ["HOME_HEALTH_AGENCY"], positionCodes: ["HOME_HEALTH_AIDE"],
    frequencyMonths: 12, frequencyText: "At least 12 hours during each 12-month period.", initialTimingText: "Ongoing during employment.",
    status: "VERIFIED", verificationNote: `${LII_NOTE} Hours-based: track total in-service hours.`,
  },
  {
    source: "cms-4931451", category: "CMS", kind: "COMPETENCY_ASSESSMENT", jurisdiction: "FEDERAL", agency: "CMS (CLIA)",
    citation: "42 CFR 493.1451(b)(8)–(9)", title: "CLIA competency evaluation — high complexity testing personnel",
    requirementText: "The technical supervisor evaluates and documents the competency of individuals responsible for high complexity testing; reevaluate before reporting patient results after a change in methodology or instrumentation.",
    audienceText: "Testing personnel performing high complexity testing in a CLIA-certified laboratory.",
    facilityTypes: ["LABORATORY", "CLINIC", "HOSPITAL", "COMMUNITY_HEALTH_CENTER"], facilityLicenseTypes: ["CLIA_HIGH_COMPLEXITY"], jobDuties: ["HIGH_COMPLEXITY_TESTING"],
    frequencyMonths: 12, frequencyText: "At least semiannually during the first year the individual tests patient specimens; at least annually thereafter.",
    initialTimingText: "Semiannual evaluations during the first year of testing.",
    status: "VERIFIED", verificationNote: LII_NOTE,
  },
  {
    source: "cms-422503", category: "MEDICARE_MEDICAID", kind: "TRAINING_MANDATE", jurisdiction: "FEDERAL", agency: "CMS",
    citation: "42 CFR 422.503(b)(4)(vi)(C)", title: "Medicare Advantage compliance program training",
    requirementText: "Effective compliance training and education for the compliance officer, employees, chief executive and senior administrators, managers and governing body members.",
    audienceText: "Medicare Advantage organizations. Providers contracting with MA plans may receive related obligations through their contracts — verify contract terms.",
    facilityLicenseTypes: ["MEDICARE_ADVANTAGE_ORGANIZATION"], frequencyMonths: 12,
    frequencyText: "At least annually.", initialTimingText: "Part of orientation for new employees and newly appointed executives, managers and governing body members.",
    status: "VERIFIED", verificationNote: LII_NOTE,
  },
  // ---------------------------------------------------------------- HRSA / 340B / CDC
  {
    source: "hrsa-340b-guide", category: "PROGRAM_340B", kind: "GUIDANCE", jurisdiction: "FEDERAL", agency: "HRSA Office of Pharmacy Affairs",
    citation: "HRSA 340B Compliance Improvement Guide — Education and Training", title: "340B program staff education (guidance)",
    requirementText: "HRSA's guide recommends developing and maintaining staff knowledge and skills related to the 340B Program for staff involved in it. No statutory training frequency was identified.",
    audienceText: "Staff of 340B covered entities involved in 340B eligibility, purchasing, dispensing, billing or compliance.",
    facilityLicenseTypes: ["340B_COVERED_ENTITY"],
    frequencyText: "None stated (guidance).", initialTimingText: "None stated.",
    status: "VERIFIED", verificationNote: "Guide located on hrsa.gov; it is guidance, not a regulation.",
  },
  {
    source: "hrsa-hc-manual", category: "HRSA", kind: "NO_TRAINING_MANDATE_IDENTIFIED", jurisdiction: "FEDERAL", agency: "HRSA Bureau of Primary Health Care",
    citation: "Health Center Program Compliance Manual", title: "HRSA health center program — staff requirements (review needed)",
    requirementText: "Health center grantees should review the Compliance Manual (e.g., credentialing and privileging) for staff-related obligations. No training mandate has been seeded.",
    audienceText: "Staff of HRSA-funded health centers.", facilityTypes: ["COMMUNITY_HEALTH_CENTER"],
    frequencyText: "Not determined.", initialTimingText: "Not determined.",
    status: "NEEDS_REVIEW", verificationNote: "Source not yet reviewed for training obligations — flagged for administrator review rather than inventing a requirement.",
  },
  {
    source: "cdc-vfc", category: "CDC", kind: "PROGRAM_REQUIREMENT", jurisdiction: "FEDERAL", agency: "CDC",
    citation: "CDC Vaccines for Children Program — provider requirements", title: "VFC vaccine coordinator training",
    requirementText: "Primary and backup vaccine coordinators at VFC provider sites complete training on VFC requirements and vaccine storage and handling.",
    audienceText: "Primary and backup vaccine coordinators at enrolled VFC provider sites.",
    facilityLicenseTypes: ["VFC_PROVIDER"], jobDuties: ["VACCINE_COORDINATOR"],
    frequencyText: "Annually, as documented by multiple state VFC programs (e.g., CDC 'You Call the Shots' modules). Confirm in the current CDC VFC Operations Guide.",
    initialTimingText: "Not confirmed.",
    status: "NEEDS_REVIEW", verificationNote: "Annual requirement found in state immunization program documents; the primary CDC Operations Guide text was not reviewed. Frequency is therefore not asserted.",
  },
  {
    source: "cdc-core-ipc", category: "CDC", kind: "GUIDANCE", jurisdiction: "FEDERAL", agency: "CDC",
    citation: "CDC Core Infection Prevention and Control Practices", title: "Infection prevention education (CDC guidance)",
    requirementText: "CDC recommends job- or task-specific infection prevention education and training for healthcare personnel.",
    audienceText: "Healthcare personnel.", requiresClinicalExposure: true,
    frequencyText: "Not verified.", initialTimingText: "Not verified.",
    status: "NEEDS_REVIEW", verificationNote: "Guidance page not yet reviewed for specific timing recommendations; listed for completeness. Guidance is not a legal mandate.", suggestedCourseCodes: ["CHITA-MC-006", "CHITA-MC-005"],
  },
  // ---------------------------------------------------------------- Florida AHCA — assisted living
  {
    source: "fs-429-52", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "s. 429.52(1)(a), F.S.", title: "ALF preservice orientation (2 hours)",
    requirementText: "Preservice orientation of at least 2 hours; the employee and administrator sign a statement kept in the personnel record. The 1-hour s. 430.5025 training counts toward it if completed before resident interaction.",
    audienceText: "New assisted living facility employees who have not previously completed core training.", facilityTypes: ALF,
    frequencyText: "One time.", initialTimingText: "Before interacting with residents.", initialDueDaysFromHire: 0,
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us (official, 2026 statutes).", pendingChangeNote: SB1404, suggestedCourseCodes: ["CHITA-FP-001"],
  },
  {
    source: "fac-59a-36-011", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "Rule 59A-36.011(3)(a), F.A.C.", title: "ALF infection control in-service (1 hour)",
    requirementText: "Minimum 1 hour of in-service training in infection control, including universal precautions and facility sanitation procedures.",
    audienceText: ALF_DIRECT_CARE, facilityTypes: ALF, requiresClinicalExposure: true,
    frequencyText: "Recurrence not stated.", initialTimingText: "Before providing personal care to residents.", initialDueDaysFromHire: 0,
    status: "VERIFIED", verificationNote: LII_NOTE, pendingChangeNote: SB1404, suggestedCourseCodes: ["CHITA-MC-006", "CHITA-MC-005"],
  },
  {
    source: "fac-59a-36-011", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "Rule 59A-36.011(3)(b), F.A.C.", title: "ALF adverse incidents and emergency procedures in-service (1 hour)",
    requirementText: "Minimum 1 hour covering reporting adverse incidents and emergency procedures, including chain of command and staff roles in emergency evacuation.",
    audienceText: "Direct care staff of an assisted living facility.", facilityTypes: ALF, requiresClinicalExposure: true,
    frequencyText: "Recurrence not stated.", initialTimingText: "Within 30 days of employment.", initialDueDaysFromHire: 30,
    status: "VERIFIED", verificationNote: LII_NOTE, pendingChangeNote: SB1404, suggestedCourseCodes: ["CHITA-MC-009"],
  },
  {
    source: "fac-59a-36-011", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "Rule 59A-36.011(3)(c), F.A.C.", title: "ALF resident rights and abuse reporting in-service (1 hour)",
    requirementText: "Minimum 1 hour covering resident rights and recognizing and reporting abuse, neglect and exploitation.",
    audienceText: "Direct care staff of an assisted living facility who have not taken the core training.", facilityTypes: ALF, requiresClinicalExposure: true,
    frequencyText: "Recurrence not stated.", initialTimingText: "Within 30 days of employment.", initialDueDaysFromHire: 30,
    status: "VERIFIED", verificationNote: LII_NOTE, pendingChangeNote: SB1404, suggestedCourseCodes: ["CHITA-MC-007", "CHITA-MC-008"],
  },
  {
    source: "fac-59a-36-011", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "Rule 59A-36.011(3)(d), F.A.C.", title: "ALF resident behavior and activities of daily living in-service (3 hours)",
    requirementText: "Minimum 3 hours covering resident behavior and needs, and assisting with activities of daily living.",
    audienceText: ALF_DIRECT_CARE, facilityTypes: ALF, requiresClinicalExposure: true,
    frequencyText: "Recurrence not stated.", initialTimingText: "Within 30 days of employment.", initialDueDaysFromHire: 30,
    status: "VERIFIED", verificationNote: LII_NOTE, pendingChangeNote: SB1404,
  },
  {
    source: "fac-59a-36-011", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "Rule 59A-36.011(3)(e), F.A.C.", title: "ALF safe food handling in-service (1 hour)",
    requirementText: "Minimum 1 hour of in-service training in safe food handling practices.",
    audienceText: "Assisted living facility staff who prepare or serve food and have not taken the core training.", facilityTypes: ALF, jobDuties: ["FOOD_SERVICE"],
    frequencyText: "Recurrence not stated.", initialTimingText: "Within 30 days of employment.", initialDueDaysFromHire: 30,
    status: "VERIFIED", verificationNote: LII_NOTE, pendingChangeNote: SB1404,
  },
  {
    source: "fac-59a-36-011", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "Rule 59A-36.011(3)(f), F.A.C.", title: "ALF elopement response in-service",
    requirementText: "In-service training on the facility's resident elopement response policies and procedures; staff receive a copy and must demonstrate understanding and competency in implementing them.",
    audienceText: "All assisted living facility staff.", facilityTypes: ALF,
    frequencyText: "Recurrence not stated.", initialTimingText: "Within thirty (30) days of employment.", initialDueDaysFromHire: 30,
    status: "VERIFIED", verificationNote: LII_NOTE, pendingChangeNote: SB1404,
  },
  {
    source: "fac-59a-36-011", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "Rule 59A-36.011(4), F.A.C.", title: "ALF HIV/AIDS education (one time)",
    requirementText: "Education course on HIV and AIDS including the topics prescribed in s. 381.0035, F.S.",
    audienceText: "All assisted living facility employees, except those subject to s. 456.033, F.S.", facilityTypes: ALF,
    frequencyText: "One time.", initialTimingText: "Within 30 days of employment.", initialDueDaysFromHire: 30,
    status: "VERIFIED", verificationNote: LII_NOTE, pendingChangeNote: SB1404, suggestedCourseCodes: ["CHITA-HIV-001"],
  },
  {
    source: "fs-429-52", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "s. 429.52(6), F.S.; Rule 59A-36.011(6), F.A.C.", title: "ALF assistance with self-administration of medication",
    requirementText: "At least 6 hours of training by a registered nurse or licensed pharmacist, with in-person skills demonstration, before assisting; then at least 2 hours of continuing education annually on assisted self-administration and safe medication practices.",
    audienceText: "Unlicensed staff who assist residents with self-administration of medication.", facilityTypes: ALF, jobDuties: ["MEDICATION_ASSISTANCE"],
    frequencyMonths: 12, frequencyText: "2 hours of continuing education annually.", initialTimingText: "Before providing assistance (prior to assuming the responsibility).", initialDueDaysFromHire: 0,
    status: "VERIFIED", verificationNote: "Statute confirmed on leg.state.fl.us; rule detail on the Cornell LII copy. The initial 6-hour course with skills demonstration must be delivered by an RN or pharmacist — an online course alone does not satisfy it.", pendingChangeNote: SB1404,
  },
  {
    source: "fs-429-52", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "s. 429.52(4)–(5), F.S.", title: "ALF administrator core training and continuing education",
    requirementText: "Administrators complete the required core training, including the competency test, then 12 contact hours of continuing education every 2 years. Core training is delivered by approved providers outside the academy.",
    audienceText: "Assisted living facility administrators.", facilityTypes: ALF, positionCodes: ["ADMINISTRATOR"],
    frequencyMonths: 24, frequencyText: "12 contact hours of continuing education every 2 years.", initialTimingText: "Within 90 days after the date of employment as an administrator.", initialDueDaysFromHire: 90,
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us. The academy's internal certificates are not core training or approved CE.", pendingChangeNote: SB1404,
  },
  // ---------------------------------------------------------------- Florida dementia training (s. 430.5025)
  {
    source: "fs-430-5025", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "Florida Department of Elder Affairs / AHCA",
    citation: "s. 430.5025(4)(b), F.S.", title: "Dementia training — 1 hour for personal care / regular-contact employees",
    requirementText: "Complete the 1-hour Department of Elder Affairs dementia training program. All employees receive basic written information about interacting with people with dementia upon beginning employment.",
    audienceText: "Employees of covered providers who provide personal care to, or have regular contact with, residents, patients or participants.",
    facilityTypes: ["SKILLED_NURSING_FACILITY", "HOME_HEALTH_AGENCY", "ASSISTED_LIVING_FACILITY", "ADULT_DAY_CARE"], jobDuties: ["PERSONAL_CARE"],
    frequencyText: "One time; completion records transfer between covered providers.", initialTimingText: "Within 30 days after beginning employment.", initialDueDaysFromHire: 30,
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us (official, 2026 statutes). The 1-hour program is provided by the Department of Elder Affairs.",
  },
  {
    source: "fs-430-5025", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "Florida Department of Elder Affairs / AHCA",
    citation: "s. 430.5025(4)(c)–(d), F.S.", title: "Dementia training — additional hours for personal care employees",
    requirementText: "Personal care employees complete additional dementia training: 3 hours (nursing homes, ALFs, adult family-care homes, adult day care centers) or 2 hours (home health agencies, nurse registries, companion/homemaker providers).",
    audienceText: "Employees of covered providers who provide personal care.",
    facilityTypes: ["SKILLED_NURSING_FACILITY", "HOME_HEALTH_AGENCY", "ASSISTED_LIVING_FACILITY", "ADULT_DAY_CARE"], jobDuties: ["PERSONAL_CARE"],
    frequencyText: "One time.", initialTimingText: "Within 7 months after beginning employment (within 3 months at ALFs/adult day care advertising specialized dementia care).",
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us. 'Within 7 months' is not converted to a day count; set the due date in the mapped requirement.",
  },
  {
    source: "fs-430-5025", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "Florida Department of Elder Affairs / AHCA",
    citation: "s. 430.5025(5), F.S.", title: "Specialized dementia care — 4-hour training and annual continuing education",
    requirementText: "At ALFs, adult family-care homes and adult day care centers advertising specialized dementia care: 4 hours of dementia-specific training, then at least 4 hours of continuing education each calendar year (on-the-job training may count for no more than 2 hours).",
    audienceText: "Personal care employees of providers that advertise specialized Alzheimer's/dementia care.",
    facilityTypes: ["ASSISTED_LIVING_FACILITY", "ADULT_DAY_CARE"], facilityLicenseTypes: ["ALF_SPECIALIZED_DEMENTIA"], jobDuties: ["PERSONAL_CARE"],
    frequencyMonths: 12, frequencyText: "At least 4 hours of continuing education each calendar year.", initialTimingText: "4-hour training within 6 months after beginning employment.",
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us. Subsection numbering summarized from the statute; confirm paragraph references. Calendar-year cadence approximated as 12 months for reminders.",
  },
  {
    source: "fs-400-211", category: "AHCA", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "AHCA",
    citation: "s. 400.211, F.S.", title: "Nursing home CNA performance review and in-service education",
    requirementText: "Certified nursing assistants employed 12 months or longer submit to a performance review every 12 months and receive regular in-service education based on it, covering at minimum: feeding assistance, nutrition and hydration, cognitively impaired residents, end-of-life care, pressure ulcer and fall risk, and venous thromboembolism recognition and emergency response.",
    audienceText: "Certified nursing assistants employed by Florida nursing homes.", facilityTypes: ["SKILLED_NURSING_FACILITY"], positionCodes: ["CNA"],
    frequencyText: "Performance review every 12 months; in-service is 'regular' (no hour minimum stated in the statute).", initialTimingText: "After 12 months of employment.",
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us.",
  },
  // ---------------------------------------------------------------- Florida DOH
  {
    source: "fs-381-0035", category: "FL_DOH", kind: "TRAINING_MANDATE", jurisdiction: "FL", agency: "Florida Department of Health",
    citation: "s. 381.0035, F.S.", title: "HIV/AIDS educational course for employees (one time)",
    requirementText: "One-time educational course on modes of transmission, infection control procedures, clinical management and prevention of HIV and AIDS, and related topics; facilities keep attendance records.",
    audienceText: "Employees of facilities licensed under ch. 393, 394, 397, 395, part II, III or IV of ch. 400, or part I of ch. 429, F.S. (not those subject to s. 456.033).",
    facilityTypes: ["HOSPITAL", "SKILLED_NURSING_FACILITY", "HOME_HEALTH_AGENCY", "ASSISTED_LIVING_FACILITY", "GROUP_HOME", "BEHAVIORAL_HEALTH"],
    frequencyText: "One time; not repeated on changing employment.", initialTimingText: "No deadline in the statute (facility rules may set one, e.g. ALF: 30 days).",
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us. Facility-type mapping to licensing chapters is approximate — confirm each facility's license chapter.", suggestedCourseCodes: ["CHITA-HIV-001"],
  },
  {
    source: "fs-456-0341", category: "FL_DOH", kind: "CONTINUING_EDUCATION", jurisdiction: "FL", agency: "Florida Department of Health",
    citation: "s. 456.0341, F.S.", title: "Human trafficking education for licensees (1 hour)",
    requirementText: "One hour of board-approved (or department-approved) continuing education on human trafficking. Licensees must also post a human trafficking hotline sign (English and Spanish) in a place accessible to employees.",
    audienceText: "Licensees under ch. 457, 458, 459, 460, 461, 463, 465, 466, 480, 486 and certain parts of ch. 468, F.S.",
    positionCodes: ["PHYSICIAN", "PHARMACY_TECH"],
    frequencyText: "Recurrence not stated in the statute; the original deadline was January 1, 2021.", initialTimingText: "By January 1, 2021 (existing licensees).",
    status: "VERIFIED", verificationNote: "Confirmed on leg.state.fl.us. Board-approved CE only — academy certificates do not satisfy it. Position mapping is approximate; nursing (ch. 464) is not in the listed chapters.",
  },
  // ---------------------------------------------------------------- Florida boards (not yet verified)
  {
    source: "fac-64b9-5-002", category: "FL_BON", kind: "CONTINUING_EDUCATION", jurisdiction: "FL", agency: "Florida Board of Nursing",
    citation: "Rule 64B9-5.002, F.A.C.", title: "Nursing license renewal continuing education",
    requirementText: "Biennial continuing education for nursing license renewal. Hours and mandatory topics have not been seeded pending verification of the rule text.",
    audienceText: "Florida-licensed RNs, LPNs and APRNs.", positionCodes: ["RN", "LPN", "APRN"],
    frequencyText: "Not asserted (rule text not reviewed).", initialTimingText: "Not asserted.",
    status: "NEEDS_REVIEW", verificationNote: "flrules.org page lists metadata only; rule document not yet reviewed. Licensure CE must come from Board-approved providers — academy certificates are not accredited CE.",
  },
  {
    source: "fs-465-009", category: "FL_BOP", kind: "CONTINUING_EDUCATION", jurisdiction: "FL", agency: "Florida Board of Pharmacy",
    citation: "s. 465.009, F.S.; Rule chapter 64B16-26, F.A.C.", title: "Pharmacist and pharmacy technician continuing education",
    requirementText: "Continuing education for license or registration renewal. Hours and mandatory topics have not been seeded pending verification.",
    audienceText: "Florida pharmacists and registered pharmacy technicians.", facilityTypes: ["PHARMACY"], positionCodes: ["PHARMACY_TECH"],
    frequencyText: "Not asserted.", initialTimingText: "Not asserted.",
    status: "NEEDS_REVIEW", verificationNote: "Not yet reviewed. Academy certificates are not Board-approved CE.",
  },
  {
    source: "fl-dcf", category: "FL_DCF", kind: "NO_TRAINING_MANDATE_IDENTIFIED", jurisdiction: "FL", agency: "Florida Department of Children and Families",
    citation: "F.A.C. chapters 65D / 65E (DCF programs)", title: "DCF-licensed program staff training (review needed)",
    requirementText: "Mental health (ch. 394) and substance use (ch. 397) programs licensed or contracted by DCF have staff training rules in the Florida Administrative Code. Group homes for persons with developmental disabilities are licensed by APD (chapter 65G). Not yet researched — no requirement seeded.",
    audienceText: "Staff of DCF-licensed or contracted behavioral health programs; APD-licensed group homes.", facilityTypes: ["BEHAVIORAL_HEALTH", "GROUP_HOME"],
    frequencyText: "Not determined.", initialTimingText: "Not determined.",
    status: "NEEDS_REVIEW", verificationNote: "Flagged for administrator review rather than inventing a requirement.",
  },
];
