import type { Reference, RegulatoryReference } from "../../types";

export const ACCESSED = "2026-11-18";

export const CFR_484_80: RegulatoryReference = {
  agency: "Centers for Medicare & Medicaid Services",
  citation: "42 CFR 484.80",
  title: "Condition of participation: Home health aide services",
  url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-484/subpart-B/section-484.80",
};
export const FAC_59A_8_0095: RegulatoryReference = {
  agency: "Florida Agency for Health Care Administration",
  citation: "Rule 59A-8.0095, F.A.C.",
  title: "Home health agency personnel (including home health aide training)",
  url: "https://www.flrules.org/gateway/ruleNo.asp?id=59A-8.0095",
};
export const FS_400_488: RegulatoryReference = {
  agency: "Florida Legislature",
  citation: "s. 400.488, F.S.",
  title: "Assistance with self-administration of medication and with other tasks",
  url: "https://m.flsenate.gov/Statutes/400.488",
};
export const FS_430_5025: RegulatoryReference = {
  agency: "Florida Legislature",
  citation: "s. 430.5025, F.S.",
  title: "Alzheimer's disease and related forms of dementia; education and training",
  url: "https://m.flsenate.gov/Statutes/430.5025",
};
export const OSHA_BBP: RegulatoryReference = {
  agency: "Occupational Safety and Health Administration",
  citation: "29 CFR 1910.1030",
  title: "Bloodborne pathogens",
  url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1030",
};

export const AHCA_HHA: Reference = {
  title: "Home Health Aides (AHCA home health agency program)",
  publisher: "Florida Agency for Health Care Administration",
  url: "https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/laboratory-and-in-home-services/home-health-agencies/home-health-aides.html",
  accessedOn: ACCESSED,
};
export const AHCA_HCS: Reference = {
  title: "Homemaker and Companion Services Registration — General Information",
  publisher: "Florida Agency for Health Care Administration",
  url: "https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/long-term-care-services-unit/homemaker-companion-services-provider/general-information.html",
  accessedOn: ACCESSED,
};
export const CDC_HAND: Reference = {
  title: "Clinical Safety: Hand Hygiene for Healthcare Workers",
  publisher: "Centers for Disease Control and Prevention",
  url: "https://www.cdc.gov/clean-hands/hcp/clinical-safety/index.html",
  accessedOn: ACCESSED,
};
export const DOEA_ADRD: Reference = {
  title: "Alzheimer's Disease and Related Dementias (ADRD) Trainer & Curriculum Application",
  publisher: "Florida Department of Elder Affairs",
  url: "https://elderaffairs.org/?p=911",
  accessedOn: ACCESSED,
};

/** Shared plain-language statement for home health courses that are not a credential. */
export const NOT_A_CREDENTIAL =
  "Home health aides are not licensed or certified by AHCA or any other Florida or federal agency. This educational certificate is not a license or state certification.";
