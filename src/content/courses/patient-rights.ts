import type { CourseContent } from "../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../build";

const ACCESSED = "2026-11-13";

export const patientRights: CourseContent = {
  code: "CHTA-MC-008",
  title: "Patient and Resident Rights",
  categorySlug: "mandatory-compliance",
  isRequiredByDefault: true,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  renewalBasis: "Rights training is required in several settings (e.g., 42 CFR 483.95(g)(4) nurse aide in-service topics; Rule 59A-36.011(3)(c), F.A.C. for ALFs); frequency varies. Configure in the Compliance Center.",
  estimatedMinutes: 50,
  clinicalReviewRequired: false,
  description:
    "The rights that patients and residents hold under federal and Florida law, and how everyday care protects them: dignity and respect, privacy, informed consent and the right to refuse, advance directives, freedom from unnecessary restraints, communication and language access, grievances, and protection of personal property.",
  targetAudience: "All staff in hospitals, nursing homes, assisted living facilities, home health, clinics and group homes.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Identify the main sources of patient and resident rights in Florida and federal law.",
    "Apply dignity, privacy and choice in daily care.",
    "Explain informed consent, the right to refuse, and the role of advance directives and health care surrogates.",
    "Describe restrictions on physical and chemical restraints.",
    "Support language access and communication needs, and help a person file a grievance without retaliation.",
  ],
  regulatoryReferences: [
    { agency: "Florida Legislature", citation: "s. 381.026, F.S.", title: "Florida Patient's Bill of Rights and Responsibilities", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0381/Sections/0381.026.html" },
    { agency: "Florida Legislature", citation: "s. 400.022, F.S.", title: "Nursing home residents' rights", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0400/Sections/0400.022.html" },
    { agency: "Florida Legislature", citation: "s. 429.28, F.S.", title: "Assisted living facility resident bill of rights", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0429/Sections/0429.28.html" },
    { agency: "CMS", citation: "42 CFR 483.10", title: "Resident rights (long-term care)", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-B/section-483.10" },
    { agency: "CMS", citation: "42 CFR 482.13", title: "Patients' rights (hospitals)", url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-B/section-482.13" },
    { agency: "HHS OCR", citation: "45 CFR part 92 (Section 1557)", title: "Nondiscrimination and language access", url: "https://www.hhs.gov/civil-rights/for-individuals/section-1557/index.html" },
  ],
  sourceReferences: [
    { title: "Florida Patient's Bill of Rights and Responsibilities (s. 381.026, F.S.)", publisher: "Florida Legislature", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0381/Sections/0381.026.html", accessedOn: ACCESSED },
    { title: "Advance Directives — Health Care Decisions (ch. 765, F.S.)", publisher: "Florida Legislature", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0765/0765.html", accessedOn: ACCESSED },
    { title: "Section 1557 of the Patient Protection and Affordable Care Act", publisher: "U.S. Department of Health and Human Services, Office for Civil Rights", url: "https://www.hhs.gov/civil-rights/for-individuals/section-1557/index.html", accessedOn: ACCESSED },
    { title: "Florida Long-Term Care Ombudsman Program", publisher: "Florida Department of Elder Affairs", url: "https://ombudsman.elderaffairs.org/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Where rights come from",
      summary: "Federal and Florida sources of rights.",
      lessons: [
        text("Rights in law and in practice", 8, `Patients and residents keep their rights when they enter care. Key sources:

- **Florida Patient's Bill of Rights and Responsibilities** (s. 381.026, F.S.) — applies to patients of licensed facilities and providers: respect and dignity, privacy, prompt answers, information about care and costs, the right to refuse treatment, to know who is providing care, to receive interpreter services, and to express grievances.
- **Nursing home residents' rights** (s. 400.022, F.S.) and federal **42 CFR 483.10** — self-determination, choice of activities and schedules, privacy, visitors, personal funds, freedom from abuse and unnecessary restraints, participating in care planning, and voicing grievances without reprisal.
- **ALF resident bill of rights** (s. 429.28, F.S.) — similar protections, including freedom to participate in community activities, manage their own finances, and receive at least 45 days' notice of relocation or termination of residency, except in specified emergencies.
- **Hospital patients' rights** (42 CFR 482.13) — notice of rights, grievance process, participation in care, advance directives, privacy, safety and freedom from inappropriate restraint or seclusion.
- **Civil rights laws** — including Section 1557 of the Affordable Care Act and the Americans with Disabilities Act: no discrimination, and meaningful access for people with limited English proficiency or disabilities.

Rights come with **responsibilities** too (e.g., giving accurate information, following agreed plans), but a person's rights are never conditional on being "easy" to care for.`),
      ],
    },
    {
      title: "2. Dignity, privacy and choice",
      summary: "Everyday care that respects the person.",
      lessons: [
        text("Respect in every interaction", 8, `- **Knock, announce yourself and wait** before entering a room.
- Close doors and curtains; **cover the person** during care; ask others to leave during personal care.
- Use the person's preferred name; speak to them, not about them in front of them.
- Offer **choices**: when to get up, what to wear, what to eat, when to bathe, which activities.
- Protect health information — discuss care only with people who need to know, in private.
- Respect cultural, religious and personal preferences, including gender identity and the name and pronouns the person uses.
- Respect personal possessions; inventory and safeguard property; never use a resident's belongings.
- Let residents send and receive **mail and phone calls privately**, and receive visitors according to law and policy.`),
        check("Check your understanding: dignity and privacy", [
          kc("pr1", "Before entering a resident's room you should:", ["Walk in quietly so you do not disturb them", "Knock, announce yourself and wait for permission when possible", "Enter only if the door is open", "Call the family first"], 1, "Knocking and waiting respects the room as the resident's home."),
          kc("pr2", "A resident prefers to shower in the evening, but the unit schedule is mornings. What respects her rights?", ["Insist on the morning schedule", "Accommodate her preference when reasonably possible and update the care plan", "Skip showers", "Ask the family to decide"], 1, "Residents have the right to make choices about schedules; accommodate and document."),
        ]),
      ],
    },
    {
      title: "3. Consent, refusal and advance directives",
      summary: "Decision-making rights.",
      lessons: [
        text("Informed consent and the right to refuse", 10, `**Informed consent** means the person (or their legal representative) receives understandable information about a proposed treatment — its purpose, benefits, risks and alternatives — and agrees voluntarily. The licensed practitioner performing the treatment is responsible for obtaining it; other staff support the process and report questions or hesitation.

**Right to refuse.** A person with decision-making capacity may refuse any treatment, medication, test or care — even if staff disagree. When someone refuses:
1. Do not force or trick them (e.g., hiding medication in food without an order and consent is not acceptable).
2. Ask why and try to address concerns; offer again later if appropriate.
3. **Report the refusal** to the nurse or supervisor and **document** it.

**Advance directives** (Florida, ch. 765) let a person state wishes in advance — a **living will**, a **designation of health care surrogate**, and an anatomical gift. A **Do Not Resuscitate Order** (Florida DH Form 1896) must be honored by emergency and facility staff as allowed by law. Facilities must ask about and document advance directives and may not require one as a condition of care (Patient Self-Determination Act).

If a person lacks capacity, decisions are made by a court-appointed guardian, designated surrogate or proxy in the order set by Florida law — not by staff.`),
      ],
    },
    {
      title: "4. Restraints, communication and grievances",
      summary: "Freedom from restraint, language access and complaints.",
      lessons: [
        text("Restraints, language access and grievances", 9, `### Restraints
A **physical restraint** is any device or method that restricts movement and that the person cannot easily remove (e.g., some lap belts, tucking sheets tightly, full side rails in some situations). A **chemical restraint** is a medication used for discipline or staff convenience rather than to treat a medical condition. Residents have the right to be free from restraints imposed for **discipline or convenience**. Where restraints are permitted (for example, hospitals under 42 CFR 482.13), they require an order, are a last resort, use the least restrictive method for the shortest time, and require monitoring. Florida ALFs have additional restrictions — follow facility policy and the resident's plan.

### Communication and language access
- Offer **qualified interpreters** at no cost for people with limited English proficiency or who are deaf or hard of hearing. Avoid using family members — especially children — as interpreters except in emergencies or at the person's request for non-clinical matters.
- Provide auxiliary aids (e.g., large print, TTY/relay, video interpreting).

### Grievances
Everyone may voice complaints without fear of retaliation. Help the person use the facility grievance process, and share contacts such as the **Florida Long-Term Care Ombudsman Program** and AHCA's complaint line, which facilities must post.`),
        check("Check your understanding: restraints and language", [
          kc("pr3", "Giving a sedative to keep a resident quiet so the shift goes smoothly is:", ["Acceptable if the family agrees", "A chemical restraint used for staff convenience — prohibited", "Good care", "Required during night shift"], 1, "Medications used for discipline or convenience are chemical restraints."),
          kc("pr4", "A patient speaks only Haitian Creole. Who should interpret the discharge instructions?", ["Her 10-year-old grandson", "A qualified medical interpreter", "Any staff member who knows a few words", "No one — give written English instructions"], 1, "Qualified interpreters ensure accuracy and are provided at no cost."),
        ]),
      ],
    },
    {
      title: "5. Putting it together",
      summary: "Case study.",
      lessons: [
        caseStudy("Case study: \"I don't want my pills\"", 8, `**Situation (fictional).** Mrs. L., 84, lives in an assisted living facility and has capacity to make her own decisions. At 8 a.m. she refuses her blood pressure medication, saying it makes her dizzy. A coworker suggests crushing it into her applesauce "so she gets it anyway." Her daughter calls later and demands to know Mrs. L.'s medication list.

**Discussion:**
1. May staff hide medication in food? *(No. She has the right to refuse; covert administration violates her rights.)*
2. What should happen next? *(Respect the refusal, ask about the dizziness, report to the supervisor or nurse and document; the prescriber can be contacted about side effects.)*
3. Can you give the daughter the medication list? *(Only if Mrs. L. has authorized it or the daughter is her legal representative, per HIPAA and facility policy.)*
4. What if Mrs. L. later wants to file a complaint about the coworker's suggestion? *(Help her use the grievance process and provide ombudsman contact information; no retaliation.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Patient and Resident Rights — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Which Florida statute contains the Florida Patient's Bill of Rights and Responsibilities?", ["s. 381.026, F.S.", "s. 415.1034, F.S.", "s. 429.52, F.S.", "s. 456.0341, F.S."], 0, "Section 381.026 sets out the Florida Patient's Bill of Rights and Responsibilities."),
      tf("A resident with decision-making capacity may refuse a medication even if staff believe it is necessary.", true, "Competent adults may refuse treatment; report and document the refusal."),
      mc("Which action best protects privacy during personal care?", ["Leave the door open for safety", "Close the door or curtain and keep the person covered", "Discuss the care with the roommate", "Take a photo for the chart"], 1, "Physical privacy is a core right."),
      mc("Who is responsible for obtaining informed consent for a procedure?", ["The receptionist", "The licensed practitioner performing the procedure", "Any family member", "The billing office"], 1, "The practitioner explains risks, benefits and alternatives; other staff support and report concerns."),
      mc("A medication used to control behavior for staff convenience is a:", ["Standing order", "Chemical restraint", "Comfort measure", "PRN order"], 1, "Using medication for discipline or convenience is a chemical restraint and violates rights."),
      ms("Which are rights of nursing home residents? (Select all that apply.)", ["To manage their own funds", "To voice grievances without reprisal", "To participate in care planning", "To be restrained for staff convenience"], [0, 1, 2], "Residents have the right to be free from restraints for discipline or convenience."),
      mc("For a patient with limited English proficiency, the best interpreter for medical information is:", ["A minor child of the patient", "A qualified medical interpreter", "A bilingual visitor", "A translation app with no review"], 1, "Qualified interpreters reduce errors; language assistance is free under civil rights law."),
      tf("Facilities may require a patient to sign an advance directive as a condition of receiving care.", false, "Under the Patient Self-Determination Act, care cannot be conditioned on having an advance directive."),
      mc("A Florida document naming a person to make health care decisions if you cannot is a:", ["Living will", "Designation of health care surrogate", "DNR order", "Power of attorney for property only"], 1, "A designation of health care surrogate names the decision-maker; a living will states treatment wishes."),
      sc("A resident says, \"I want to complain about the food, but I'm afraid they'll be mad at me.\" Best response:", ["Discourage the complaint to keep the peace", "Reassure her she can complain without retaliation and help her use the grievance process", "Tell her the food is fine", "Report her to the administrator as difficult"], 1, "Residents may voice grievances without fear of reprisal; staff should help."),
      mc("Hiding medication in food without an order and the person's informed consent is:", ["Acceptable for residents who refuse often", "A violation of the person's rights", "Required by policy", "Allowed if the family agrees"], 1, "Covert medication administration overrides the right to refuse."),
      tf("Florida ALF residents generally must receive at least 45 days' notice before relocation or termination of residency, except in specified circumstances.", true, "Section 429.28, F.S., provides for 45 days' notice with limited exceptions."),
      mc("Which program advocates for residents of nursing homes and assisted living facilities in Florida?", ["The Florida Long-Term Care Ombudsman Program", "The Board of Medicine", "The Department of Revenue", "The Small Business Administration"], 0, "The Long-Term Care Ombudsman Program investigates and resolves residents' complaints."),
      sc("A daughter asks for her father's diagnosis at the nurses' station. He has capacity and has not authorized her. You should:", ["Tell her because she is family", "Explain you can't share without his permission and offer to ask him", "Give her the chart", "Tell her to call the doctor at home"], 1, "Respect privacy and the patient's control of his information."),
      mc("Which is the correct sequence when a person refuses care?", ["Force the care, then document", "Respect the refusal, explore reasons, report and document", "Ignore it and try again tomorrow without reporting", "Ask a coworker to hold them"], 1, "Respect, explore, report and document."),
    ],
  },
};
