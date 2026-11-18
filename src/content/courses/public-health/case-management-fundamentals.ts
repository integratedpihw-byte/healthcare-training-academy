import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const caseManagementFundamentals: CourseContent = {
  code: "CHITA-CM-001",
  title: "Case Management Fundamentals: Process, Care Planning and Ethics",
  categorySlug: "case-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 85,
  clinicalReviewRequired: false,
  description:
    "The core of professional case management in health and human services: the case management process described in the CMSA Standards of Practice (2022), client-centered assessment, SMART goals and care plans, care coordination and advocacy, documentation, privacy (HIPAA and 42 CFR Part 2), professional boundaries, mandatory reporting in Florida, and safe transitions out of case management.",
  targetAudience: "New and current case managers, care coordinators, community health workers, social workers and nurses in public health, behavioral health, HIV, maternal-child and community programs.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Describe the components of the case management process.",
    "Complete a strengths-based, client-centered assessment.",
    "Write SMART goals and a care plan with the client.",
    "Apply privacy rules, including HIPAA and 42 CFR Part 2, to case management communication.",
    "Maintain professional boundaries and meet Florida's mandatory reporting requirements.",
  ],
  regulatoryReferences: [
    { agency: "U.S. Department of Health and Human Services, Office for Civil Rights", citation: "45 CFR Parts 160 and 164", title: "HIPAA Privacy Rule", url: "https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" },
    { agency: "Substance Abuse and Mental Health Services Administration", citation: "42 CFR Part 2", title: "Confidentiality of Substance Use Disorder Patient Records", url: "https://www.ecfr.gov/current/title-42/chapter-I/subchapter-A/part-2" },
    { agency: "Florida Legislature", citation: "s. 39.201, F.S.; s. 415.1034, F.S.", title: "Mandatory reporting of child abuse and of abuse of vulnerable adults", url: "https://www.flsenate.gov/Laws/Statutes/2025/39.201" },
  ],
  sourceReferences: [
    { title: "Standards of Practice for Case Management (2022)", publisher: "Case Management Society of America", url: "https://cmsa.org/sop", accessedOn: ACCESSED },
    { title: "Florida Abuse Hotline — Frequently Asked Questions", publisher: "Florida Department of Children and Families", url: "https://www.myflfamilies.com/services/abuse/abuse-hotline/faq", accessedOn: ACCESSED },
    { title: "Fact Sheet: 42 CFR Part 2 Final Rule", publisher: "U.S. Department of Health and Human Services", url: "https://www.hhs.gov/hipaa/for-professionals/regulatory-initiatives/fact-sheet-42-cfr-part-2-final-rule/index.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. What case management is",
      summary: "Purpose, principles and the case management process.",
      lessons: [
        text("Purpose and process", 14, `**Case management** is a collaborative process that helps a client — and, when the client wishes, their family or support system — get the health and human services they need. The case manager assesses needs, plans with the client, coordinates services, advocates, monitors progress and evaluates outcomes, using available resources wisely.

The **Case Management Society of America (CMSA) Standards of Practice for Case Management** (revised 2022) are widely used across settings. They describe the case management **process** as a set of overlapping, cyclical steps:
1. **Client identification, selection and engagement** — finding people who would benefit (for example, through referrals or screening), explaining the program and building rapport. The client agrees to participate.
2. **Assessment and opportunity identification** — gathering information on health, functioning, social needs, strengths, preferences and goals; identifying problems and opportunities.
3. **Development of the case management plan** — with the client, setting goals, actions, responsibilities and timeframes.
4. **Implementation and coordination of the care plan** — making referrals, arranging services, communicating with the care team and advocating.
5. **Monitoring and evaluation** — checking whether services are delivered and goals are met, and revising the plan when needed.
6. **Closure of the professional case management services** — ending services when goals are met, the client chooses, the client transfers or moves, or other reasons, with a safe transition plan.

### Guiding ideas
- **Client-centered and client-driven** — the client sets priorities; you are a partner, not a director.
- **Strengths-based** — build on what the client already does well and the resources they have.
- **Self-determination** — respect the client's right to make choices, even ones you would not make, as long as they are informed.
- **Trauma-informed** — recognize that many clients have experienced trauma; offer choice, explain what will happen, and avoid re-traumatizing practices.
- **Cultural humility and language access** — use qualified interpreters and respect beliefs.`),
        check("Check your understanding: process", [
          kc("cm1", "Which step comes right after assessment in the case management process?", ["Closure", "Developing the case management plan", "Client identification", "Billing"], 1, "Planning follows assessment."),
          kc("cm2", "A client chooses not to pursue a referral after you explain the risks and benefits. This reflects:", ["Non-compliance to be reported", "The principle of self-determination", "A HIPAA violation", "Failure of case management"], 1, "Informed choices are the client's right."),
        ]),
      ],
    },
    {
      title: "2. Assessment and care planning",
      summary: "Strengths-based assessment and SMART goals.",
      lessons: [
        text("Assessment", 10, `A good assessment is a **conversation**, not an interrogation. Explain why you are asking, use the client's preferred language, and let them tell their story. Domains usually include:
- **Physical health** — conditions, medications, providers, recent hospital or ER use
- **Behavioral health** — mood, stress, substance use (screen with approved tools)
- **Functional status** — activities of daily living, mobility, cognition
- **Social needs** — housing, food, income, transportation, utilities, safety
- **Support system** — family, friends, community or faith groups
- **Insurance and benefits** — coverage, eligibility for programs
- **Strengths, goals and preferences** — what matters most to the client
- **Health literacy and communication needs**

Use your program's standard assessment tools, and reassess at intervals your program requires and whenever there is a significant change (for example, a hospitalization, loss of housing or a new diagnosis).`),
        text("SMART goals and the care plan", 12, `The care plan turns the assessment into action. It is **developed with the client**, in their words when possible, and is signed or acknowledged according to your program's rules.

### SMART goals
- **S**pecific — clear about what will happen
- **M**easurable — you can tell whether it happened
- **A**chievable — realistic for this client now
- **R**elevant — matters to the client and their health
- **T**ime-bound — has a target date

*Not SMART:* "Client will get healthier."
*SMART:* "Ms. Lopez will attend her primary care appointment on May 12 using the transportation benefit, and bring her medication list."

### A care plan includes
- The client's **priorities and goals**
- **Action steps**: who does what (client, case manager, others) and by when
- **Referrals and services** and their status
- **Barriers** and how they will be addressed
- **Review date**

### Care coordination and advocacy
Coordination means making sure the client's providers and services work together — sharing information (with consent where required), avoiding duplication and closing gaps. **Advocacy** means speaking up for the client's needs and helping them speak up for themselves (for example, appealing a denied benefit or requesting an interpreter).`),
        check("Check your understanding: planning", [
          kc("cm3", "Which goal is SMART?", ["Client will improve diabetes", "Client will check blood sugar every morning and record it in the log, reviewed at the visit on June 3", "Client will be more responsible", "Client will try harder with health"], 1, "It is specific, measurable, achievable, relevant and time-bound."),
          kc("cm4", "Who should develop the care plan?", ["The case manager alone", "The case manager with the client", "The insurance company", "The client's employer"], 1, "Care plans are developed collaboratively."),
        ]),
      ],
    },
    {
      title: "3. Documentation, privacy and ethics",
      summary: "Records, HIPAA, 42 CFR Part 2, boundaries and reporting.",
      lessons: [
        text("Documentation", 6, `Documentation tells the client's story and shows the work that was done. It supports continuity when another staff member steps in, and it is reviewed by supervisors, auditors and funders.
- Document **promptly** (according to program timelines), **objectively** and **accurately**.
- Record facts and the client's own words in quotation marks; avoid labels and judgments ("non-compliant," "difficult").
- Include contacts, assessments, care plan updates, referrals and outcomes, and consent forms.
- Never document in a record you are not authorized to access, and never alter past entries — use your system's correction or addendum process.`),
        text("Privacy and confidentiality", 12, `### HIPAA
The **HIPAA Privacy Rule** protects individually identifiable health information held by covered entities (health plans, most health care providers, clearinghouses) and their business associates. Key points for case managers:
- Disclosures for **treatment, payment and health care operations** are generally permitted without written authorization — including coordinating care with the client's other providers.
- Other disclosures (for example, to a landlord or employer) generally require the client's **written authorization**.
- Share the **minimum necessary** information for the purpose (does not apply to treatment disclosures between providers).
- Clients have rights to access their records and request corrections.
- Discuss clients only in private places; lock screens; use secure messaging.

Many community programs that are not HIPAA-covered still must protect confidentiality under state law, grant terms and professional ethics.

### 42 CFR Part 2
Records from federally assisted **substance use disorder (SUD) treatment programs** have extra protection under **42 CFR Part 2**. In general, Part 2 records may not be disclosed without the patient's written **consent**, with limited exceptions (such as medical emergencies). A final rule issued in February 2024 (compliance required by February 16, 2026) aligned Part 2 more closely with HIPAA — for example, a single consent can now permit future uses and disclosures for treatment, payment and health care operations — but Part 2 records still have special protections, including limits on use in legal proceedings against the patient. Ask your privacy officer before sharing any SUD treatment information.

### Florida-specific confidentiality
Florida law gives additional protection to certain information, including **HIV test results** (s. 381.004, F.S.), mental health records and others. Follow your program's policies.`),
        text("Boundaries and mandatory reporting", 10, `### Professional boundaries
Case management relationships are close and long-term, so boundaries protect both clients and staff.
- Do not accept significant gifts, money or favors; follow your agency's gift policy.
- Do not enter financial, romantic or sexual relationships with clients.
- Avoid dual relationships (for example, hiring a client for personal work).
- Use agency phones and accounts, not personal social media, to communicate with clients.
- Do not share excessive personal information.
- Talk with your supervisor about any situation that feels unclear.

### Mandatory reporting in Florida
Florida law requires **any person** who knows, or has reasonable cause to suspect, that a **child** is abused, abandoned or neglected — and anyone who knows or suspects that a **vulnerable adult** is being abused, neglected or exploited — to report it immediately to the **Florida Abuse Hotline**:
- **1-800-96-ABUSE (1-800-962-2873)**, 24 hours a day, 7 days a week (TTY 1-800-955-8771 or Florida Relay 711), or online at reportabuse.myflfamilies.com when no one is in immediate danger
- Call **911** if someone is in immediate danger.
You do not need proof — reasonable suspicion is enough. Reporters acting in good faith are protected from liability. Tell your supervisor and document according to policy, but do not delay the report to get approval.

### Ethics
Case managers commonly follow a professional code of ethics (for example, the CCMC Code of Professional Conduct for Case Managers, the NASW Code of Ethics or the ANA Code of Ethics for Nurses). Common principles include autonomy, beneficence (doing good), non-maleficence (avoiding harm), justice (fair distribution of resources) and veracity (truthfulness).`),
        check("Check your understanding: privacy and ethics", [
          kc("cm5", "Do you need written authorization under HIPAA to share information with the client's primary care provider to coordinate care?", ["Yes, always", "Generally no — treatment and care coordination disclosures are permitted", "Only if the client is a minor", "Only by fax"], 1, "Treatment disclosures are generally permitted."),
          kc("cm6", "You suspect a vulnerable adult client is being financially exploited by a relative. In Florida you must:", ["Wait until you have proof", "Report immediately to the Florida Abuse Hotline", "Only tell the relative", "Do nothing unless the client asks"], 1, "Reasonable suspicion triggers mandatory reporting."),
          kc("cm7", "Records from a federally assisted substance use disorder treatment program are additionally protected by:", ["OSHA", "42 CFR Part 2", "The Fair Housing Act", "FERPA only"], 1, "42 CFR Part 2 protects SUD treatment records."),
        ]),
      ],
    },
    {
      title: "4. Monitoring, closure and self-care",
      summary: "Following through and ending services well.",
      lessons: [
        text("Monitoring and closure", 8, `### Monitoring
Contact clients as often as your program requires and their needs call for. At each contact, check progress on goals, whether referrals were completed, new problems, and the client's satisfaction. Revise the plan when something changes.

### Closure
Services may close because goals were met, the client chooses to stop, the client moves or transfers, the client is no longer eligible, or the client cannot be reached after documented attempts. A good closure:
- Is **discussed with the client** when possible
- Reviews progress and remaining needs
- Provides **referrals and contacts** for ongoing support and how to return to services
- Is **documented** with the reason for closure
- Includes a **warm handoff** to the next provider when transferring

### Self-care and burnout
Case managers often hear stories of trauma, poverty and illness. **Secondary traumatic stress** and burnout are real. Use supervision, peer support and your employee assistance program; take breaks; and set realistic expectations about what you can control.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: Ms. Lopez", 12, `**Situation (fictional).** Ms. Lopez, 45, is referred after two ER visits for uncontrolled diabetes. She works two part-time jobs, has no car, and is behind on rent. She prefers Spanish.

**Engagement and assessment:** The case manager meets her in Spanish, explains the program and obtains consent. Assessment finds: missed primary care visits, insulin she sometimes skips because it is expensive, risk of eviction, strong support from her sister and her church, and a goal to "be healthy enough to keep working for my kids."

**Care plan (with Ms. Lopez):**
1. Attend primary care on May 12 using her Medicaid transportation benefit (case manager books the ride by May 1).
2. Apply for a manufacturer patient assistance program for insulin (case manager and Ms. Lopez complete the form together by May 5).
3. Referral to the county emergency rental assistance program, with a warm handoff call (by May 2).
4. Ms. Lopez will check her blood sugar each morning and log it, reviewing it at the May 12 visit.

**Monitoring:** At the two-week check-in, the ride was arranged and the insulin application was submitted, but rental assistance had a waiting list. The case manager advocated for an emergency review and connected her to a legal aid eviction-prevention clinic.

**During a visit**, Ms. Lopez's 9-year-old mentions that an adult relative "hits really hard with a belt and leaves marks." The case manager listens calmly, does not interrogate, and **calls the Florida Abuse Hotline that day**, informing the supervisor and documenting according to policy.

**Discussion:**
- Which strengths did the plan build on?
- Why is each goal SMART?
- Why did the case manager report immediately instead of investigating first?`),
      ],
    },
  ],
  finalExam: {
    title: "Case Management Fundamentals — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Case management is best described as:", ["A process where the case manager makes all decisions", "A collaborative process to assess, plan, coordinate, monitor and evaluate services to meet a client's needs", "Only arranging transportation", "A billing function"], 1, "Collaboration with the client is central."),
      ms("Which are steps in the case management process described in the CMSA Standards? (Select all that apply.)", ["Client identification, selection and engagement", "Assessment and opportunity identification", "Development of the case management plan", "Implementation and coordination", "Monitoring and evaluation", "Closure"], [0, 1, 2, 3, 4, 5], "All six are part of the process."),
      mc("A strengths-based approach means:", ["Focusing only on problems", "Building on the client's existing abilities and resources", "Ignoring risks", "Choosing goals for the client"], 1, "Strengths-based practice builds on what works."),
      mc("Which goal is SMART?", ["Client will eat better", "Client will attend two nutrition classes at the health department by March 31", "Client will try to exercise", "Client will improve"], 1, "Specific, measurable, achievable, relevant, time-bound."),
      mc("When should a client be reassessed?", ["Never", "At program-required intervals and after significant changes such as hospitalization", "Only at closure", "Only if the client complains"], 1, "Reassess routinely and after changes."),
      tf("Trauma-informed practice includes offering clients choice and explaining what will happen.", true, "Choice and transparency are key trauma-informed principles."),
      mc("Which is objective documentation?", ["\"Client was difficult and non-compliant.\"", "\"Client stated, 'I can't afford the insulin,' and has not filled the prescription since April 2.\"", "\"Client is lazy.\"", "\"Client probably won't follow through.\""], 1, "Record facts and the client's words."),
      mc("Under HIPAA, sharing information with another provider to coordinate the client's treatment:", ["Always requires written authorization", "Is generally permitted without written authorization", "Is prohibited", "Requires a court order"], 1, "Treatment disclosures are permitted."),
      mc("Sharing a client's health information with their landlord generally requires:", ["Nothing", "The client's written authorization", "Only verbal notice", "Supervisor approval only"], 1, "Disclosures outside treatment, payment and operations generally need authorization."),
      mc("42 CFR Part 2 protects:", ["All dental records", "Records of federally assisted substance use disorder treatment programs", "School records", "Employment records"], 1, "Part 2 covers SUD treatment records."),
      mc("Florida's Abuse Hotline number is:", ["1-800-96-ABUSE (1-800-962-2873)", "1-800-FLA-AIDS", "2-1-1", "9-8-8"], 0, "Report abuse to 1-800-96-ABUSE."),
      sc("You suspect a child on your caseload is being neglected but you are not sure. What should you do?", ["Wait until you are certain", "Report to the Florida Abuse Hotline — reasonable suspicion is enough", "Investigate by questioning the family extensively", "Ask the child to keep it secret"], 1, "Reasonable cause to suspect triggers a report."),
      mc("Which is a boundary violation?", ["Referring a client to a food bank", "Lending a client money from your own wallet", "Using an agency phone to call a client", "Discussing a case with your supervisor"], 1, "Financial relationships with clients cross boundaries."),
      mc("A good case closure includes:", ["Stopping contact without notice", "Reviewing progress, providing referrals and how to return, and documenting the reason", "Deleting the record", "Closing only when funding ends"], 1, "Closure should be planned and documented."),
      mc("Which ethical principle means respecting a client's right to make informed choices?", ["Beneficence", "Autonomy", "Justice", "Veracity"], 1, "Autonomy is respect for self-determination."),
    ],
  },
};
