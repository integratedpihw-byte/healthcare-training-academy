import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, CFR_PART_2, FS_394_463, LIFELINE, SAMHSA_RECOVERY, SAMHSA_TIC, SCOPE_NOTICE } from "./_shared";

export const mhSupportWorker: CourseContent = {
  code: "CHITA-MH-003",
  title: "Mental Health Support Worker Certificate (Intermediate)",
  categorySlug: "mental-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 170,
  clinicalReviewRequired: true,
  programClassification: "PROFESSION_SPECIFIC",
  certificateType: "PROFESSIONAL_DEVELOPMENT",
  credentialNotice: `${SCOPE_NOTICE} It is not the Florida Certification Board's Certified Recovery Peer Specialist or any other state-recognized behavioral health credential. Employers in licensed settings (for example assisted living facilities with limited mental health licenses, residential treatment facilities and group homes) may have additional required training.`,
  instructorResources: "Use the de-escalation skills checklist (COMP-MH-DEESC) with role plays. Bring your organization's incident reporting form, referral procedure and crisis contact list into module 5 as a Download lesson.",
  competencyCodes: ["COMP-MH-DEESC", "COMP-DOC"],
  description:
    "Practical training for people supporting adults with mental health and behavioral health needs in community programs, assisted living, group homes, home care, adult day care, outreach and residential settings: understanding behavioral health, trauma-informed and person-centered care, recovery-oriented support, de-escalation, behavioral observation and documentation, crisis and suicide-risk identification, substance use awareness, boundaries and ethics, confidentiality, coordinating with licensed professionals, and referral procedures.",
  targetAudience: "Direct support staff, residential and group home staff, assisted living caregivers, home care workers, adult day care staff, outreach and case aides.",
  prerequisites: ["CHITA-MH-001"],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher. De-escalation is evaluated separately by role play.",
  objectives: [
    "Describe behavioral health conditions and the support worker's role in recovery.",
    "Apply trauma-informed, person-centered and recovery-oriented approaches.",
    "Use verbal de-escalation and recognize when to call for help.",
    "Observe and document behavior objectively.",
    "Identify crisis and suicide risk and follow referral and reporting procedures.",
    "Keep professional boundaries and protect confidentiality, including 42 CFR Part 2.",
    "Coordinate with licensed professionals and know the limits of your role.",
  ],
  regulatoryReferences: [FS_394_463, CFR_PART_2, { agency: "U.S. Department of Health and Human Services, Office for Civil Rights", citation: "45 CFR Parts 160 and 164", title: "HIPAA Privacy Rule", url: "https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" }],
  sourceReferences: [
    SAMHSA_RECOVERY,
    SAMHSA_TIC,
    LIFELINE,
    { title: "Fact Sheet: 42 CFR Part 2 Final Rule", publisher: "U.S. Department of Health and Human Services", url: "https://www.hhs.gov/hipaa/for-professionals/regulatory-initiatives/fact-sheet-42-cfr-part-2-final-rule/index.html", accessedOn: ACCESSED },
    { title: "Florida Abuse Hotline — Frequently Asked Questions", publisher: "Florida Department of Children and Families", url: "https://www.myflfamilies.com/services/abuse/abuse-hotline/faq", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Behavioral health and recovery",
      summary: "Your role and recovery-oriented support.",
      lessons: [
        text("Understanding behavioral health", 12, `**Behavioral health** covers mental health and substance use, and how behaviors, emotions and biology affect wellbeing. People you support may live with conditions such as depression, bipolar disorder, schizophrenia, PTSD, anxiety disorders, substance use disorders, or co-occurring conditions, often alongside physical health problems.

### The support worker's role
- Help people with daily living, routines and skills, according to their plan
- Encourage and support recovery goals
- Observe, document and report changes
- Respond to distress and crises safely and get help
- Connect people with services and natural supports

### What you do not do
Diagnose, provide therapy, change medications, or make treatment decisions. You **coordinate** with licensed professionals (psychiatrists, nurses, therapists, case managers) and follow the person's service plan.`),
        text("Recovery-oriented support", 12, `SAMHSA's working definition describes **recovery** as a process of change through which individuals improve their health and wellness, live a self-directed life, and strive to reach their full potential. SAMHSA describes four major dimensions that support a life in recovery: **health, home, purpose and community**.

### SAMHSA's guiding principles of recovery (in brief)
Recovery emerges from **hope**; is **person-driven**; occurs via **many pathways**; is **holistic**; is supported by **peers and allies**; is supported through **relationships and social networks**; is **culturally based**; is supported by addressing **trauma**; involves individual, family and community **strengths and responsibility**; and is based on **respect**.

### In practice
- Believe recovery is possible and say so.
- Ask about the person's goals and what matters to them.
- Build on strengths; support choices, including the right to make mistakes.
- Encourage connection with peers, family, faith and community.
- Celebrate progress; treat setbacks as part of the journey, not failure.`),
        check("Check your understanding: recovery", [
          kc("sw1", "Which are SAMHSA's four dimensions that support a life in recovery?", ["Health, home, purpose, community", "Food, water, shelter, money", "Diagnosis, treatment, discharge, follow-up", "Medication, therapy, hospital, rest"], 0, "Health, home, purpose and community."),
          kc("sw2", "A support worker's role includes:", ["Changing a person's medication dose", "Observing, documenting and reporting changes and supporting recovery goals", "Diagnosing conditions", "Providing psychotherapy"], 1, "Support workers support and coordinate; clinicians diagnose and treat."),
        ]),
      ],
    },
    {
      title: "2. Trauma-informed and person-centered care",
      summary: "Safety, choice and the person at the center.",
      lessons: [
        text("Trauma-informed and person-centered care", 14, `Many people with behavioral health conditions have experienced trauma. A **trauma-informed** approach (SAMHSA) realizes how widespread trauma is, recognizes its signs, responds by building that knowledge into practice, and actively resists **re-traumatization**. SAMHSA's six key principles: **safety; trustworthiness and transparency; peer support; collaboration and mutuality; empowerment, voice and choice; and cultural, historical and gender issues.** (See the Trauma-Informed Care certificate for depth.)

### Person-centered care
- The person is the expert on their life; plans reflect **their** goals.
- Offer choices in daily routines whenever possible.
- Explain what you are doing and why; ask permission before touching.
- Respect culture, faith, gender identity and personal preferences.
- Use the person's preferred name and pronouns.

### Avoid practices that can re-traumatize
Raised voices, threats, surprise changes, unnecessary physical contact, loss of privacy, power struggles, and talking about people in front of them.`),
        check("Check your understanding: trauma-informed care", [
          kc("sw3", "Which is one of SAMHSA's six key principles of a trauma-informed approach?", ["Compliance", "Empowerment, voice and choice", "Punishment", "Isolation"], 1, "Empowerment, voice and choice is a key principle."),
        ]),
      ],
    },
    {
      title: "3. De-escalation and behavioral observation",
      summary: "Calming tense situations and describing behavior objectively.",
      lessons: [
        text("Verbal de-escalation", 16, `Agitation often comes from fear, frustration, pain, unmet needs, symptoms, substances or feeling disrespected.

### Before
Know the person: triggers, early warning signs and what helps (often in their plan). Notice early signs such as pacing, clenched fists, raised voice or withdrawal, and respond early.

### During
- **Safety:** keep a safe distance (more than an arm's length), stand at an angle, keep an exit route for both of you, remove others from the area.
- **Calm presence:** quiet, slow voice; relaxed posture; hands visible.
- **One person** speaks.
- **Listen and reflect:** "You're angry because your visit was cancelled."
- **Respect:** use their name, avoid commands, threats and sarcasm.
- **Offer choices:** "Would you like to talk here or go outside for some air?"
- **Set limits** clearly and calmly: "I want to help, and I need you to stop throwing things."
- **Give time** — don't rush.

### Know when to get help
If there is a weapon, physical violence, or you feel unsafe: leave, protect others and call your supervisor, crisis team or **911**. Use physical intervention or restraint **only** if your organization trains and authorizes it under its policies and the law — never improvise.

### After
Check that everyone is safe, give the person space, report and document, and debrief with your team.`),
        text("Behavioral observation and documentation", 12, `Good documentation helps the clinical team understand what is happening.

**Describe what you see and hear, not your interpretation.**
| Instead of | Write |
|---|---|
| "Client was aggressive." | "At 3:15 p.m. client shouted 'Leave me alone!' and threw a cup against the wall. No one was hit." |
| "Client was paranoid." | "Client said, 'The neighbors are recording me through the TV,' and covered the TV with a blanket." |
| "Client was depressed." | "Client stayed in bed until 2 p.m., declined lunch, and said, 'There's no point.'" |

Include: date and time; what happened before (trigger), during and after; the person's own words in quotation marks; what you did; who you notified and when; outcome. Use the **ABC** pattern if helpful: **A**ntecedent, **B**ehavior, **C**onsequence.

Document promptly, factually and only what you observed. Never alter records.`),
        check("Check your understanding: de-escalation and documentation", [
          kc("sw4", "Which is a de-escalation technique?", ["Standing directly in front of the person blocking the door", "Keeping a calm voice, a safe distance and offering choices", "Raising your voice to be heard", "Threatening consequences"], 1, "Calm, space and choice reduce tension."),
          kc("sw5", "Which documentation entry is objective?", ["\"Client was paranoid.\"", "\"Client said, 'Someone is following me,' and checked the window six times in 10 minutes.\"", "\"Client is crazy today.\"", "\"Client was difficult.\""], 1, "Record observed behavior and the person's words."),
        ]),
      ],
    },
    {
      title: "4. Crisis, suicide risk and substance use",
      summary: "Identifying risk and acting quickly.",
      lessons: [
        text("Crisis identification and suicide prevention awareness", 14, `### Crisis signs
Talking about suicide or harming others, severe agitation, psychosis with unsafe behavior, inability to care for self, overdose, severe withdrawal, sudden calm after a period of depression, or giving possessions away.

### Your steps
1. **Safety first** — for the person, others and you.
2. **Ask directly** about suicide when you see warning signs: "Are you thinking about killing yourself?"
3. **Stay** with a person at immediate risk; remove access to means if safe and permitted.
4. **Notify** your supervisor and the person's clinician per policy; use **988**; call **911** for immediate danger or medical emergency.
5. **Document** and follow up.

In Florida, involuntary examination under the Baker Act is started only by a court, law enforcement or certain licensed professionals. Your role is to recognize risk, keep people safe and get help.`),
        text("Substance use awareness", 12, `- Watch for signs of intoxication, withdrawal and overdose, and changes such as missed appointments, money problems, new friends, secrecy or mood swings.
- Respond without judgment; substance use disorders are treatable medical conditions and often co-occur with mental health conditions.
- Know your setting's policy on substances and on naloxone. Learn to recognize opioid overdose and respond (call 911, give naloxone if available and trained, support breathing, stay).
- Support recovery: encourage treatment and peer support, avoid shaming language, and celebrate steps forward.
- Report concerns to the clinical team; do not search belongings or drug-test unless your policy authorizes it.`),
        check("Check your understanding: crisis", [
          kc("sw6", "A resident who has been very depressed suddenly seems calm and is giving away belongings. What should you do?", ["Assume she is better", "Treat it as a possible warning sign: ask directly about suicide, keep her safe and notify the clinician", "Ignore it", "Take the belongings"], 1, "Sudden calm and giving things away can signal suicide risk."),
        ]),
      ],
    },
    {
      title: "5. Ethics, confidentiality and coordination",
      summary: "Boundaries, privacy law, referrals and teamwork.",
      lessons: [
        text("Boundaries and professional ethics", 12, `- Keep relationships professional and focused on the person's goals.
- No romantic or sexual relationships with people you support; no financial dealings, loans or gifts beyond policy; no personal social media contact.
- Avoid **dual relationships** (being a friend, landlord or employer as well as a support worker).
- Don't share excessive personal information; self-disclosure only when it helps the person and fits policy.
- Respect **rights**: dignity, privacy, communication, freedom from abuse and restraint except as allowed by law, and the right to refuse.
- Report suspected abuse, neglect or exploitation of vulnerable adults or children to the **Florida Abuse Hotline: 1-800-96-ABUSE**.
- Take care of yourself: secondary traumatic stress and burnout are real; use supervision and your EAP.`),
        text("Confidentiality and coordination with professionals", 14, `### Confidentiality
- **HIPAA** protects health information held by covered health care providers and plans. Share information only for treatment, payment, operations or as authorized and required by law, and only the minimum necessary.
- **42 CFR Part 2** gives extra protection to records from federally assisted **substance use disorder treatment programs**. A 2024 final rule aligned Part 2 more closely with HIPAA (for example, one consent can cover future treatment, payment and health care operations), but Part 2 records still have special protections, including limits on use in legal proceedings against the patient. Ask your privacy officer before sharing SUD treatment information.
- **Florida law** gives additional confidentiality to mental health clinical records (for example under the Baker Act). Follow your organization's policies.
- Never discuss people you support in public places or online. Do not confirm someone receives services without authorization.

### Coordinating with licensed professionals
- Know who is on the team and how to reach them, including after hours.
- Report observations promptly and objectively using your organization's method (for example SBAR).
- Follow the plan; ask questions when instructions are unclear; never change treatment yourself.
- Share the person's own words, goals and concerns with the team.

### Referral procedures
Follow your organization's referral pathway: identify the need, discuss with the person (consent), contact the right service, provide required information, document, and follow up to confirm the connection.`),
        caseStudy("Case study: Jordan at the group home", 14, `**Situation (fictional).** Jordan, 27, lives in a group home and has bipolar disorder and an alcohol use disorder in early recovery. Tonight Jordan returns from a family visit, slams the door, shouts that "nobody listens," and says, "Maybe I should just drink and end it all."

**Discuss:**
1. How do you de-escalate? *(Calm voice, safe distance, reflect feelings — "Something at the visit really upset you" — offer a quieter space, one staff member speaks.)*
2. What do you do about the statement? *(Ask directly about suicide, stay with Jordan, check for means and alcohol, contact the on-call clinician, use 988, and call 911 if there is immediate danger.)*
3. What do you document? *(Time; Jordan's exact words in quotes; behaviors observed; actions taken; who was notified and when; outcome.)*
4. A friend of Jordan's calls asking whether Jordan is "back in treatment for drinking." How do you respond? *(Do not confirm or deny services without authorization; follow HIPAA and 42 CFR Part 2 policies.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Mental Health Support Worker — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("A support worker's role does NOT include:", ["Observing and reporting changes", "Supporting daily living skills", "Diagnosing mental illness", "Connecting people with services"], 2, "Diagnosis is for licensed professionals."),
      mc("SAMHSA describes recovery as:", ["A cure with no setbacks", "A process of change through which individuals improve their health and wellness, live a self-directed life, and strive to reach their full potential", "Staying in a hospital", "Only abstinence"], 1, "This is SAMHSA's working definition."),
      ms("SAMHSA's four dimensions that support recovery are: (Select all that apply.)", ["Health", "Home", "Purpose", "Community"], [0, 1, 2, 3], "All four."),
      mc("Which is a trauma-informed practice?", ["Surprise room searches", "Explaining what you will do and offering choices", "Raising your voice to gain control", "Discussing the person in front of others"], 1, "Transparency and choice support safety."),
      mc("When de-escalating, you should:", ["Stand close and block the door", "Keep a safe distance, a calm voice and an exit route", "Argue the facts", "Use sarcasm"], 1, "Safety and calm presence come first."),
      tf("Staff may use physical restraint whenever they think it is needed, even without training.", false, "Only trained, authorized intervention under policy and law."),
      mc("Which entry is objective documentation?", ["\"Resident was aggressive.\"", "\"At 7:10 p.m. resident shouted and kicked a chair; no one was hurt.\"", "\"Resident is manipulative.\"", "\"Resident acted crazy.\""], 1, "Describe observable behavior and facts."),
      mc("In the ABC approach, \"A\" stands for:", ["Action", "Antecedent — what happened before", "Answer", "Attitude"], 1, "Antecedent, Behavior, Consequence."),
      mc("Sudden calm after a period of deep depression can be:", ["Always a sign of recovery", "A possible suicide warning sign", "Unimportant", "A side effect only"], 1, "Ask directly and get help."),
      mc("Who can initiate a Baker Act involuntary examination in Florida?", ["Any support worker", "A court, law enforcement officer, or certain licensed professionals", "Family members by phone", "The landlord"], 1, "Support workers call 911 or the crisis team."),
      mc("42 CFR Part 2 protects:", ["All school records", "Records of federally assisted substance use disorder treatment programs", "Employment records", "Property records"], 1, "Part 2 adds protections for SUD treatment records."),
      mc("A caller asks whether someone receives services at your program. Without authorization you should:", ["Confirm it", "Neither confirm nor deny and follow privacy policy", "Give their address", "Ask the caller to come by"], 1, "Protect confidentiality."),
      mc("Which is a boundary violation?", ["Encouraging peer support", "Lending money to a person you support", "Documenting objectively", "Referring to the team"], 1, "Financial dealings cross boundaries."),
      mc("Suspected abuse of a vulnerable adult in Florida is reported to:", ["The Florida Abuse Hotline, 1-800-96-ABUSE", "Social media", "No one", "The person's employer"], 0, "Report immediately."),
      sc("A person you support says he plans to overdose tonight and shows you a bottle of pills. What do you do?", ["Promise not to tell", "Stay with him, try to safely secure the pills per policy, and call 911 or the crisis line immediately; notify your supervisor", "Leave him alone to think", "Wait until morning"], 1, "Immediate risk requires immediate action."),
    ],
  },
};
