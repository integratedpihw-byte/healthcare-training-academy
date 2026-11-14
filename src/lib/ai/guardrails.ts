/**
 * Input guardrails for the education assistant (spec §16, §21). Pure functions so they
 * can be unit-tested. They are deliberately conservative: a false positive costs the
 * user a rephrase; a false negative could leak PHI to a third-party model or produce
 * patient-specific clinical advice.
 */

export type Refusal = { code: "PHI" | "CLINICAL" | "AUTHORITY" | "EMPTY" | "LENGTH"; message: string };

const PHI_PATTERNS: [RegExp, string][] = [
  [/\b\d{3}-\d{2}-\d{4}\b/, "a Social Security number"],
  [/\b(mrn|medical record (number|no\.?)|patient id|chart (number|no\.?))\s*[:#]?\s*[a-z0-9-]{4,}/i, "a medical record number"],
  [/\b(dob|date of birth|born on)\s*[:\-]?\s*\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}/i, "a date of birth"],
  [/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/, "an email address"],
  [/(\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/, "a phone number"],
  [/\b(medicaid|medicare|member|insurance|policy)\s*(id|number|no\.?)\s*[:#]?\s*[a-z0-9-]{5,}/i, "an insurance identifier"],
  [/\b\d{1,5}\s+[a-z0-9.]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way)\b/i, "a street address"],
  [/\b(patient|resident|client|mr\.?|mrs\.?|ms\.?)\s+(named\s+)?[A-Z][a-z]+\s+[A-Z][a-z]+/, "a patient's name"],
];

/** Returns a description of the first PHI-like pattern found, or null. */
export function detectPhi(text: string): string | null {
  for (const [re, label] of PHI_PATTERNS) if (re.test(text)) return label;
  return null;
}

const PATIENT_CONTEXT = /\b(my|our|this|a|the)\s+(patient|resident|client|consumer)\b|\b(patient|resident|client)\s+(has|is|was|presents|with|complains|reports)\b|\b(he|she|they)\s+(has|have|is|are)\s+(a\s+)?(fever|pain|rash|bp|blood pressure|symptoms?)\b/i;
const CLINICAL_ASK = /\b(diagnos\w*|what (does|do) (he|she|they|the patient) have|what (medication|med|drug|dose|dosage|antibiotic)s?\b.*\b(give|prescribe|start|use)|should (i|we) (give|prescribe|start|stop|increase|decrease|hold|titrate)|prescribe|how much .* should (i|we) give)\b/i;
const AUTHORITY_ASK = /\b(approve|sign ?off|sign off on|certify|attest)\b.*\b(competen\w*|skill|checkoff|check-off)\b|\b(mark|declare|make)\b.*\b(competent|compliant|complete|passed)\b|\b(create|generate|issue|make|forge)\b.*\b(certificate|license|ce credit|transcript)\b|\b(change|update|set)\b.*\bcompliance status\b/i;

export function checkInput(text: string, maxLen = 4000): Refusal | null {
  const t = text.trim();
  if (!t) return { code: "EMPTY", message: "Type a question or topic." };
  if (t.length > maxLen) return { code: "LENGTH", message: `Please keep requests under ${maxLen} characters.` };
  const phi = detectPhi(t);
  if (phi) return { code: "PHI", message: `Your request appears to include ${phi}. Remove patient and personal identifiers — the assistant is for education only and must not receive protected health information.` };
  if (CLINICAL_ASK.test(t) && PATIENT_CONTEXT.test(t)) {
    return { code: "CLINICAL", message: "The assistant cannot diagnose patients, recommend treatment or medication for a specific patient, or replace licensed clinical judgment. Follow your facility's protocols and contact the responsible licensed practitioner. You can ask about the topic in general educational terms." };
  }
  if (/\b(diagnose|prescribe)\s+(me|my|him|her|them)\b/i.test(t)) {
    return { code: "CLINICAL", message: "The assistant cannot diagnose or prescribe. Please consult a licensed healthcare provider." };
  }
  if (AUTHORITY_ASK.test(t)) {
    return { code: "AUTHORITY", message: "The assistant cannot approve competencies, issue certificates or change compliance status. Those actions require an authorized person in the application and are audited." };
  }
  return null;
}

/** Final safety line appended to every answer shown to users. */
export const DISCLAIMER = "AI-generated educational content. It may contain errors, does not replace your facility's policies or licensed clinical judgment, and does not establish competency or compliance.";
