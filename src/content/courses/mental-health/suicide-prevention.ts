import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, FS_394_463, LIFELINE, NIMH_WARNING, SCOPE_NOTICE } from "./_shared";

export const suicidePrevention: CourseContent = {
  code: "CHITA-MH-006",
  title: "Suicide Prevention and Crisis Intervention Awareness (Advanced)",
  categorySlug: "mental-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 150,
  clinicalReviewRequired: true,
  programClassification: "GENERAL_EDUCATION",
  certificateType: "SPECIALIZED_TRAINING",
  credentialNotice: `${SCOPE_NOTICE} Completing this course does not authorize unlicensed personnel to diagnose, assess suicide risk clinically, treat, or independently manage psychiatric emergencies. Suicide risk assessment and safety planning are completed by qualified professionals; your role is to recognize warning signs, ask, keep the person safe, connect them with help, document and follow up within your organization's policies.`,
  instructorResources: "Prepare learners for the emotional content; offer breaks and share EAP and 988 information. Practice asking the direct question out loud in pairs. Review your organization's suicide-risk response procedure, on-call contacts and documentation form in module 4.",
  competencyCodes: ["COMP-MH-DEESC"],
  description:
    "Advanced awareness training for staff who may encounter people at risk of suicide: risk factors, protective factors and warning signs; how to ask directly and communicate supportively; reducing access to lethal means; escalating to crisis services, 988, mobile crisis and 911; Florida's Baker Act and the limits of your role; documentation; follow-up and support after a crisis; professional boundaries; and caring for yourself.",
  targetAudience: "Health care, home care, behavioral health, residential and social service staff, supervisors and team leaders.",
  prerequisites: ["CHITA-MH-001"],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Identify risk factors, protective factors and warning signs for suicide.",
    "Ask directly about suicide and respond supportively.",
    "Take immediate safety steps, including reducing access to lethal means where safe and permitted.",
    "Escalate appropriately to 988, mobile crisis, licensed professionals or 911.",
    "Explain the limits of non-licensed staff, including under Florida's Baker Act.",
    "Document objectively, support follow-up care and maintain professional boundaries.",
  ],
  regulatoryReferences: [FS_394_463],
  sourceReferences: [
    NIMH_WARNING,
    LIFELINE,
    { title: "Suicide Prevention: Risk and Protective Factors", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/suicide/risk-factors/index.html", accessedOn: ACCESSED },
    { title: "Warning Signs of Suicide", publisher: "Suicide Prevention Resource Center", url: "https://sprc.org/?p=1729", accessedOn: ACCESSED },
    { title: "Frequently Asked Questions About Suicide", publisher: "National Institute of Mental Health", url: "https://infocenter.nimh.nih.gov/sites/default/files/publications/frequently-asked-questions-about-suicide.pdf", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Understanding suicide risk",
      summary: "Risk factors, protective factors and myths.",
      lessons: [
        text("Risk factors, protective factors and myths", 15, `Suicide is a leading cause of death in the United States, and it is preventable. No single factor causes suicide; risk comes from a combination of individual, relationship, community and societal factors.

### Risk factors (examples)
- Previous suicide attempt
- Mental health conditions, especially depression, and substance use disorders
- Chronic pain or serious illness
- Hopelessness, impulsivity, social isolation
- Loss (relationship, job, money, health), legal problems
- History of trauma, abuse or bullying
- Family history of suicide
- **Access to lethal means**, especially firearms
- Barriers to health care; stigma about seeking help

### Protective factors (examples)
- Effective mental and physical health care and easy access to it
- Strong connections to family, friends and community
- Problem-solving and coping skills
- Reasons for living, cultural or religious beliefs that support living
- Limited access to lethal means

### Myths and facts
- **Myth:** Asking about suicide puts the idea in someone's head. **Fact:** Asking directly does not increase risk and can open the door to help.
- **Myth:** People who talk about suicide won't do it. **Fact:** Take every statement seriously.
- **Myth:** Nothing can stop someone who has decided. **Fact:** Suicidal crises are often temporary; reducing access to means and connecting to care saves lives.`),
        check("Check your understanding: risk", [
          kc("sp1", "Which is one of the strongest risk factors for suicide?", ["A previous suicide attempt", "Having a pet", "Regular exercise", "Strong family connections"], 0, "Prior attempts greatly increase risk."),
          kc("sp2", "Which is a protective factor?", ["Isolation", "Strong connections to family and community", "Access to firearms", "Untreated depression"], 1, "Connection protects."),
        ]),
      ],
    },
    {
      title: "2. Warning signs and asking directly",
      summary: "Recognize, ask, listen.",
      lessons: [
        text("Recognizing warning signs", 12, `Warning signs suggest someone may be at **immediate** risk, especially if they are **new or increasing**:

**Talking about:** wanting to die; great guilt or shame; being a burden to others.
**Feeling:** empty, hopeless, trapped or having no reason to live; extremely sad, anxious, agitated or full of rage; unbearable emotional or physical pain.
**Changing behavior:** making a plan or researching ways to die; withdrawing from friends, saying goodbye, giving away important items or making a will; taking dangerous risks; extreme mood swings; eating or sleeping more or less; using drugs or alcohol more often.

**Act immediately** if someone talks about suicide, has a plan, or shows several warning signs.`),
        text("Asking and responding", 15, `### Ask directly
Use clear words, calmly and privately:
- "Are you thinking about suicide?"
- "Are you thinking about killing yourself?"
Avoid vague or leading questions like "You're not thinking of doing anything stupid, are you?"

### If the answer is yes
- **Stay calm and listen.** Let them talk. Thank them for telling you.
- **Do not** argue, lecture, minimize ("You have so much to live for"), or promise secrecy.
- **Show care:** "I'm really glad you told me. I want to help you stay safe."
- **Ask about immediate danger:** "Do you have a plan? Do you have access to anything you might use to hurt yourself? Have you taken anything?"
- **Do not leave** the person alone if there is immediate danger.

### If the answer is no but you are still worried
Keep the door open: "If you ever do have those thoughts, I want you to tell me." Share 988. Report your concern according to policy.

### Listening skills
Open questions; reflecting ("It sounds like you feel trapped"); validating ("That's a lot of pain to carry"); allowing silence.`),
        check("Check your understanding: asking", [
          kc("sp3", "Which is the best way to ask?", ["\"You're not going to do anything stupid, right?\"", "\"Are you thinking about killing yourself?\"", "\"Cheer up, things will get better.\"", "Don't ask — wait for them to bring it up"], 1, "Direct, clear language."),
          kc("sp4", "A client tells you she is thinking about suicide and asks you to keep it secret. You should:", ["Promise to keep it secret", "Explain kindly that you care and must get her help to keep her safe", "Ignore it", "Tell her other clients"], 1, "Never promise secrecy when someone's safety is at risk."),
        ]),
      ],
    },
    {
      title: "3. Safety, escalation and emergency referral",
      summary: "Lethal means, who to call, and Florida law.",
      lessons: [
        text("Immediate safety and lethal means", 12, `### Lethal means safety
Reducing access to lethal means during a crisis — especially firearms and stockpiles of medicine — saves lives, because suicidal crises are often brief.
- If it is safe and allowed by your organization's policy, help put **time and distance** between the person and the means (for example, asking the person or family to store firearms away from the home or locked, and to lock up or dispose of extra medicines).
- **Never** put yourself in danger or try to take a weapon from someone.
- Involve your supervisor, the clinical team or emergency services.

### Escalation — who to call
| Situation | Action |
|---|---|
| Thoughts of suicide, no immediate danger | Stay with them, connect to **988** (call or text together), notify the clinician and supervisor per policy |
| Need for in-person crisis assessment | Mobile crisis team (often through 988 or the local crisis line) or the person's clinician |
| Attempt in progress, has taken something, has a weapon, or you cannot keep them safe | **Call 911** immediately; give first aid within your training |`),
        text("Florida's Baker Act and the limits of your role", 12, `The Florida Mental Health Act (the **Baker Act**) allows an **involuntary examination** when there is reason to believe a person has a mental illness and, because of it, meets legal criteria — for example, there is a substantial likelihood that without care the person will cause serious bodily harm to self or others in the near future, as shown by recent behavior, or will suffer from neglect that poses a real and present threat of substantial harm, and they refuse or cannot decide on a voluntary examination.

An involuntary examination may be initiated only by:
- a **court** (ex parte order),
- a **law enforcement officer**, or
- certain **licensed professionals** who have examined the person and certify that the criteria are met.

**Your role** as non-licensed staff is to recognize risk, keep the person and others safe, call 911 or your crisis team, give accurate information, and document. You do not diagnose, decide whether the criteria are met, or transport a person for involuntary examination yourself.

The Marchman Act provides a separate process for substance use emergencies.

Educational training does **not** authorize unlicensed personnel to diagnose, treat or independently manage psychiatric emergencies.`),
        check("Check your understanding: safety and escalation", [
          kc("sp5", "A person has just told you she swallowed a bottle of pills. What do you do?", ["Wait to see if she feels sick", "Call 911 immediately and stay with her", "Call 988 tomorrow", "Give her coffee"], 1, "An attempt in progress is a medical emergency."),
          kc("sp6", "Under Florida's Baker Act, who can initiate an involuntary examination?", ["Any staff member", "A court, a law enforcement officer, or certain licensed professionals", "The person's roommate", "The building manager"], 1, "Non-licensed staff call 911 or the crisis team."),
        ]),
      ],
    },
    {
      title: "4. Documentation, follow-up and boundaries",
      summary: "Accurate records, continuing support and professional limits.",
      lessons: [
        text("Documentation and follow-up", 12, `### Document promptly and objectively
- Date and time
- What you observed and what the person said (their words in quotation marks)
- The questions you asked and their answers
- Safety steps you took (stayed with them, means secured, who removed what)
- Who you notified, when, and what they advised (supervisor, clinician, 988, 911)
- Outcome (for example, transported by EMS to a named hospital; mobile crisis arrived)
Follow your organization's forms and confidentiality rules.

### Follow-up and support
The period after a crisis, including after discharge from an emergency department or hospital, can be a time of higher risk.
- Follow the person's plan from the clinical team; help with appointments and transportation.
- **Caring contacts** — brief, supportive check-ins — help people feel connected.
- Encourage the person to keep 988 and their supports' numbers handy.
- Watch for returning warning signs and report them.
- Support families and coworkers, who may also be affected.

### After a suicide death
Use safe messaging: avoid details about method, avoid presenting suicide as a solution, and share help resources. Organizations should offer support (postvention) to staff, residents and families.`),
        text("Professional boundaries and caring for yourself", 10, `### Boundaries
- Stay within your role and training; involve qualified professionals.
- Do not promise secrecy, give personal phone numbers, or become a person's only source of support.
- Do not provide counseling or therapy unless you are licensed and it is your job.
- Keep your relationship professional even when you care deeply.

### Caring for yourself
Responding to suicide risk is emotionally demanding. Talk with your supervisor, use debriefing and your employee assistance program, and reach out to **988** yourself if you are struggling. Your wellbeing matters too.`),
        caseStudy("Case study: Mr. Torres at the adult day program", 15, `**Situation (fictional).** Mr. Torres, 72, has attended your adult day program for a year. His wife died three months ago, he has chronic back pain, and his son recently moved away. Today he gives you his watch and says, "Keep it. I won't be needing it. I've got my old revolver at home and I'm tired of hurting."

**Walk through your response:**
1. **Ask directly:** "Mr. Torres, are you thinking about killing yourself?" He says yes, tonight.
2. **Stay with him**; get a coworker to notify the supervisor and the program nurse.
3. **Immediate danger** (a plan, a firearm, a timeframe): **call 911**, explain it is a suicide risk with access to a firearm at home. Do not let him leave alone.
4. **Listen and support** while you wait: "I'm glad you told me. You don't have to go through this alone."
5. **Lethal means:** do not go to his home yourself; tell responders and the clinical team about the revolver so a safe plan can be made with his family.
6. **Document** objectively, including his exact words and every step taken and who was notified.
7. **Follow up** with the team about discharge plans, caring contacts and support for staff.

**Discussion:** Which risk factors and warning signs were present? Which parts of the response are outside your role?`),
      ],
    },
    {
      title: "5. Course review and resources",
      summary: "Key actions and where to get help.",
      lessons: [
        text("Key actions and resources", 8, `### Remember
1. **Recognize** warning signs, especially new or increasing ones.
2. **Ask** directly about suicide.
3. **Listen** without judgment; never promise secrecy.
4. **Keep safe:** do not leave someone at immediate risk alone; reduce access to lethal means if safe and permitted.
5. **Connect:** 988, mobile crisis, the clinician, or **911** for immediate danger.
6. **Document** and **follow up**.
7. **Care** for yourself.

### Resources
- **988 Suicide & Crisis Lifeline** — call or text 988, chat at 988lifeline.org (Veterans: press 1)
- **Crisis Text Line** — text HELLO to 741741 (as listed by NIMH)
- **911** for immediate danger
- **SAMHSA National Helpline** — 1-800-662-4357
- Your organization's crisis procedure and employee assistance program`),
      ],
    },
  ],
  finalExam: {
    title: "Suicide Prevention and Crisis Intervention Awareness — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      tf("Asking someone directly whether they are thinking about suicide increases their risk.", false, "Asking does not increase risk and can open the door to help."),
      ms("Which are risk factors for suicide? (Select all that apply.)", ["Previous suicide attempt", "Access to firearms", "Depression or substance use disorder", "Strong social connections"], [0, 1, 2], "Connection is protective."),
      mc("Which is a protective factor?", ["Hopelessness", "Easy access to effective health care", "Recent job loss", "Isolation"], 1, "Access to care protects."),
      ms("Which are warning signs that need immediate attention? (Select all that apply.)", ["Talking about wanting to die", "Making a plan or researching ways to die", "Giving away important possessions", "Planning a family reunion"], [0, 1, 2], "Planning future events is not a warning sign."),
      mc("The best way to ask about suicide is:", ["\"You're not thinking of doing something stupid, are you?\"", "\"Are you thinking about suicide?\"", "Hinting indirectly", "Asking a family member instead"], 1, "Ask clearly and directly."),
      mc("If someone discloses suicidal thoughts, you should NOT:", ["Listen calmly", "Promise to keep it a secret", "Ask about a plan and means", "Stay with them if there is immediate danger"], 1, "Never promise secrecy when safety is at risk."),
      mc("Why does reducing access to lethal means save lives?", ["It makes people stop feeling sad", "Suicidal crises are often brief, and time and distance from means prevents deaths", "It is a legal requirement", "It does not save lives"], 1, "Means safety is a proven strategy."),
      mc("A person has a firearm and says he will use it tonight. You should:", ["Try to take the gun", "Keep yourself safe, do not leave him alone if safe to stay, and call 911", "Wait until tomorrow", "Go to his home to find the gun"], 1, "Never try to take a weapon; call 911."),
      mc("For thoughts of suicide without immediate danger, connect the person to:", ["988 Suicide & Crisis Lifeline and their clinician", "No one", "Social media", "Only their employer"], 0, "988 is available by call, text or chat."),
      mc("Under Florida's Baker Act, an involuntary examination may be initiated by:", ["A court, a law enforcement officer, or certain licensed professionals", "Any staff member", "Family by text message", "The person's landlord"], 0, "Non-licensed staff call 911 or the crisis team."),
      tf("This course authorizes unlicensed staff to independently manage psychiatric emergencies.", false, "Educational training does not authorize that."),
      mc("Good documentation of a suicide-risk event includes:", ["Your opinions about the person's character", "The person's own words, the actions taken, who was notified and when, and the outcome", "Only the date", "Nothing — it is confidential"], 1, "Objective and complete."),
      mc("Caring contacts after a crisis are:", ["Brief, supportive check-ins that help people feel connected", "Debt collection calls", "Not useful", "Only for families"], 0, "Connection reduces risk after a crisis."),
      mc("Safe messaging after a suicide death includes:", ["Sharing details of the method", "Avoiding method details and sharing help resources", "Presenting suicide as a solution", "Blaming the person"], 1, "Safe messaging reduces contagion risk."),
      sc("Your coworker seems overwhelmed after a client's suicide attempt. What is the best response?", ["Tell her to toughen up", "Listen, encourage debriefing with the supervisor and the employee assistance program, and share 988", "Avoid her", "Talk about the event on social media"], 1, "Support staff wellbeing."),
    ],
  },
};
