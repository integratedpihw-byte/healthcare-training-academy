import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text } from "../../build";
import { ACCESSED } from "./_shared";

export const motivationalInterviewingTransitions: CourseContent = {
  code: "CHITA-CM-003",
  title: "Motivational Interviewing and Safe Care Transitions for Case Managers",
  categorySlug: "case-management",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 80,
  clinicalReviewRequired: false,
  description:
    "Two practical skill sets for case managers, community health workers and care coordinators: motivational interviewing (MI) — its spirit, the OARS skills, the four tasks, recognizing change talk and responding to discord — and supporting safe transitions from hospital to home using the four pillars of the Care Transitions Intervention, medication reconciliation support, red flags and teach-back.",
  targetAudience: "Case managers, care coordinators, community health workers, peer specialists, nurses and social workers who help clients make health changes or move between care settings.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Describe the spirit of motivational interviewing and the four MI tasks.",
    "Use open questions, affirmations, reflections and summaries (OARS).",
    "Recognize and respond to change talk, sustain talk and discord.",
    "Apply the four pillars of the Care Transitions Intervention to a hospital-to-home transition.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    { title: "Motivational Interviewing: Helping People Change and Grow, 4th Edition (Miller & Rollnick, 2023)", publisher: "Guilford Press", url: "https://www.guilford.com/books/Motivational-Interviewing/Miller-Rollnick/9781462552795", accessedOn: ACCESSED },
    { title: "The Care Transitions Intervention — Evidence and Adoptions", publisher: "The Care Transitions Program (Coleman et al.)", url: "https://caretransitions.org/files/documents/evidence_and_adoptions_2.pdf", accessedOn: ACCESSED },
    { title: "Preparing Patients and Caregivers to Participate in Care Delivered Across Settings: The Care Transitions Intervention (J Am Geriatr Soc, 2004)", publisher: "Coleman EA, et al.", url: "https://caretransitions.org/files/documents/preparing%20patients%20-%20jags.pdf", accessedOn: ACCESSED },
    { title: "Health Literacy Universal Precautions Toolkit — Improving Spoken Communication", publisher: "Agency for Healthcare Research and Quality", url: "https://www.ahrq.gov/health-literacy/improve/precautions/guide/spoken.html", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. The spirit and skills of motivational interviewing",
      summary: "Partnership, acceptance, compassion and empowerment; OARS.",
      lessons: [
        text("What MI is", 12, `**Motivational interviewing (MI)**, developed by William R. Miller and Stephen Rollnick, is a collaborative, person-centered way of talking with people about change. It strengthens a person's **own** motivation and commitment, rather than trying to convince them.

Many of us have a "**righting reflex**" — the urge to fix problems and tell people what to do. When we argue for change, people often argue back for staying the same. MI works the other way: it helps the person voice their **own** reasons for change.

### The spirit of MI
MI is more than techniques; it is a way of being with people. The spirit includes:
- **Partnership** — working *with* the person, not doing things *to* them. They are the expert on their own life.
- **Acceptance** — respecting the person's worth, autonomy and right to choose; seeking to understand their perspective; affirming strengths.
- **Compassion** — actively promoting the person's welfare and putting their needs first.
- **Empowerment** — helping people recognize and use their own strengths and abilities. (The 4th edition of *Motivational Interviewing*, published in 2023, describes this element; earlier editions called a similar element **evocation** — drawing out the person's own ideas.)

### Ambivalence is normal
Most people feel two ways about change ("I want to quit smoking, but it helps me with stress"). That **ambivalence** is not resistance — it is a normal step on the way to change. MI helps people explore and resolve it.`),
        text("OARS: core communication skills", 12, `**O — Open questions** invite the person to tell their story.
- Closed: "Are you taking your medicine?"
- Open: "How has it been going with your medicine?"

**A — Affirmations** recognize strengths, efforts and values. They must be **genuine** and specific.
- "You kept your appointment even though the bus was late — that took real determination."

**R — Reflections** are statements that show you understand what the person said or meant. They are the heart of MI.
- **Simple reflection** repeats or rephrases: "You're tired of all the pills."
- **Complex reflection** adds meaning or feeling: "You're tired of the pills, and you're also worried about what happens if you stop."
- Aim for **more reflections than questions** — at least two reflections for each question is a common goal.

**S — Summaries** pull together what the person has said, especially their reasons for change, and check accuracy.
- "Let me see if I've got it. You're worried about your blood sugar because of your kids, you've already cut down on soda, and the hardest part is lunch at work. Did I miss anything?"

### Also: ask permission and offer information carefully
Before giving advice, **ask permission**: "Would it be OK if I shared some information other people have found helpful?" A common approach is **Elicit–Provide–Elicit**: ask what they know, provide information briefly, then ask what they think about it.`),
        check("Check your understanding: spirit and OARS", [
          kc("mi1", "Which is an open question?", ["\"Did you take your medicine today?\"", "\"What would help you remember your medicine?\"", "\"Are you smoking?\"", "\"Is that right?\""], 1, "Open questions cannot be answered with yes or no."),
          kc("mi2", "\"You're worried about your health, and you also don't want to give up something that helps you relax.\" This is a:", ["Closed question", "Complex reflection", "Affirmation", "Summary of the visit"], 1, "It reflects both sides of ambivalence."),
          kc("mi3", "The \"righting reflex\" refers to:", ["The urge to correct and fix people's problems", "A reflex tested by doctors", "Reflecting what someone says", "Asking permission"], 0, "MI asks us to resist the righting reflex."),
        ]),
      ],
    },
    {
      title: "2. The four tasks of MI",
      summary: "Engaging, focusing, evoking, planning.",
      lessons: [
        text("The four tasks of MI", 10, `The current edition of *Motivational Interviewing* describes four overlapping **tasks** (earlier called "processes"):
1. **Engaging** — building a trusting, respectful working relationship. Without engagement, nothing else works.
2. **Focusing** — finding a shared direction: what change, if any, the conversation is about. The client's priorities lead.
3. **Evoking** — drawing out the person's **own** motivation for change: their reasons, desires, abilities and needs.
4. **Planning** — when the person is ready, developing a specific plan and commitment. Not everyone gets to planning in one conversation, and that's OK.

These are not strict steps; you may return to engaging at any time.`),
      ],
    },
    {
      title: "3. Change talk, sustain talk and discord",
      summary: "Recognizing and strengthening motivation.",
      lessons: [
        text("Change talk, sustain talk and discord", 12, `### Change talk and sustain talk
**Change talk** is anything the person says in favor of change. **Sustain talk** is anything in favor of staying the same. Both are normal. In MI, you **evoke and strengthen change talk** and respond to sustain talk without arguing.

A helpful way to recognize change talk is **DARN-CAT**:
- **Desire** — "I want to…"
- **Ability** — "I could…"
- **Reasons** — "It would help me…"
- **Need** — "I have to…"
- **Commitment** — "I will…"
- **Activation** — "I'm ready to…"
- **Taking steps** — "I bought a pill box this week."

Respond to change talk by **reflecting** it, **asking for elaboration** ("Tell me more about that") and **affirming** it.

### Importance and confidence rulers
- "On a scale of 0 to 10, how **important** is it to you to start taking your medicine every day?"
- Then: "Why a 6 and not a 3?" — This invites the person to explain their **reasons for change**, rather than defend why it's not higher.
- Similarly: "How **confident** are you that you could do it?" and "What would it take to move from a 5 to a 6?"

### Discord
**Discord** is tension in the relationship (arguing, interrupting, ignoring, defensiveness). It is a signal to change *your* approach.
- Reflect: "It sounds like you feel I'm pushing you."
- Emphasize autonomy: "It's completely your decision."
- Apologize if needed: "I'm sorry — I got ahead of you."
- Shift focus to what matters to them.`),
        check("Check your understanding: change talk", [
          kc("mi4", "\"I really should start checking my blood sugar because I want to see my grandkids grow up.\" This statement is mainly:", ["Sustain talk", "Change talk (reasons and need)", "Discord", "A closed question"], 1, "It expresses reasons and need for change."),
          kc("mi5", "A client rates importance as 4 out of 10. Which follow-up is most consistent with MI?", ["\"Why not a 10?\"", "\"Why a 4 and not a 1?\"", "\"That's too low.\"", "\"You should be at 10.\""], 1, "Asking why not lower evokes reasons for change."),
          kc("mi6", "Discord in a conversation is best seen as:", ["Proof that the client is resistant", "A signal for the practitioner to change approach", "A reason to close the case", "Something to argue against"], 1, "Discord tells you to shift."),
        ]),
      ],
    },
    {
      title: "4. Safe care transitions",
      summary: "The four pillars and hospital-to-home support.",
      lessons: [
        text("Why transitions are risky", 12, `A **care transition** is a move between settings or levels of care — for example, from hospital to home, hospital to skilled nursing facility, or nursing facility to home. Transitions are risky: information gets lost, medications change, follow-up appointments are missed, and patients and caregivers may not know which warning signs mean they need help. Poor transitions contribute to avoidable readmissions.

### The Care Transitions Intervention (CTI)
Developed by **Eric Coleman, MD, MPH**, and colleagues, the **Care Transitions Intervention** is a 30-day program in which a **Transitions Coach** helps patients and caregivers take a more active role in their care. In a randomized trial published in 2004, the intervention reduced rehospitalizations. The coach **coaches** rather than doing tasks for the patient, building skills the person can use in future transitions.

The intervention focuses on **four pillars**:
1. **Medication self-management** — the patient understands their medicines and has a system for managing them; medication discrepancies are identified and resolved with the care team.
2. **A patient-centered record (Personal Health Record)** — the patient keeps and uses a simple record of their conditions, medications, allergies and questions, and brings it to every visit.
3. **Timely primary care and specialty follow-up** — the patient schedules and attends follow-up visits and is prepared to take part in them.
4. **Knowledge of red flags** — the patient knows the warning signs that their condition is getting worse and **how to respond** (whom to call, and when to call 911).

### The case manager's role in a transition
- **Before discharge (if possible):** connect with the patient and hospital team; learn the discharge plan.
- **Within a few days after discharge:** contact or visit the patient.
- **Medications:** help the patient gather **all** medicines (including old bottles, over-the-counter drugs and supplements) and compare them with the discharge list. Report any discrepancies to the prescriber or pharmacist — **case managers who are not clinicians do not change medicines** but help identify and communicate problems.
- **Follow-up appointment:** confirm the date, transportation and what to bring. Many programs aim for a visit within 7 to 14 days after discharge, depending on risk.
- **Red flags:** review the discharge instructions' warning signs in plain language and use **teach-back**: "Tell me what you would do if your weight goes up 3 pounds in a day."
- **Services and equipment:** confirm home health, durable medical equipment, oxygen and pharmacy deliveries arrived.
- **Social needs:** check food, utilities, caregiver support and safety at home.`),
        check("Check your understanding: transitions", [
          kc("mi7", "Which is one of the four pillars of the Care Transitions Intervention?", ["Billing reconciliation", "Knowledge of red flags", "Hospital marketing", "Annual physicals only"], 1, "The pillars are medication self-management, a personal health record, follow-up and red flags."),
          kc("mi8", "During a home visit, a non-clinical case manager finds the client is taking an old blood pressure pill that was stopped at discharge. What should they do?", ["Tell the client to take double doses", "Help the client contact the prescriber or pharmacist to report the discrepancy", "Throw away all medicines", "Ignore it"], 1, "Identify and communicate discrepancies to clinicians."),
        ]),
      ],
    },
    {
      title: "5. Putting it together",
      summary: "MI and transitions in practice.",
      lessons: [
        caseStudy("Case study: Mr. Daniels goes home", 15, `**Situation (fictional).** Mr. Daniels, 68, is discharged after a hospital stay for heart failure. It is his second admission this year. He lives alone, and his daughter visits on weekends. He says, "The doctors always tell me the same stuff. I'm fine."

**Day 2 — home visit by the case manager (Transitions Coach model):**

**Engaging:**
- *Case manager:* "Thanks for letting me come by. What has the first day home been like?" (open question)
- *Mr. Daniels:* "Tiring. Too many pills. And they keep telling me to weigh myself."
- *Case manager:* "You're worn out, and all the instructions feel like a lot." (reflection)

**Focusing:**
- *Case manager:* "We could talk about the pills, the follow-up visit, or what to watch for. What feels most important to you?" He chooses the pills.

**Medication self-management:** Together they gather every bottle. He has an old water pill bottle at a different dose than the discharge list. The case manager helps him call the clinic nurse, who clarifies the correct dose. They set up a weekly pill organizer, which his daughter will help refill.

**Evoking:**
- *Case manager:* "On a scale of 0 to 10, how important is it to you to stay out of the hospital?" — "Nine."
- "Why a 9 and not a 5?" — "I want to go to my granddaughter's graduation in June." (change talk — reasons)
- *Case manager:* "Being at that graduation really matters to you." (reflection)

**Red flags:** Using his discharge instructions, they review warning signs (for example, rapid weight gain, more swelling, more shortness of breath) and whom to call. Mr. Daniels explains them back (**teach-back**) and adds the clinic number to his phone. He agrees to weigh himself each morning — "Just so I can make June."

**Personal health record and follow-up:** He writes his medicines, weights and questions in a simple notebook and confirms his follow-up appointment for day 7, with a ride arranged.

**Planning (summary):** "So your plan is to use the pill box, weigh yourself every morning and write it down, call the clinic if your weight jumps or breathing gets worse, and bring your notebook to your follow-up appointment on day 7. Does that sound right?"

**Discussion:**
- Identify examples of each OARS skill.
- Which four pillars did the visit address?
- How did the case manager avoid the righting reflex when Mr. Daniels said, "I'm fine"?`),
      ],
    },
  ],
  finalExam: {
    title: "Motivational Interviewing and Care Transitions — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("Motivational interviewing is best described as:", ["A way to persuade clients by presenting facts forcefully", "A collaborative, person-centered conversation style that strengthens a person's own motivation for change", "A diagnostic test", "A confrontational counseling technique"], 1, "MI strengthens the person's own motivation."),
      ms("Which are elements of the spirit of MI? (Select all that apply.)", ["Partnership", "Acceptance", "Compassion", "Empowerment", "Confrontation"], [0, 1, 2, 3], "Confrontation is not part of MI spirit."),
      mc("Ambivalence about change is:", ["A sign the client will never change", "A normal part of the change process", "Something to ignore", "A diagnosis"], 1, "Ambivalence is normal."),
      mc("OARS stands for:", ["Observe, Assess, Refer, Support", "Open questions, Affirmations, Reflections, Summaries", "Outreach, Advocacy, Resources, Services", "Order, Arrange, Review, Sign"], 1, "These are the core MI skills."),
      mc("Which is a genuine affirmation?", ["\"Good job.\"", "\"You came to every appointment this month, even while working nights. That shows real commitment.\"", "\"You should be proud, I guess.\"", "\"Finally.\""], 1, "Affirmations are specific and genuine."),
      mc("In MI, a common goal is to offer:", ["More questions than reflections", "More reflections than questions", "Only advice", "Only closed questions"], 1, "Reflections should outnumber questions."),
      mc("What is the correct list of the four MI tasks?", ["Assessing, diagnosing, treating, discharging", "Engaging, focusing, evoking, planning", "Asking, telling, warning, closing", "Listening, explaining, acknowledging, negotiating"], 1, "Engaging, focusing, evoking and planning."),
      mc("\"I bought a pill organizer yesterday\" is an example of which type of change talk?", ["Desire", "Taking steps", "Sustain talk", "Discord"], 1, "Taking steps describes action already taken."),
      mc("Before giving information or advice in MI, you should:", ["Insist", "Ask permission", "Give it without asking", "Avoid giving information at all"], 1, "Asking permission respects autonomy."),
      sc("A client says, \"Stop telling me what to do — you sound like my doctor.\" What is the best MI response?", ["\"I'm only trying to help; you need to listen.\"", "\"It sounds like I've been pushing you. It's your decision — what would be most helpful to talk about?\"", "Repeat the advice more slowly", "End the visit"], 1, "Reflect, emphasize autonomy and shift."),
      mc("Who developed the Care Transitions Intervention?", ["William Miller", "Eric Coleman and colleagues", "Arthur Kleinman", "The FDA"], 1, "Eric Coleman, MD, MPH, and colleagues."),
      ms("Which are the four pillars of the Care Transitions Intervention? (Select all that apply.)", ["Medication self-management", "A patient-centered personal health record", "Timely primary and specialty care follow-up", "Knowledge of red flags", "Insurance billing"], [0, 1, 2, 3], "Billing is not a pillar."),
      mc("In the Care Transitions Intervention, the Transitions Coach mainly:", ["Does all tasks for the patient", "Coaches the patient and caregiver to manage their own care", "Prescribes medicines", "Replaces the primary care provider"], 1, "Coaching builds self-management skills."),
      mc("A non-clinical case manager finds a mismatch between the client's medicines at home and the discharge list. The right action is to:", ["Change the doses", "Help the client report the discrepancy to the prescriber or pharmacist", "Stop all medicines", "Wait until the next annual visit"], 1, "Communicate discrepancies to clinicians."),
      mc("Using teach-back for red flags means:", ["Handing out a pamphlet only", "Asking the client to explain, in their own words, what warning signs to watch for and what to do", "Testing the client's memory with a quiz score", "Reading the discharge papers aloud"], 1, "Teach-back confirms understanding."),
    ],
  },
};
