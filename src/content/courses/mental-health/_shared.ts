import type { Reference, RegulatoryReference } from "../../types";

export const ACCESSED = "2026-11-18";

/** Every mental health course carries this scope statement (brief §3F). */
export const SCOPE_NOTICE =
  "Educational training only. It does not authorize anyone to diagnose, treat or independently manage mental health conditions or psychiatric emergencies, and it is not a license or a professional certification.";

export const FS_394_463: RegulatoryReference = {
  agency: "Florida Legislature",
  citation: "s. 394.463, F.S.",
  title: "Involuntary examination (Baker Act)",
  url: "https://www.flsenate.gov/Laws/Statutes/2024/394.463",
};
export const FS_381_887: RegulatoryReference = {
  agency: "Florida Legislature",
  citation: "s. 381.887, F.S.",
  title: "Emergency treatment for suspected opioid overdose",
  url: "https://www.flsenate.gov/Laws/Statutes/2024/0381.887",
};
export const CFR_PART_2: RegulatoryReference = {
  agency: "Substance Abuse and Mental Health Services Administration",
  citation: "42 CFR Part 2",
  title: "Confidentiality of Substance Use Disorder Patient Records",
  url: "https://www.ecfr.gov/current/title-42/chapter-I/subchapter-A/part-2",
};

export const NIMH_WARNING: Reference = {
  title: "Warning Signs of Suicide",
  publisher: "National Institute of Mental Health",
  url: "https://www.nimh.nih.gov/health/publications/warning-signs-of-suicide",
  accessedOn: ACCESSED,
};
export const LIFELINE: Reference = {
  title: "988 Suicide & Crisis Lifeline",
  publisher: "988 Suicide & Crisis Lifeline",
  url: "https://988lifeline.org/",
  accessedOn: ACCESSED,
};
export const SAMHSA_RECOVERY: Reference = {
  title: "SAMHSA's Working Definition of Recovery (PEP12-RECDEF)",
  publisher: "Substance Abuse and Mental Health Services Administration",
  url: "https://store.samhsa.gov/sites/default/files/d7/priv/pep12-recdef.pdf",
  accessedOn: ACCESSED,
};
export const SAMHSA_TIC: Reference = {
  title: "SAMHSA's Concept of Trauma and Guidance for a Trauma-Informed Approach (HHS Publication No. (SMA) 14-4884)",
  publisher: "Substance Abuse and Mental Health Services Administration",
  url: "https://ncsacw.samhsa.gov/userfiles/files/SAMHSA_Trauma.pdf",
  accessedOn: ACCESSED,
};
export const WHO_PFA: Reference = {
  title: "Psychological First Aid: Guide for Field Workers",
  publisher: "World Health Organization",
  url: "https://www.who.int/publications/i/item/9789241548205",
  publishedOn: "2011",
  accessedOn: ACCESSED,
};
export const MHFA: Reference = {
  title: "Mental Health First Aid — find a course and certification process",
  publisher: "National Council for Mental Wellbeing",
  url: "https://mentalhealthfirstaid.org/",
  accessedOn: ACCESSED,
};
