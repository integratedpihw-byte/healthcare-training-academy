import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const clinicalDocumentation: CourseContent = {
  code: "CHTA-CP-003",
  title: "Clinical Documentation Essentials",
  categorySlug: "clinical-patient-care",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 50,
  clinicalReviewRequired: true,
  description:
    "Good documentation is good care: it communicates across shifts, protects patients and staff, supports billing and survey compliance, and is a legal record. This course covers the qualities of a good entry, objective language, timing and late entries, correcting errors in paper and electronic records, documenting refusals, incidents and changes in condition, electronic health record pitfalls (copy-forward, alert fatigue) and privacy.",
  targetAudience: "Nurses, CNAs, medical assistants, therapists, home health aides and ALF staff who write in health or care records.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Describe the purposes of the health record and the qualities of a good entry.",
    "Write objective, specific, timely entries using approved abbreviations only.",
    "Correct errors and make late entries according to policy without altering the original record.",
    "Document refusals, incidents and changes in condition appropriately.",
    "Avoid electronic record risks such as inappropriate copy-forward and charting for others.",
  ],
  regulatoryReferences: [
    { agency: "CMS", citation: "42 CFR 482.24", title: "Medical record services (hospitals)", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24" },
    { agency: "CMS", citation: "42 CFR 483.70(h)", title: "Medical records (long-term care)", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-B/section-483.70" },
    { agency: "HHS OCR", citation: "45 CFR 164.502(b)", title: "HIPAA minimum necessary standard", url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-E/section-164.502" },
  ],
  sourceReferences: [
    { title: "Documentation Matters Toolkit", publisher: "Centers for Medicare & Medicaid Services", url: "https://www.cms.gov/medicare/coding-billing/medicare-fee-for-service-compliance-programs/documentation", accessedOn: ACCESSED },
    { title: "List of Error-Prone Abbreviations", publisher: "Institute for Safe Medication Practices", url: "https://www.ismp.org/recommendations/error-prone-abbreviations-list", accessedOn: ACCESSED },
    { title: "Copy and Paste in Electronic Health Records (PSNet)", publisher: "Agency for Healthcare Research and Quality", url: "https://psnet.ahrq.gov/", accessedOn: ACCESSED },
    { title: "Amending and Correcting Health Records (practice brief)", publisher: "American Health Information Management Association", url: "https://www.ahima.org/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Why documentation matters",
      summary: "Purposes and qualities of the record.",
      lessons: [
        text("If it wasn't documented…", 8, `The health record:
- **Communicates** the person's condition and care to the whole team across shifts and settings.
- **Protects** the person and staff by showing what was observed and done.
- Is a **legal document** that may be reviewed in investigations, lawsuits and surveys.
- Supports **quality measurement and payment**.

### Qualities of a good entry
| Quality | Example |
|---|---|
| **Accurate and objective** | "Ate 25% of lunch" rather than "ate poorly" |
| **Specific** | "3 cm reddened area on left heel, skin intact" rather than "heel looks bad" |
| **Timely** | Recorded during or immediately after care |
| **Complete** | Includes the person's response and who was notified |
| **Legible and attributable** | Your own name/credentials or e-signature |
| **Uses approved abbreviations only** | Write "daily," not "QD" |

The old saying "if it wasn't documented, it wasn't done" reflects how others will interpret a missing entry.`),
      ],
    },
    {
      title: "2. Writing objective entries",
      summary: "Facts, quotes and avoiding judgment.",
      lessons: [
        text("Objective language", 8, `- Record what you **see, hear, smell, feel and measure** — not opinions or labels.
- Use the person's **own words in quotation marks** for symptoms and statements.
- Avoid judgmental terms: "uncooperative," "noncompliant," "drunk," "drug-seeking." Describe behavior instead: "Declined to walk to the dining room; stated, 'My knees hurt too much.'"
- Avoid vague words: "good," "fine," "normal," "appears." Give measurements and observations.
- Do not speculate about causes or blame: write "Resident found sitting on floor beside bed," not "Resident fell out of bed because aide left rail down."
- Chart only care **you** gave or observed. Never chart for someone else or before care is done.`),
        check("Check your understanding: objective language", [
          kc("cd1", "Which entry is objective?", ["Patient was rude and uncooperative.", "Patient declined bath; stated, 'I'll shower after my daughter visits.'", "Patient seems depressed.", "Patient was difficult again."], 1, "Describe behavior and quote the person's words."),
          kc("cd2", "Which entries should be avoided?", ["Charting a dressing change before doing it", "Charting for a coworker who forgot", "Writing 'noncompliant' instead of describing behavior", "Quoting the patient's statement"], [0, 1, 2], "Pre-charting, charting for others and labels are unsafe; quoting is good practice."),
        ]),
      ],
    },
    {
      title: "3. Corrections and late entries",
      summary: "Changing the record the right way.",
      lessons: [
        text("Correcting the record", 9, `Never **erase, white-out, write over, remove pages or delete** entries. Altering a record can be considered falsification.

### Paper records
- Draw a **single line** through the error so it remains readable.
- Write "error" or "mistaken entry" per policy, with your initials, date and time.
- Write the correct information nearby.

### Electronic records
- Use the system's **amend/correct** function; the original remains in the audit trail.
- Never share passwords or document under another person's login — EHRs track who entered what and when.

### Late entries
If you forgot to chart something, add a **late entry** clearly labeled as such, with the **current date and time** and the date/time the care or observation occurred. Late entries should be made as soon as possible; very late entries carry less credibility.

### Incident reports
Document the **facts of the event** in the health record (what happened, assessment, care given, who was notified). The incident/occurrence report is a separate quality document — in many facilities you **do not** write "incident report completed" in the chart; follow your policy.`),
      ],
    },
    {
      title: "4. Refusals, changes in condition and EHR pitfalls",
      summary: "High-risk documentation situations.",
      lessons: [
        text("High-risk situations", 9, `### Refusals
Document: what was offered, the person's reason in their words, education given about consequences (by the appropriate team member), who was notified, and any re-offer.

### Change in condition
Document: the change observed, vital signs, time, **who you notified and when**, what they said, and the follow-up. Use SBAR for the notification.

### Electronic health record pitfalls
- **Copy-forward / copy-paste**: carrying forward an old note can record findings that are no longer true ("lungs clear" when they are not). Review and update every element; copying another clinician's note without attribution may be fraudulent.
- **Templates and checkboxes**: checking "normal" without assessing is false documentation.
- **Alert fatigue**: read alerts before overriding; document the reason when you override.
- **Privacy**: access only records you need for your job (minimum necessary). EHRs log every access, and snooping leads to discipline.`),
        check("Check your understanding: high-risk entries", [
          kc("cd3", "You find yesterday's note says 'skin intact' but today there is a new pressure injury. What is correct?", ["Copy yesterday's note forward", "Document today's actual findings and notify the nurse", "Leave the skin section blank", "Delete yesterday's note"], 1, "Document current findings; never carry forward outdated information."),
          kc("cd4", "How should a forgotten observation from 0900 be added at 1400?", ["Write it at 0900 as if on time", "Make a late entry with the current time, referencing 0900", "Skip it", "Ask a coworker to chart it"], 1, "Late entries are labeled and timed accurately."),
        ]),
      ],
    },
    {
      title: "5. Putting it together",
      summary: "Case study.",
      lessons: [
        caseStudy("Case study: rewrite the note", 8, `**Original note (fictional):** "Pt combative and noncompliant all shift. Refused meds. Family difficult. Fell? Found on floor, seems ok. Incident report done."

**Problems:** labels instead of behaviors, missing times, speculation ("Fell?"), no assessment or notification details, references the incident report.

**Improved note:**
"1430 — Resident found sitting on floor beside bed, back against bed frame. States, 'I slipped trying to get to the bathroom.' Denies hitting head; denies pain except 'my bottom is sore.' No visible injury noted. Nurse J. Smith, RN notified at 1432 and assessed resident. Assisted to bed with mechanical lift and two staff at 1445. BP 132/78, P 84, R 18. Call light and walker placed within reach. Daughter notified by RN at 1500.
1600 — Declined 1600 medication; stated, 'It makes my stomach upset.' Nurse notified at 1605."

**Discussion:** What makes the revised entry more useful to the next shift and in an investigation?`),
      ],
    },
  ],
  finalExam: {
    title: "Clinical Documentation — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which entry is most objective?", ["Resident was mean today.", "Resident shouted, 'Leave me alone!' and pushed the tray away at 1215.", "Resident was in a bad mood.", "Resident is a difficult person."], 1, "Describe observable behavior with time and quotes."),
      tf("It is acceptable to document care before you provide it if you are certain you will do it.", false, "Pre-charting creates false records if care is delayed or not done."),
      mc("How should an error in a paper record be corrected?", ["Use correction fluid", "Single line through the error, note it per policy with initials, date and time, then write the correct information", "Tear out the page", "Scribble over it completely"], 1, "The original must remain readable."),
      mc("A late entry should include:", ["The time the care should have occurred only", "A 'late entry' label, the current date/time and the time the event occurred", "No time", "A backdated time"], 1, "Late entries are clearly identified and accurately timed."),
      tf("You may document under a coworker's login if they ask you to.", false, "Each user documents under their own credentials; EHRs track entries."),
      ms("Which are risks of copy-forward in an EHR? (Select all that apply.)", ["Recording outdated findings", "Note bloat that hides important information", "Misattributing another clinician's work", "Faster accurate assessment"], [0, 1, 2], "Copying does not replace assessment."),
      mc("Which abbreviation should be avoided?", ["'daily'", "'QD'", "'units'", "'mg'"], 1, "'QD' is on error-prone abbreviation lists; write 'daily'."),
      sc("A resident refuses a shower. What should be documented?", ["'Refused shower.' only", "What was offered, her reason in her words, who was notified and any re-offer", "Nothing, since no care was given", "That she is noncompliant"], 1, "Complete refusal documentation shows respect for rights and continuity of care."),
      mc("When you notify a nurse of a change in condition, document:", ["Only that the nurse was busy", "The change, vital signs, time, who was notified, their response and follow-up", "Your opinion of the cause", "Nothing — the nurse will document"], 1, "Notification details are essential for continuity and accountability."),
      tf("Accessing the record of a neighbor who is a patient, without a work reason, is a privacy violation even if you share nothing.", true, "Access must be limited to job needs; EHRs log access."),
      mc("Which word is most specific?", ["Wound looks better", "Wound 2 cm × 1 cm, pink base, no drainage", "Wound is fine", "Wound normal"], 1, "Measurements and descriptions are specific."),
      sc("You find a resident on the floor. Which documentation is appropriate in the health record?", ["'Fell out of bed due to aide negligence.'", "Objective facts: time found, position, statements, assessment, notifications", "'Incident report completed.' only", "Nothing until risk management decides"], 1, "Record facts; avoid blame and follow policy on incident report references."),
      mc("Why is the health record considered a legal document?", ["Because it is stored electronically", "Because it may be used as evidence in investigations, surveys and lawsuits", "Because only lawyers can read it", "It is not legal"], 1, "Records are evidence of the care provided."),
      tf("Checking 'normal' boxes in a template without assessing those items is acceptable if the person looks well.", false, "Documenting assessments not performed is false documentation."),
      ms("Which are qualities of good documentation? (Select all that apply.)", ["Timely", "Objective", "Attributable to the author", "Includes personal opinions about family members"], [0, 1, 2], "Opinions and judgments do not belong in the record."),
    ],
  },
};
