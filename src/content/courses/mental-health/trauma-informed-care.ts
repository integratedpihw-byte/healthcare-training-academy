import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, SAMHSA_RECOVERY, SAMHSA_TIC, SCOPE_NOTICE } from "./_shared";

export const traumaInformedCare: CourseContent = {
  code: "CHITA-MH-005",
  title: "Trauma-Informed Care Certificate (Intermediate)",
  categorySlug: "mental-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 155,
  clinicalReviewRequired: true,
  programClassification: "GENERAL_EDUCATION",
  certificateType: "SPECIALIZED_TRAINING",
  credentialNotice: `${SCOPE_NOTICE} Trauma-informed care is an approach for everyone; trauma-specific treatment is provided by qualified clinicians.`,
  instructorResources: "Begin each session by naming that the topic can bring up personal memories, offering breaks, and sharing support resources (EAP, 988). Do not ask learners to share their own trauma histories.",
  description:
    "How trauma affects people and how to provide care that promotes safety and avoids re-traumatization: understanding trauma, adverse childhood experiences (ACEs), psychological trauma and common trauma responses, SAMHSA's trauma-informed approach and six key principles, trauma-informed communication, creating safe environments, cultural, historical and gender considerations, and recovery-oriented approaches — including care for yourself.",
  targetAudience: "All health care, home care, behavioral health, residential, social service and community staff.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Define trauma and describe adverse childhood experiences and their effects.",
    "Recognize common trauma responses in people of all ages.",
    "Describe SAMHSA's four assumptions and six key principles of a trauma-informed approach.",
    "Communicate in trauma-informed ways and avoid re-traumatization.",
    "Create physically and emotionally safe environments with attention to culture, history and gender.",
    "Apply recovery-oriented practices and recognize secondary traumatic stress in yourself.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    SAMHSA_TIC,
    SAMHSA_RECOVERY,
    { title: "About Adverse Childhood Experiences", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/aces/about/index.html", accessedOn: ACCESSED },
    { title: "Prevalence of Adverse Childhood Experiences Among U.S. Adults — BRFSS, 2011–2020 (MMWR 72(26))", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/mmwr/volumes/72/wr/mm7226a2.htm", publishedOn: "2023-06-30", accessedOn: ACCESSED },
    { title: "Secondary Traumatic Stress", publisher: "National Child Traumatic Stress Network", url: "https://www.nctsn.org/trauma-informed-care/secondary-traumatic-stress/nctsn-resources", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Understanding trauma",
      summary: "What trauma is, and the three E's.",
      lessons: [
        text("What is trauma?", 14, `SAMHSA describes individual trauma as resulting from an **event**, series of events or set of circumstances that is **experienced** by an individual as physically or emotionally harmful or life-threatening and that has lasting adverse **effects** on the person's functioning and wellbeing — the "three E's."

### Types of trauma
- **Acute** — a single event (assault, accident, disaster, sudden loss)
- **Chronic** — repeated, ongoing (abuse, domestic violence, community violence, war)
- **Complex** — multiple, often interpersonal traumas beginning in childhood
- **Historical and intergenerational** — trauma experienced by a group (for example through slavery, genocide, forced removal, racism) whose effects pass across generations
- **Medical trauma** — frightening or painful medical experiences, including restraint or invasive procedures
- **Systems trauma** — harm caused by the systems meant to help (for example repeated removals, coercive treatment)

The same event can affect people very differently. What matters is how the person **experienced** it and its **effects**.`),
        check("Check your understanding: trauma", [
          kc("tic1", "SAMHSA's three E's of trauma are:", ["Event, experience, effects", "Emergency, evaluation, exit", "Education, empathy, empowerment", "Exposure, escape, evidence"], 0, "Event, experience and effects."),
        ]),
      ],
    },
    {
      title: "2. Adverse childhood experiences and trauma responses",
      summary: "ACEs, the body's stress response and what you may see.",
      lessons: [
        text("Adverse childhood experiences (ACEs)", 12, `**ACEs** are potentially traumatic events in childhood (0–17 years), such as experiencing violence, abuse or neglect; witnessing violence; and aspects of the environment such as living with a parent or caregiver who has a substance use problem, mental health problem, or who is incarcerated, or instability from parental separation.

**ACEs are common.** CDC reports that about 64% of U.S. adults experienced at least one type of ACE before age 18, and about one in six (17.3%) experienced four or more.

**Effects can last.** ACEs are linked to chronic health problems, mental illness and substance use in adulthood. Toxic stress can affect brain development and the immune and stress response systems.

**ACEs are not destiny.** Safe, stable, nurturing relationships, positive childhood experiences and community supports build resilience and can buffer the effects.`),
        text("Common trauma responses", 14, `Trauma responses are **normal reactions to abnormal events**. The brain's survival system may react to reminders (triggers) as if the danger is happening now.

| Area | Responses you might see |
|---|---|
| Body | Startle easily, trouble sleeping, headaches, stomach problems, fatigue |
| Emotions | Fear, anxiety, anger, shame, guilt, numbness, sudden mood changes |
| Thinking | Trouble concentrating, memory gaps, intrusive memories, negative beliefs ("I'm not safe," "It's my fault") |
| Behavior | Avoiding reminders, withdrawal, hypervigilance, substance use, self-harm, difficulty trusting, aggressive or "non-compliant" behavior |
| Survival responses | **Fight**, **flight**, **freeze** or **fawn** (people-pleasing to stay safe) |

**Shift the question** from "What's wrong with you?" to "**What happened to you?**" — and, as important, "**What's strong in you?**" Behaviors that look challenging may be survival strategies that once kept the person safe.`),
        check("Check your understanding: ACEs and responses", [
          kc("tic2", "About what share of U.S. adults report at least one ACE, according to CDC?", ["About 10%", "About 64%", "About 99%", "About 25%"], 1, "Roughly two-thirds."),
          kc("tic3", "A resident freezes and stops responding when a staff member raises their voice. This may be:", ["Defiance", "A trauma survival response", "A sign they understood", "Laziness"], 1, "Freeze is a common survival response."),
        ]),
      ],
    },
    {
      title: "3. The trauma-informed approach",
      summary: "SAMHSA's four R's and six key principles.",
      lessons: [
        text("SAMHSA's four R's and six principles", 15, `### The four R's (assumptions)
A program, organization or system that is trauma-informed:
1. **Realizes** the widespread impact of trauma and understands paths to recovery
2. **Recognizes** the signs and symptoms of trauma in clients, families, staff and others
3. **Responds** by fully integrating knowledge about trauma into policies, procedures and practices
4. Seeks to actively **resist re-traumatization**

### Six key principles
1. **Safety** — physical and psychological safety for the people served and staff, as defined by those served.
2. **Trustworthiness and transparency** — decisions are made openly; you do what you say you will do.
3. **Peer support** — people with lived experience help build safety, hope and trust.
4. **Collaboration and mutuality** — power is shared; everyone has a role.
5. **Empowerment, voice and choice** — strengths are recognized; people have choices and a voice in decisions.
6. **Cultural, historical and gender issues** — the organization moves past stereotypes and biases, offers culturally responsive and gender-responsive services, and recognizes historical trauma.

Trauma-informed care is **not** asking people to tell their trauma stories. It is a way of delivering every service.`),
        check("Check your understanding: principles", [
          kc("tic4", "Which is one of the four R's of a trauma-informed approach?", ["Restrain", "Resist re-traumatization", "Report everything", "Repeat the story"], 1, "Realize, recognize, respond, resist re-traumatization."),
          kc("tic5", "Trauma-informed care requires clients to tell staff about their traumatic experiences.", ["True", "False"], 1, "It does not; it changes how all care is delivered."),
        ]),
      ],
    },
    {
      title: "4. Trauma-informed communication and safe environments",
      summary: "What to say, what to avoid, and how spaces feel.",
      lessons: [
        text("Trauma-informed communication", 14, `- **Introduce yourself** and explain your role and what will happen: "I'm here to help you shower. First I'll get the water ready."
- **Ask permission** before touching, entering personal space, or asking personal questions. Accept "no."
- **Offer choices:** "Would you like to sit here or by the window?" "Do you want me to stay or step out?"
- **Use a calm, steady tone;** avoid commands, sarcasm, threats and power struggles.
- **Be predictable** — tell people in advance about changes; follow through on promises.
- **Listen and validate** feelings: "That sounds really frightening."
- **Avoid unnecessary questions** about trauma; ask only what you need for care and let the person decide what to share.
- **Notice triggers** (raised voices, closed doors, certain smells, being touched from behind, uniforms) and adjust.
- **If someone becomes distressed:** slow down, give space, offer grounding (feet on the floor, naming things in the room), and get support.`),
        text("Creating safe environments and cultural sensitivity", 12, `### Physical environment
Welcoming, calm, clean spaces; good lighting; clear signs; privacy for personal care; seating that does not block exits; reduced noise; respectful posting of rules.

### Policies and practices
Minimize coercion; avoid seclusion and restraint except where law and policy allow as a last resort; explain rules and why they exist; involve people in planning their care; respond to grievances fairly.

### Avoiding re-traumatization
Re-traumatization happens when people experience something that echoes their trauma — loss of control, being held down, being disbelieved, invasive questions, lack of privacy, unpredictable changes, or being treated with disrespect. Review routines (bathing, searches, medication times, room checks) through a trauma lens.

### Cultural, historical and gender considerations
- Ask about and respect cultural, religious and gender preferences (for example the gender of the caregiver for personal care).
- Recognize historical trauma and present-day discrimination, and how they affect trust in health systems.
- Use interpreters; avoid assumptions; reflect on your own biases.
- Use people's chosen names and pronouns.`),
        check("Check your understanding: communication and environment", [
          kc("tic6", "Which is a trauma-informed practice during personal care?", ["Starting without explanation to save time", "Explaining each step, asking permission and offering choices", "Leaving the door open", "Touching from behind without warning"], 1, "Predictability and choice support safety."),
          kc("tic7", "Which can re-traumatize someone?", ["Offering choices", "Being held down or having privacy removed without explanation", "Speaking calmly", "Following through on promises"], 1, "Loss of control and privacy can echo past trauma."),
        ]),
      ],
    },
    {
      title: "5. Recovery-oriented approaches and caring for yourself",
      summary: "Strengths, hope, and secondary traumatic stress.",
      lessons: [
        text("Recovery-oriented, strengths-based care", 10, `Healing from trauma is possible. Recovery-oriented care:
- Believes in and communicates **hope**.
- Focuses on **strengths** and coping skills, not only problems.
- Supports **choice and self-direction**.
- Connects people with **peer support**, family, culture, faith and community.
- Supports access to **trauma-specific treatment** from qualified clinicians when the person wants it (for example trauma-focused cognitive behavioral therapy or other evidence-based therapies).

SAMHSA's guiding principles of recovery include that recovery is supported by addressing trauma.`),
        text("Secondary traumatic stress and self-care", 10, `Hearing about or witnessing others' trauma can affect helpers. **Secondary traumatic stress** can look like PTSD symptoms — intrusive thoughts, avoidance, feeling on edge, numbness. **Burnout** includes exhaustion and feeling ineffective.

**Protect yourself and your team:**
- Notice your own reactions without judgment.
- Use supervision and debriefing after hard events.
- Set boundaries between work and home; take breaks and time off.
- Keep up sleep, movement and connection.
- Use your employee assistance program; call or text **988** if you are in crisis.
- Trauma-informed organizations apply the same principles to staff: safety, transparency, peer support, collaboration, voice and choice.`),
        caseStudy("Case study: Ms. Grant refuses her shower", 14, `**Situation (fictional).** Ms. Grant, 58, recently moved into an assisted living facility. Staff describe her as "combative" during evening showers: she screams, pushes staff away and has scratched an aide. Her records mention a history of domestic violence. The evening shift is short-staffed, and the shower room has a loud fan and an open curtain to the hallway.

**Discuss using the six principles:**
1. *Safety:* What in the environment could feel unsafe? *(Loud fan, open curtain, evening rush, being approached from behind, male staff?)*
2. *Trustworthiness and transparency:* How would you explain the process? *(Introduce yourself, explain each step before doing it.)*
3. *Voice and choice:* What choices could she have? *(Time of day, shower or bath, who helps, washing herself, keeping a towel around her.)*
4. *Cultural, historical and gender issues:* *(Ask about her preference for a female caregiver.)*
5. *Collaboration:* How could you involve her and the team in a new plan? *(Meet with her, document what works, review the plan.)*

**Reframe:** instead of "Ms. Grant is combative," write "Ms. Grant shows distress during evening showers when approached by staff she does not know; she was calmer when offered a morning bath with a towel kept around her shoulders."`),
      ],
    },
  ],
  finalExam: {
    title: "Trauma-Informed Care — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("SAMHSA's definition of individual trauma includes:", ["Only physical injuries", "An event, how it is experienced, and its lasting effects", "Only childhood events", "Only military combat"], 1, "The three E's."),
      mc("Historical trauma refers to:", ["A history class", "Trauma experienced by a group whose effects can pass across generations", "Old medical records", "A single car accident"], 1, "For example, slavery, genocide or forced removal."),
      mc("ACEs are potentially traumatic events occurring between ages:", ["0–17", "18–25", "65 and older", "Any age"], 0, "ACEs occur in childhood."),
      tf("ACEs determine a person's future and cannot be buffered.", false, "Safe, stable, nurturing relationships build resilience."),
      ms("Which are common trauma survival responses? (Select all that apply.)", ["Fight", "Flight", "Freeze", "Fawn"], [0, 1, 2, 3], "All four are described."),
      mc("The trauma-informed reframe of \"What's wrong with you?\" is:", ["\"Why are you difficult?\"", "\"What happened to you?\"", "\"Who is to blame?\"", "\"When will you comply?\""], 1, "This shift changes how we respond."),
      mc("Which is NOT one of SAMHSA's six key principles?", ["Safety", "Peer support", "Punishment for non-compliance", "Empowerment, voice and choice"], 2, "Coercion and punishment are not principles."),
      mc("The four R's of a trauma-informed approach are realize, recognize, respond and:", ["Restrain", "Resist re-traumatization", "Repeat", "Report"], 1, "Resist re-traumatization."),
      mc("Trustworthiness and transparency means:", ["Keeping decisions secret", "Making decisions openly and doing what you say you will do", "Avoiding explanations", "Changing plans without notice"], 1, "Predictability builds trust."),
      mc("Which is trauma-informed communication?", ["\"Do it now.\"", "\"Would you like to start with your hair or your face?\"", "\"You have no choice.\"", "\"Stop being difficult.\""], 1, "Offering choices."),
      mc("Which practice can re-traumatize?", ["Explaining rules and why they exist", "Unexplained searches or being held down", "Offering privacy", "Asking permission"], 1, "Loss of control and dignity echoes trauma."),
      mc("Cultural, historical and gender considerations include:", ["Assuming everyone has the same needs", "Asking about preferences such as the caregiver's gender for personal care", "Ignoring language needs", "Using nicknames without asking"], 1, "Respond to individual and cultural needs."),
      mc("Recovery-oriented care focuses on:", ["Deficits only", "Hope, strengths, choice and connection", "Keeping people dependent", "Avoiding peer support"], 1, "Strengths and hope support healing."),
      mc("Secondary traumatic stress is:", ["Stress from paperwork", "Trauma-like symptoms in helpers from exposure to others' trauma", "A diagnosis for clients only", "Not real"], 1, "Helpers need support too."),
      sc("A client with a trauma history panics when a staff member closes the door during care. What should you do?", ["Keep the door closed and hurry", "Stop, reassure her, ask what would help her feel safer (such as leaving the door ajar with privacy screening), and adjust the plan", "Tell her she is overreacting", "Leave and finish tomorrow"], 1, "Respond to triggers with safety and choice."),
    ],
  },
};
