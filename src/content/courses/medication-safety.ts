import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const medicationSafety: CourseContent = {
  code: "CHITA-MM-001",
  title: "Medication Safety Fundamentals",
  categorySlug: "medication-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "No universal interval. Florida ALF staff who assist with self-administration of medication have separate statutory training and annual CE requirements (s. 429.52(6), F.S.) that this course does not satisfy.",
  estimatedMinutes: 60,
  clinicalReviewRequired: true,
  description:
    "Foundational medication safety for everyone who handles, administers, or assists with medications: how errors happen, the rights of safe administration, high-alert and look-alike/sound-alike medications, error-prone abbreviations, medication reconciliation, storage and disposal, recognizing adverse reactions, and reporting errors and near misses. Scope-of-practice rules (who may administer or assist) are set by licensure and Florida law; this course does not change them.",
  targetAudience: "Nurses, medication aides and technicians, ALF staff who assist with self-administration, pharmacy staff, medical assistants and supervisors.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. Completion does not authorize anyone to administer or assist with medications; that depends on licensure, Florida law and facility policy.",
  objectives: [
    "Describe common causes of medication errors and the systems that prevent them.",
    "Apply the rights of medication administration, including two patient identifiers.",
    "Recognize high-alert and look-alike/sound-alike medications and error-prone abbreviations.",
    "Explain medication reconciliation at transitions of care.",
    "Store, secure and dispose of medications properly, including controlled substances.",
    "Recognize adverse drug reactions and report errors and near misses.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "s. 429.256, F.S.", title: "Assistance with self-administration of medication (ALF)", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0429/Sections/0429.256.html" },
    { agency: "CMS", citation: "42 CFR 483.45", title: "Pharmacy services (long-term care)", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-B/section-483.45" },
  ],
  sourceReferences: [
    { title: "High-Alert Medications in Acute Care / Long-Term Care Settings", publisher: "Institute for Safe Medication Practices", url: "https://www.ismp.org/recommendations", accessedOn: ACCESSED },
    { title: "List of Error-Prone Abbreviations", publisher: "Institute for Safe Medication Practices", url: "https://www.ismp.org/recommendations/error-prone-abbreviations-list", accessedOn: ACCESSED },
    { title: "Medication Safety", publisher: "Agency for Healthcare Research and Quality, PSNet", url: "https://psnet.ahrq.gov/primer/medication-errors-and-adverse-drug-events", accessedOn: ACCESSED },
    { title: "Drug Disposal: Drug Take Back Locations and FDA Flush List", publisher: "U.S. Food and Drug Administration", url: "https://www.fda.gov/drugs/disposal-unused-medicines-what-you-should-know/drug-disposal-fdas-flush-list-certain-medicines", accessedOn: ACCESSED },
    { title: "MedWatch: The FDA Safety Information and Adverse Event Reporting Program", publisher: "U.S. Food and Drug Administration", url: "https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. How medication errors happen",
      summary: "Errors as system failures.",
      lessons: [
        text("Errors, near misses and systems", 8, `A **medication error** is any preventable event that may cause or lead to inappropriate medication use or patient harm while the medication is in the control of a health professional, patient or consumer. Errors can occur at every step: **prescribing, transcribing, dispensing, administering and monitoring**.

Common contributing factors:
- Similar drug names or packaging; illegible or ambiguous orders
- Interruptions and distractions during medication passes
- Missing information (allergies, weight, kidney function)
- Workarounds of safety systems (e.g., overriding barcode scanning)
- Poor communication at shift change or transfers

A **near miss** is an error caught before it reaches the person. Near misses are valuable warnings — **report them** so the system can be fixed. Most errors come from system weaknesses rather than careless individuals; a **just culture** encourages reporting while still holding people accountable for reckless behavior.`),
      ],
    },
    {
      title: "2. Safe administration",
      summary: "The rights, identification and high-alert medications.",
      lessons: [
        text("The rights of medication administration", 10, `Before giving (or assisting with) any medication, confirm:
1. **Right person** — use **two identifiers** (e.g., name and date of birth, or name and photo in long-term care per policy). Room number is never an identifier.
2. **Right medication** — compare the label to the order/MAR **three times** (when retrieving, when preparing, at the bedside).
3. **Right dose** — check units (mg vs. mcg); question unusually large or small doses.
4. **Right route** — oral, sublingual, topical, inhaled, etc. Never give a medication by a different route than ordered.
5. **Right time** — follow the schedule and facility policy for timing windows.
6. **Right documentation** — record immediately **after** the person takes it, never before.
7. Also: **right reason**, **right response** (monitor effect) and the person's **right to refuse**.

### High-alert medications
These carry a heightened risk of serious harm when errors occur. Examples (ISMP): **insulin, anticoagulants (e.g., warfarin, heparin, apixaban), opioids, oral methotrexate, concentrated electrolytes, sedatives**. Use extra safeguards such as independent double checks per policy.

### Look-alike/sound-alike (LASA) drugs
Examples: hydrOXYzine vs. hydrALAZINE; Celebrex vs. Celexa. **Tall Man lettering**, separate storage and reading the full label help prevent mix-ups.

### Avoid error-prone abbreviations
Write "**unit**" not "U"; "**daily**" not "QD"; never use a trailing zero (**1 mg**, not 1.0 mg); always use a leading zero (**0.5 mg**, not .5 mg).`),
        check("Check your understanding: administration", [
          kc("ms1", "Which pair are acceptable patient identifiers?", ["Room number and bed number", "Name and date of birth", "Diagnosis and room number", "Name and room number"], 1, "Use two person-specific identifiers; room numbers change."),
          kc("ms2", "Which is written safely?", ["Insulin 10 U", "Warfarin 5.0 mg", "Levothyroxine 0.05 mg", "Morphine .5 mg"], 2, "Use a leading zero and no trailing zero; write out 'units'."),
        ]),
      ],
    },
    {
      title: "3. Reconciliation, storage and disposal",
      summary: "Transitions of care and medication handling.",
      lessons: [
        text("Reconciliation and handling", 9, `### Medication reconciliation
At admission, transfer and discharge, the licensed team compares the person's current medications (including over-the-counter products, vitamins and herbal supplements) with new orders to catch **omissions, duplications, dosing errors and interactions**. Everyone can help by reporting what the person or family says they actually take.

### Storage
- Store according to the label (room temperature, refrigerated). Refrigerators for medications are **not** used for food, and temperatures are logged per policy.
- Keep medications **locked**; carts locked and in view.
- Controlled substances require **double-locked storage**, counts at shift change per policy and immediate reporting of discrepancies.
- Check **expiration dates**; label multi-dose items with the date opened when required.

### Disposal
Follow facility policy and pharmacy procedures. Controlled substance waste typically requires a witness and documentation. For community settings, the FDA recommends **drug take-back** options first; only certain medicines are on the FDA **flush list**.`),
      ],
    },
    {
      title: "4. Adverse reactions and reporting",
      summary: "Recognize, respond and report.",
      lessons: [
        text("Recognizing and reporting", 9, `An **adverse drug reaction** is harm caused by a medication at normal doses. Warning signs to report **immediately** to the nurse or prescriber:
- **Allergic reaction** — hives, itching, swelling of lips/face/tongue, wheezing or difficulty breathing (**call 911 / emergency response for breathing difficulty**)
- New confusion, excessive drowsiness, falls or dizziness (common with sedatives, opioids and blood pressure medicines in older adults)
- Bleeding or unusual bruising (anticoagulants)
- Low blood sugar signs — shakiness, sweating, confusion (insulin and some oral diabetes drugs)
- Slow or shallow breathing (opioids)

### After an error
1. **Check the person first** and get help; follow the prescriber's instructions.
2. **Notify** your supervisor and the prescriber per policy.
3. **Document** the facts in the record (not "incident report filed").
4. Complete the facility **incident/occurrence report**.
Organizations may also report to national programs such as FDA MedWatch or the ISMP error-reporting program.`),
        check("Check your understanding: reactions and errors", [
          kc("ms3", "A resident on an opioid is very hard to wake and breathing slowly. What first?", ["Document and check again in an hour", "Call for emergency help per policy and stay with the resident", "Give the next dose to help them sleep", "Call the family"], 1, "Slow breathing and decreased responsiveness can be life-threatening opioid toxicity — get help immediately."),
          kc("ms4", "You realize you gave a medication at the wrong time. What is the first step?", ["Fix the MAR so it looks correct", "Check the person and notify the nurse/prescriber per policy", "Wait to see if anything happens", "Tell no one if no harm occurs"], 1, "Assess, notify, document and report — never alter records."),
        ]),
      ],
    },
    {
      title: "5. Scope and practice",
      summary: "Who may do what, and a case study.",
      lessons: [
        text("Scope of practice in Florida settings", 6, `Who may administer medications depends on **licensure and setting**. In Florida **assisted living facilities**, unlicensed staff may **assist with self-administration** only within the limits of s. 429.256, F.S., and only after completing the required training (at least 6 hours, taught by a registered nurse or pharmacist, with in-person skills demonstration) and annual continuing education (s. 429.52(6), F.S.). Assistance includes, for example, taking the medication from a labeled container and placing it in the resident's hand, or opening a unit-dose package — but **not** tasks the statute excludes, such as injections. This course is general education and **does not qualify** anyone to assist or administer.`),
        caseStudy("Case study: the look-alike bottle", 8, `**Situation (fictional).** During a busy evening medication pass, a medication technician is interrupted twice. She picks up a bottle of hydrOXYzine 25 mg for Resident A, whose order is hydrALAZINE 25 mg for blood pressure. At the bedside, she checks the label against the MAR a third time and notices the difference before giving it.

**Discussion:**
1. What type of event is this? *(A near miss — caught before reaching the resident.)*
2. What contributed? *(Look-alike names, adjacent storage, interruptions.)*
3. What should she do? *(Not give it; get the correct medication; report the near miss so the pharmacy can separate storage and add Tall Man labels.)*
4. What system changes might the facility make? *("Do not interrupt" vests during medication passes, separate bins for LASA pairs, barcode scanning.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Medication Safety Fundamentals — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which is an acceptable second patient identifier?", ["Room number", "Date of birth", "Diagnosis", "Bed location"], 1, "Identifiers must be specific to the person; locations change."),
      tf("A near miss does not need to be reported because no harm occurred.", false, "Near misses reveal system weaknesses and should be reported."),
      mc("Which medication is considered high-alert?", ["Insulin", "Acetaminophen 325 mg", "Saline eye drops", "A multivitamin"], 0, "Insulin errors can cause severe harm; it is on ISMP high-alert lists."),
      mc("Which order is written correctly?", ["Heparin 5000 U", "Digoxin .125 mg", "Metoprolol 25 mg daily", "Lasix 20.0 mg QD"], 2, "Avoid 'U', missing leading zeros, trailing zeros and 'QD'."),
      mc("When should a medication be documented as given?", ["At the start of the shift", "Before preparing it", "Immediately after the person takes it", "At the end of the shift"], 2, "Documenting before administration creates false records if the dose is refused or delayed."),
      ms("Which are look-alike/sound-alike strategies? (Select all that apply.)", ["Tall Man lettering", "Separate storage of similar products", "Reading the full label at each check", "Storing them alphabetically side by side"], [0, 1, 2], "Alphabetical adjacency increases mix-ups for similar names."),
      mc("Medication reconciliation is done to:", ["Bill for medications", "Find omissions, duplications and discrepancies at transitions of care", "Reduce pharmacy staff", "Replace prescriber orders"], 1, "Reconciliation compares lists at admission, transfer and discharge."),
      tf("Food may be stored in the medication refrigerator if space is available.", false, "Medication refrigerators are for medications only, with temperature monitoring."),
      sc("A resident develops swelling of the lips and wheezing after a new antibiotic. What should you do first?", ["Document and observe", "Call for emergency help immediately per policy", "Give the next dose", "Offer water"], 1, "Signs of anaphylaxis require immediate emergency response."),
      mc("Which sign may indicate low blood sugar in a person taking insulin?", ["Shakiness, sweating and confusion", "Itchy rash only", "Increased appetite after meals", "Slow nail growth"], 0, "Hypoglycemia commonly causes shakiness, sweating, confusion; report immediately."),
      mc("Controlled substances should be stored:", ["On the counter for easy access", "Under double lock with counts and discrepancy reporting per policy", "In the resident's drawer", "In the staff break room"], 1, "Controlled substances require extra security and accountability."),
      tf("Completing this course authorizes unlicensed ALF staff to assist with self-administration of medication.", false, "Florida requires a separate 6-hour course taught by an RN or pharmacist with skills demonstration."),
      sc("You discover you gave a resident a dose meant for another resident. Best sequence?", ["Change the MAR, then tell no one", "Assess the resident, notify the nurse/prescriber and supervisor, document facts and complete an incident report", "Wait to see if symptoms appear", "Give the correct resident a double dose"], 1, "Safety first, then notification, documentation and reporting."),
      mc("Which drug class commonly increases fall risk in older adults?", ["Sedatives/sleep aids", "Topical moisturizers", "Vitamin C", "Saline nasal spray"], 0, "Sedatives, opioids and some blood pressure medications increase fall risk."),
      ms("Which are rights of medication administration? (Select all that apply.)", ["Right person", "Right dose", "Right route", "Right roommate"], [0, 1, 2], "The rights include person, medication, dose, route, time and documentation."),
    ],
  },
};
