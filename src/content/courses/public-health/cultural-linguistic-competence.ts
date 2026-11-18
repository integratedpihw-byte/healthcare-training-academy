import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const culturalLinguisticCompetence: CourseContent = {
  code: "CHITA-PH-005",
  title: "Culturally and Linguistically Appropriate Services and Language Access",
  categorySlug: "public-health-practice",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 75,
  clinicalReviewRequired: false,
  description:
    "How to serve every client respectfully and understandably: the National CLAS Standards and their three themes, the federal civil rights laws on language access and disability (Title VI, Section 1557 of the Affordable Care Act and the ADA), working with qualified interpreters and translated materials, and practical communication tools such as Kleinman's explanatory model questions and the LEARN model.",
  targetAudience: "All staff who interact with patients, clients or the public, including front-desk, call-center, outreach, case management and clinical staff.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Describe the purpose of the National CLAS Standards and their three themes.",
    "Explain the federal laws that require language assistance and effective communication.",
    "Work effectively with qualified interpreters and avoid using family members or minors as interpreters.",
    "Use explanatory model questions and the LEARN model to understand a client's perspective.",
  ],
  regulatoryReferences: [
    { agency: "U.S. Department of Justice", citation: "42 U.S.C. § 2000d", title: "Title VI of the Civil Rights Act of 1964", url: "https://www.justice.gov/crt/fcs/TitleVI" },
    { agency: "U.S. Department of Health and Human Services, Office for Civil Rights", citation: "42 U.S.C. § 18116; 45 CFR Part 92", title: "Section 1557 of the Affordable Care Act — Nondiscrimination in Health Programs and Activities", url: "https://www.hhs.gov/civil-rights/for-individuals/section-1557/index.html" },
    { agency: "U.S. Department of Justice", citation: "28 CFR 35.160 and 36.303", title: "ADA effective communication requirements", url: "https://www.ada.gov/resources/effective-communication/" },
  ],
  sourceReferences: [
    { title: "National CLAS Standards", publisher: "U.S. Department of Health and Human Services, Office of Minority Health (Think Cultural Health)", url: "https://thinkculturalhealth.hhs.gov/clas/standards", accessedOn: ACCESSED },
    { title: "National CLAS Standards (Revised June 2025)", publisher: "U.S. Department of Health and Human Services, Office of Minority Health", url: "https://thinkculturalhealth.hhs.gov/assets/pdfs/EnhancedNationalCLASStandards_Revised_June2025.pdf", accessedOn: ACCESSED },
    { title: "Limited English Proficiency (LEP) — Language Access", publisher: "U.S. Department of Health and Human Services, Office for Civil Rights", url: "https://www.hhs.gov/LanguageAccess", accessedOn: ACCESSED },
    { title: "ADA Requirements: Effective Communication", publisher: "U.S. Department of Justice, Civil Rights Division", url: "https://www.ada.gov/resources/effective-communication/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. The National CLAS Standards",
      summary: "What CLAS is and how the standards are organized.",
      lessons: [
        text("Respect and responsiveness", 12, `**Culturally and linguistically appropriate services (CLAS)** are services that are respectful of and responsive to each person's culture and communication needs. "Culture" is broad: it includes language, race and ethnicity, and also religion, geography, age, disability, occupation and other groups that shape how people understand health and illness.

The **National CLAS Standards** were first published by the HHS Office of Minority Health in 2000, enhanced in 2013, and most recently revised in **June 2025**. They are **15 action steps** for organizations. They are voluntary guidance for most organizations, although some of the steps reflect legal requirements (such as language assistance) described in the next module.

### The principal standard
**Standard 1** is the principal standard: provide effective, equitable, understandable and respectful quality care and services that are responsive to diverse cultural health beliefs and practices, preferred languages, health literacy and other communication needs.

### Three themes
- **Governance, Leadership and Workforce (Standards 2–4)** — leadership commitment, a workforce that reflects and is trained to serve the community.
- **Communication and Language Assistance (Standards 5–8)** — offer language assistance at no cost; inform people that it is available, clearly and in their language; ensure the competence of people who provide language assistance and avoid untrained individuals and minors as interpreters; provide easy-to-understand print and multimedia materials and signage in the languages commonly used in the service area.
- **Engagement, Continuous Improvement and Accountability (Standards 9–15)** — goals and policies, ongoing assessment, data collection, community partnerships, grievance processes, and reporting progress to the community.

### Why it matters for you
You don't have to memorize the standard numbers. What matters is the everyday behavior: ask about and record the preferred language; offer an interpreter every time; use approved translated materials; and treat every client's beliefs with respect.`),
        check("Check your understanding: CLAS", [
          kc("cl1", "How many National CLAS Standards are there?", ["5", "10", "15", "21"], 2, "There are 15 standards, including the principal standard."),
          kc("cl2", "Standards 5–8 are grouped under which theme?", ["Governance, Leadership and Workforce", "Communication and Language Assistance", "Engagement, Continuous Improvement and Accountability", "Billing and Coding"], 1, "Standards 5–8 cover communication and language assistance."),
        ]),
      ],
    },
    {
      title: "2. The law on language access and effective communication",
      summary: "Title VI, Section 1557 and the ADA.",
      lessons: [
        text("Federal requirements", 14, `### Limited English proficiency (LEP)
A person with **limited English proficiency** does not speak English as their primary language and has a limited ability to read, speak, write or understand English.

### Title VI of the Civil Rights Act of 1964
Title VI prohibits discrimination on the basis of **race, color or national origin** in programs that receive **federal financial assistance**. Federal agencies and courts have long interpreted national-origin discrimination to include failing to provide **meaningful access** to people with LEP.

### Section 1557 of the Affordable Care Act
Section 1557 prohibits discrimination on the basis of race, color, national origin, sex, age or disability in health programs and activities that receive federal financial assistance (and in certain other programs). Its regulations (45 CFR Part 92) require covered entities to **take reasonable steps to provide meaningful access** to individuals with LEP, including **qualified interpreters** and **translated** documents where required, **free of charge**. Some parts of the 2024 regulations have been stayed or changed by courts; the language access requirements remain in effect. Check HHS's Section 1557 webpage and your compliance office for current status.

### Recent federal policy changes
In March 2025, **Executive Order 14224** designated English as the official language of the United States and revoked **Executive Order 13166** (2000), which had directed federal agencies to improve access for people with LEP. The Department of Justice issued related guidance in July 2025. **Title VI and Section 1557 are laws passed by Congress and remain in effect**, so organizations that receive federal funds still have legal obligations to people with LEP. Follow your organization's language access plan and consult your compliance office about how these changes affect your programs.

### The ADA: effective communication
The **Americans with Disabilities Act** requires state and local governments and businesses open to the public — including hospitals, clinics and health departments — to communicate as effectively with people with disabilities as with others. This means providing **auxiliary aids and services**, such as qualified **sign language interpreters**, video remote interpreting, captioning, large print, Braille or accessible electronic formats, **at no cost**. The type of aid depends on the person's usual method of communication and the complexity of the situation. Organizations **cannot require** a person to bring their own interpreter.

### State rules and contracts
State law, licensing rules and contracts (for example, Medicaid managed care contracts and grant terms) can add their own language and communication requirements. Check your organization's language access plan and policies for the requirements that apply to your program.`),
        check("Check your understanding: the law", [
          kc("cl3", "Which law prohibits national-origin discrimination in federally funded programs and underlies LEP access requirements?", ["HIPAA", "Title VI of the Civil Rights Act of 1964", "The Fair Labor Standards Act", "OSHA"], 1, "Title VI prohibits national-origin discrimination."),
          kc("cl4", "After Executive Order 14224 revoked EO 13166, do Title VI and Section 1557 still apply?", ["No, they were repealed", "Yes — they are statutes and remain in effect", "Only in Florida", "Only for hospitals"], 1, "Executive orders do not repeal statutes."),
          kc("cl5", "Under the ADA, may a clinic charge a deaf patient for a sign language interpreter?", ["Yes", "No — auxiliary aids and services are provided at no cost", "Only after the first visit", "Only for long appointments"], 1, "Auxiliary aids must be free to the person."),
        ]),
      ],
    },
    {
      title: "3. Working with interpreters",
      summary: "Qualified interpreters and translated materials.",
      lessons: [
        text("Qualified interpreters", 12, `### Who counts as qualified?
A **qualified interpreter** is proficient in both languages, interprets **accurately and impartially**, knows specialized terms (such as medical vocabulary) and follows **ethics and confidentiality**. Being bilingual is not the same as being a qualified interpreter. Options include in-person interpreters, telephone interpreting and video remote interpreting.

### Avoid ad hoc interpreters
- **Do not use minor children** to interpret, except in an emergency involving an imminent threat to safety when no qualified interpreter is available.
- **Do not rely on adult family members or friends** except in an emergency, or when the client **specifically asks** for them, the companion agrees and it is appropriate. Even then, have a qualified interpreter available for important information. Family members may filter information, add their own opinions, or be unable to handle sensitive topics such as abuse, sexual health or a serious diagnosis.
- Bilingual staff should interpret only if your organization has **assessed and approved** them.

### Tips for an interpreted conversation
1. **Brief** the interpreter on the purpose of the visit.
2. **Speak directly to the client**, in the first person ("How are you feeling?"), not "Ask her how she feels."
3. Use short sentences and pause to allow interpretation.
4. Avoid jargon, idioms and acronyms.
5. Expect the interpreter to interpret **everything** said in the room.
6. Use **teach-back** through the interpreter to confirm understanding.
7. **Document** the interpreter's name or ID number and the language.

### Written materials
Use **professionally translated**, approved documents for vital information (consent forms, discharge instructions, notices of rights). Do not use machine translation alone for vital documents unless it has been reviewed by a qualified human translator. For clients who cannot read in any language, use **sight translation** by a qualified interpreter, or audio and video materials.`),
        check("Check your understanding: interpreters", [
          kc("cl6", "A mother with limited English brings her 10-year-old to translate a conversation about her new diagnosis. What should you do?", ["Proceed with the child interpreting", "Arrange a qualified interpreter and do not use the child", "Use hand gestures instead", "Reschedule for a year later"], 1, "Minors should not interpret except in a true emergency."),
          kc("cl7", "When using an interpreter, you should:", ["Look at the interpreter and say \"Tell him…\"", "Speak directly to the client in the first person", "Speak in long paragraphs", "Ask the interpreter to summarize"], 1, "Address the client directly."),
        ]),
      ],
    },
    {
      title: "4. Understanding the client's perspective",
      summary: "Explanatory models and the LEARN model.",
      lessons: [
        text("Practical tools", 10, `### Avoid stereotypes
Cultural knowledge about a group is a starting point, not a script. Individuals vary widely. **Ask, don't assume.** This is sometimes called **cultural humility**: staying curious, recognizing your own assumptions, and treating the client as the expert on their own life.

### Kleinman's explanatory model questions
Psychiatrist and anthropologist Arthur Kleinman suggested questions to understand how a person sees their illness. Adapt them to your role:
- What do you call this problem?
- What do you think caused it? Why do you think it started when it did?
- What does it do to your body? How severe is it?
- What do you fear most about it?
- What kind of treatment do you think you should receive? What results do you hope for?

### The LEARN model (Berlin and Fowkes)
- **L — Listen** with sympathy and understanding to the client's view of the problem.
- **E — Explain** your perceptions of the problem.
- **A — Acknowledge** and discuss the differences and similarities.
- **R — Recommend** a plan.
- **N — Negotiate** agreement, incorporating the client's preferences where safely possible.

### Traditional and complementary practices
Many clients use home remedies, traditional healers or religious practices alongside medical care. Ask about them without judgment ("Many people use teas, herbs or other remedies. Are you using anything like that?"). Most are harmless and can be supported; if one might be harmful or interact with a medicine, explain the concern respectfully and involve the clinician.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: Mr. Nguyen and the home visit", 10, `**Situation (fictional).** Mr. Nguyen, 72, speaks Vietnamese and limited English. After a stroke, he has missed physical therapy appointments. His adult daughter usually interprets but works during the day. The case manager visits.

**What the case manager did:**
- **Arranged a qualified Vietnamese telephone interpreter** in advance rather than waiting for the daughter, and documented the interpreter ID.
- Spoke **directly** to Mr. Nguyen in short sentences.
- Used **explanatory model questions**: Mr. Nguyen believed the stroke was caused by "wind" and that rest, not exercise, would cure it. He feared that therapy would cause another stroke.
- Used **LEARN**: listened, explained how therapy helps the brain and muscles recover, acknowledged that rest is also important, recommended a gentle home exercise plan to start, and negotiated a schedule — therapy twice a week, plus a traditional balm he likes, which the nurse confirmed was safe.
- Provided **translated** exercise instructions with pictures, and used **teach-back** through the interpreter.

**Outcome:** Mr. Nguyen attended his next five therapy sessions.

**Discussion:**
- What might have gone wrong if the case manager had relied on the daughter or skipped the explanatory model questions?
- How did negotiation build trust?`),
      ],
    },
  ],
  finalExam: {
    title: "Culturally and Linguistically Appropriate Services — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("CLAS stands for:", ["Clinical Laboratory Accreditation Standards", "Culturally and Linguistically Appropriate Services", "Community Language Assistance Services", "Certified Licensed Allied Staff"], 1, "CLAS = Culturally and Linguistically Appropriate Services."),
      mc("The principal National CLAS Standard (Standard 1) calls for:", ["Hiring only bilingual staff", "Effective, equitable, understandable and respectful quality care responsive to cultural beliefs, languages, health literacy and communication needs", "English-only services", "Annual cultural festivals"], 1, "That is the principal standard."),
      ms("Which are the three themes of the National CLAS Standards? (Select all that apply.)", ["Governance, Leadership and Workforce", "Communication and Language Assistance", "Engagement, Continuous Improvement and Accountability", "Billing and Reimbursement"], [0, 1, 2], "These are the three themes."),
      tf("Under the CLAS Standards, language assistance should be offered to individuals at no cost.", true, "Standard 5 calls for free language assistance."),
      mc("Title VI of the Civil Rights Act of 1964 prohibits discrimination based on:", ["Income", "Race, color or national origin in federally funded programs", "Insurance type", "Profession"], 1, "Title VI covers race, color and national origin."),
      mc("Section 1557 of the Affordable Care Act applies to:", ["Only private gyms", "Health programs and activities that receive federal financial assistance (and certain other programs)", "Only federal prisons", "Only dental offices"], 1, "Section 1557 covers federally funded health programs."),
      mc("Which statement about Executive Order 14224 (2025) is accurate?", ["It repealed Title VI", "It revoked EO 13166, but statutes such as Title VI and Section 1557 remain in effect", "It requires all signs to be in five languages", "It applies only to schools"], 1, "Executive orders cannot repeal statutes."),
      mc("Under the ADA, effective communication for a deaf patient who uses ASL may require:", ["Writing notes for every visit regardless of complexity", "A qualified sign language interpreter or video remote interpreting at no cost", "Asking the patient to bring a friend", "Speaking louder"], 1, "Auxiliary aids depend on the person's usual communication method and the situation."),
      mc("A qualified interpreter:", ["Is anyone who speaks two languages", "Interprets accurately and impartially, knows specialized terms and follows confidentiality", "Must be a family member", "Summarizes what was said"], 1, "Qualification goes beyond being bilingual."),
      sc("A patient's 12-year-old offers to interpret a discussion about test results. No emergency exists. What should you do?", ["Accept the offer", "Thank the child and use a qualified interpreter", "Postpone indefinitely", "Proceed in English slowly"], 1, "Minors should not interpret except in emergencies."),
      mc("When working with an interpreter, it is best to:", ["Speak to the interpreter in the third person", "Speak directly to the client in the first person and pause for interpretation", "Speak quickly to save time", "Ask the interpreter to leave out sensitive parts"], 1, "Speak directly to the client."),
      mc("Vital documents such as consent forms should be:", ["Machine-translated without review", "Translated by qualified translators and approved", "Provided in English only", "Explained only by a family member"], 1, "Vital documents need qualified translation."),
      mc("\"What do you think caused your problem?\" is an example of:", ["A billing question", "Kleinman's explanatory model questions", "A HIPAA authorization", "An eligibility screen"], 1, "This is an explanatory model question."),
      mc("In the LEARN model, the N stands for:", ["Notify", "Negotiate", "Narrate", "Neglect"], 1, "Listen, Explain, Acknowledge, Recommend, Negotiate."),
      mc("Cultural humility means:", ["Knowing everything about every culture", "Staying curious, recognizing your own assumptions and treating the client as the expert on their own life", "Avoiding cultural topics", "Applying group stereotypes consistently"], 1, "Ask, don't assume."),
    ],
  },
};
