import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED } from "./_shared";

export const healthEquitySdoh: CourseContent = {
  code: "CHITA-PH-004",
  title: "Social Determinants of Health, Health Literacy and Equitable Access",
  categorySlug: "public-health-practice",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 70,
  clinicalReviewRequired: false,
  description:
    "Practical skills for addressing the non-medical factors that shape health: the five Healthy People 2030 domains of social determinants of health, screening for health-related social needs with tools such as PRAPARE and the CMS AHC screening tool, making warm referrals to community resources, health literacy and plain language, and the teach-back method.",
  targetAudience: "Community health workers, case managers, nurses, social workers, front-desk and eligibility staff, and anyone who connects clients with services.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Name the five Healthy People 2030 domains of social determinants of health and give examples of each.",
    "Explain the difference between social determinants (community conditions) and individual health-related social needs.",
    "Screen for social needs respectfully and make a closed-loop referral.",
    "Recognize limited health literacy and use plain language and teach-back.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    { title: "Healthy People 2030 — Social Determinants of Health", publisher: "U.S. Department of Health and Human Services, Office of Disease Prevention and Health Promotion", url: "https://odphp.health.gov/healthypeople/priority-areas/social-determinants-health", accessedOn: ACCESSED },
    { title: "PRAPARE: Protocol for Responding to and Assessing Patients' Assets, Risks, and Experiences", publisher: "National Association of Community Health Centers", url: "https://prapare.org/", accessedOn: ACCESSED },
    { title: "Accountable Health Communities Health-Related Social Needs Screening Tool", publisher: "Centers for Medicare & Medicaid Services", url: "https://www.cms.gov/priorities/innovation/Files/worksheets/ahcm-screeningtool.pdf", accessedOn: ACCESSED },
    { title: "Health Literacy Universal Precautions Toolkit — Improving Spoken Communication (Tools 4–5: Communicate Clearly; Use the Teach-Back Method)", publisher: "Agency for Healthcare Research and Quality", url: "https://www.ahrq.gov/health-literacy/improve/precautions/guide/spoken.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. What shapes health",
      summary: "Social determinants and social needs.",
      lessons: [
        text("The five domains", 12, `**Social determinants of health (SDOH)** are the conditions in the environments where people are born, live, learn, work, play, worship and age that affect a wide range of health, functioning and quality-of-life outcomes and risks. Medical care matters, but much of a person's health is shaped by things that happen outside the clinic.

**Healthy People 2030** groups SDOH into **five domains**:
1. **Economic stability** — employment, income, food security, housing stability
2. **Education access and quality** — early childhood education, high school graduation, language and literacy
3. **Health care access and quality** — insurance coverage, access to primary care, health literacy
4. **Neighborhood and built environment** — safe housing, transportation, air and water quality, crime and violence
5. **Social and community context** — social support, civic participation, discrimination, incarceration

*Example:* someone without access to a grocery store with healthy food is less likely to have good nutrition, which raises the risk of heart disease, diabetes and obesity.

### Determinants versus needs
- **Social determinants** describe **community-level conditions** (for example, a neighborhood's lack of affordable housing).
- **Health-related social needs (HRSNs)** are an **individual's** immediate needs that result from those conditions (for example, a client who is about to be evicted).

Front-line staff usually help with **individual needs** — connecting someone to food, housing or transportation — while public health programs and community partners also work on the **underlying conditions**, often with sectors such as housing, education and transportation.`),
        check("Check your understanding: the domains", [
          kc("eq1", "Lack of reliable transportation to appointments falls mainly in which domain?", ["Education access and quality", "Neighborhood and built environment", "Social and community context", "Genetics"], 1, "Transportation is part of the neighborhood and built environment."),
          kc("eq2", "A specific client who cannot afford groceries this week has:", ["A social determinant", "A health-related social need", "A genetic risk", "A reportable disease"], 1, "An individual's immediate need is a health-related social need."),
        ]),
      ],
    },
    {
      title: "2. Screening and referral",
      summary: "Asking well and connecting people to help.",
      lessons: [
        text("Screening for social needs", 12, `### Standardized tools
Using a standardized screening tool helps make sure everyone is asked the same questions, and lets programs track needs over time. Common examples:
- **PRAPARE** (Protocol for Responding to and Assessing Patients' Assets, Risks, and Experiences), developed by the National Association of Community Health Centers and partners.
- The **Accountable Health Communities (AHC) Health-Related Social Needs Screening Tool**, developed by CMS, with core questions on **housing instability, food insecurity, transportation problems, utility help needs and interpersonal safety**.
Your organization chooses the tool; use the version and workflow it has approved.

### How to ask
- **Explain why** you are asking: "We ask everyone these questions because things like housing and food affect health. You can skip any question."
- Ask **everyone**, not only people you assume have needs.
- Ask in **private** and in the person's **preferred language**, using a qualified interpreter when needed.
- Respect a "no." Screening is voluntary.
- Ask about **strengths and goals**, not only problems.
- Only screen when you can **act on the answers** — have referral resources ready.

### Safety questions
If a screening question reveals interpersonal violence, abuse or neglect, follow your organization's safety protocol. Florida law requires reporting known or suspected abuse, neglect or exploitation of a **child** or a **vulnerable adult** to the **Florida Abuse Hotline (1-800-96-ABUSE)**.`),
      ],
    },
    {
      title: "3. Closing the loop",
      summary: "Warm handoffs, follow-up and documentation.",
      lessons: [
        text("Closing the loop", 8, `A list of phone numbers often isn't enough. A **closed-loop referral** means:
1. **Match** the need to the right resource (for example, 2-1-1, food banks, Low Income Home Energy Assistance Program, housing authority, Medicaid eligibility).
2. **Make a warm handoff** when possible — call together, complete the referral form with the client, or introduce them in person.
3. **Confirm** the client knows what to bring, where to go and when.
4. **Follow up** to find out whether they received the service, and try another option if not.
5. **Document** the screening result, referral and outcome in the record.

Many communities use shared referral platforms to send and track referrals between health and social service organizations. Share only the minimum necessary information and follow your privacy policies and the client's consent.`),
        check("Check your understanding: screening", [
          kc("eq3", "Which practice is recommended when screening for social needs?", ["Only screen clients who look like they have needs", "Explain why you ask, ask everyone, and let people skip questions", "Ask in the waiting room so it is quicker", "Screen even when there are no resources to offer"], 1, "Universal, voluntary, private screening with an explanation is recommended."),
          kc("eq4", "A closed-loop referral includes:", ["Handing over a list and closing the case", "Following up to see whether the client received the service", "Calling the client's employer", "Only documenting the screening score"], 1, "Follow-up confirms the outcome."),
        ]),
      ],
    },
    {
      title: "4. Health literacy",
      summary: "Making information easy to understand and use.",
      lessons: [
        text("Plain language and teach-back", 14, `**Health literacy** is about whether people can find, understand and use health information and services to make decisions. Healthy People 2030 also describes **organizational health literacy** — how well organizations make it possible for people to do this. Limited health literacy is common and is linked to more hospitalizations and poorer use of preventive services. It affects people of every education level, especially when they are sick, stressed or receiving new information.

You usually **cannot tell** who has limited health literacy just by looking or talking. That's why experts recommend **universal precautions**: communicate clearly with **everyone**.

### Plain language
- Use common words: "high blood pressure" instead of "hypertension"; "take with food" instead of "take PO with meals."
- Focus on **two or three key points** and what the person needs to **do**.
- Use short sentences and the active voice.
- Use pictures, models or demonstrations when helpful.
- Provide written materials at an easy reading level and in the person's language.
- Encourage questions: ask "What questions do you have?" rather than "Do you have any questions?"

### Teach-back
**Teach-back** is a way to confirm that you explained something clearly — it is **not a test of the person**. After explaining, ask them to tell you **in their own words**:
> "I want to make sure I explained this clearly. Can you tell me how you'll take this medicine when you get home?"

If they miss something, **re-explain differently** and check again. AHRQ's Health Literacy Universal Precautions Toolkit describes teach-back as a core tool.

### Numbers
Numbers can be hard. Use whole numbers and simple frequencies ("1 out of 10 people") and avoid percentages and fractions when possible.`),
      ],
    },
    {
      title: "5. Applying what you learned",
      summary: "A worked scenario to discuss with your team or supervisor.",
      lessons: [
        caseStudy("Case study: Ms. Pierre's follow-up", 10, `**Situation (fictional).** Ms. Pierre, 67, has diabetes and was recently in the hospital. She tells the community health worker (CHW) she missed her follow-up visit. Screening with the clinic's tool shows she has had trouble paying her electric bill and has no ride to the clinic. She prefers to speak Haitian Creole.

**What the CHW did:**
- Used a **qualified Haitian Creole interpreter** rather than Ms. Pierre's teenage grandson.
- Explained why the screening questions were being asked and that she could skip any.
- **Transportation:** helped her schedule her Medicaid plan's non-emergency transportation benefit for the rescheduled visit and wrote the pickup time on a card.
- **Utilities:** made a warm handoff to the local energy assistance program and helped complete the application.
- **Health literacy:** reviewed her insulin schedule using plain language and a picture-based chart, then used **teach-back**. Ms. Pierre explained she was taking her evening dose in the morning, so the CHW re-explained, checked again and alerted the nurse.
- **Followed up** two weeks later: the energy assistance was approved and Ms. Pierre attended her appointment.

**Discussion:**
- Why use a qualified interpreter instead of a family member?
- What would have been missed without teach-back?
- Which SDOH domains did this case involve?`),
      ],
    },
  ],
  finalExam: {
    title: "Social Determinants of Health and Health Literacy — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      ms("Which are Healthy People 2030 SDOH domains? (Select all that apply.)", ["Economic stability", "Education access and quality", "Health care access and quality", "Neighborhood and built environment", "Social and community context"], [0, 1, 2, 3, 4], "These are the five domains."),
      mc("Social determinants of health are best described as:", ["Only genetic factors", "Conditions where people are born, live, learn, work, play, worship and age that affect health", "Only access to hospitals", "Personal choices alone"], 1, "This is the Healthy People 2030 description."),
      mc("Food insecurity falls mainly in which domain?", ["Economic stability", "Education access and quality", "Social and community context", "Neighborhood and built environment"], 0, "Food security is grouped under economic stability."),
      mc("An individual's immediate need, such as facing eviction, is called:", ["A social determinant", "A health-related social need", "A reportable condition", "A comorbidity"], 1, "HRSNs are individual-level needs."),
      tf("Screening for social needs should be voluntary, and clients may decline to answer.", true, "Screening is voluntary."),
      mc("The CMS AHC screening tool's core questions cover:", ["Only medical history", "Housing, food, transportation, utilities and interpersonal safety", "Insurance claims history", "Immigration status"], 1, "These are the five core domains of the AHC tool."),
      mc("Why should screening be offered to everyone rather than selected clients?", ["It is faster", "Needs cannot be reliably guessed by appearance, and universal screening avoids bias", "It increases billing", "Only so the form is complete"], 1, "Universal screening finds needs that assumptions miss."),
      mc("In Florida, suspected abuse of a vulnerable adult revealed during screening should be reported to:", ["The client's landlord", "The Florida Abuse Hotline, 1-800-96-ABUSE", "Social media", "No one"], 1, "Florida requires reporting to the Abuse Hotline."),
      mc("A closed-loop referral means:", ["Giving a list of numbers", "Confirming the client received the service and documenting the outcome", "Closing the client's case", "Referring only to hospitals"], 1, "Closing the loop confirms the outcome."),
      mc("Health literacy universal precautions means:", ["Testing everyone's reading level", "Communicating clearly with everyone because you can't tell who has limited health literacy", "Only giving written information", "Avoiding explanations"], 1, "Assume everyone benefits from clear communication."),
      mc("Which is plain language?", ["\"Take one tablet PO BID.\"", "\"Take one pill in the morning and one at night.\"", "\"Your HbA1c indicates suboptimal glycemic control.\"", "\"Monitor for adverse sequelae.\""], 1, "Common words and a clear action."),
      mc("The purpose of teach-back is to:", ["Test the patient's intelligence", "Confirm you explained the information clearly", "Save time by skipping explanations", "Have the patient teach staff"], 1, "Teach-back checks the explainer's clarity."),
      sc("During teach-back, a client describes the wrong medicine schedule. What should you do?", ["Mark them non-compliant", "Re-explain in a different way and check again", "Give them a longer pamphlet", "Move on to the next topic"], 1, "Re-explain and re-check."),
      mc("Which question best encourages patients to ask questions?", ["\"You don't have any questions, do you?\"", "\"What questions do you have?\"", "\"Any questions? No? Great.\"", "\"Questions are for the doctor.\""], 1, "Open-ended invitations encourage questions."),
      mc("Which is the clearest way to share a risk?", ["\"0.1% probability\"", "\"About 1 out of 1,000 people\"", "\"A small risk ratio\"", "\"Statistically insignificant\""], 1, "Simple frequencies are easiest to understand."),
    ],
  },
};
