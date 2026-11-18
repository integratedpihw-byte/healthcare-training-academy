import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, DOEA_ADRD, FS_430_5025 } from "./_shared";

export const dementiaCare: CourseContent = {
  code: "CHITA-HH-003",
  title: "Dementia and Alzheimer's Care Certificate",
  categorySlug: "home-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 165,
  clinicalReviewRequired: true,
  programClassification: "STATE_REGULATED_TRAINING",
  certificateType: "SPECIALIZED_TRAINING",
  credentialNotice:
    "Educational certificate in dementia care. Florida's Alzheimer's Disease and Related Forms of Dementia Education and Training Act (s. 430.5025, F.S.) requires a 1-hour training provided by the Department of Elder Affairs, plus 2 additional hours (home health agencies, nurse registries, companion and homemaker providers) or 3 additional hours (assisted living facilities, nursing homes, adult day care centers, adult family-care homes and others) taught by a trainer and curriculum approved by the Department. This course has not been approved by the Department of Elder Affairs and does not by itself meet those requirements.",
  instructorResources: `If CHITA later obtains Department of Elder Affairs curriculum approval, record it in Platform → Programs & Approvals before describing the course as meeting s. 430.5025. The approval register is the only place the program type can be changed to a state-approved program.

Suggested activity for module 4: role play using the DICE steps with a client who refuses a shower every evening.`,
  competencyCodes: ["COMP-HHA-BATH", "COMP-HHA-FEED"],
  description:
    "An in-depth certificate course for caregivers of people living with dementia: what dementia is, common types and stages, behavioral and psychological symptoms, communication strategies, understanding and responding to distressed behavior, wandering and home safety, supporting family caregivers, and person-centered care.",
  targetAudience: "Home health aides, personal care assistants, CNAs, assisted living and adult day care staff, companions and family caregivers.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Explain what dementia is and how it differs from normal aging and delirium.",
    "Describe common types of dementia and how needs change across stages.",
    "Use communication strategies that reduce distress.",
    "Identify causes of distressed behavior and respond using a structured approach.",
    "Reduce the risk of wandering and other safety hazards at home.",
    "Support family caregivers and provide person-centered care.",
  ],
  regulatoryReferences: [FS_430_5025],
  sourceReferences: [
    DOEA_ADRD,
    { title: "What Is Dementia? Symptoms, Types, and Diagnosis", publisher: "National Institute on Aging", url: "https://www.nia.nih.gov/health/alzheimers-and-dementia/what-dementia-symptoms-types-and-diagnosis", accessedOn: ACCESSED },
    { title: "Alzheimer's Disease Fact Sheet", publisher: "National Institute on Aging", url: "https://www.nia.nih.gov/health/alzheimers-and-dementia/alzheimers-disease-fact-sheet", accessedOn: ACCESSED },
    { title: "Alzheimer's Caregiving: Wandering and Alzheimer's", publisher: "National Institute on Aging", url: "https://www.nia.nih.gov/health/alzheimers-changes-behavior-and-communication/wandering-and-alzheimers-disease", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Understanding dementia",
      summary: "What dementia is, what it is not, and the common types.",
      lessons: [
        text("What dementia is", 15, `**Dementia** is the loss of thinking, remembering and reasoning abilities — and sometimes changes in behavior and personality — to the point that it interferes with a person's daily life and activities. It is caused by diseases that damage the brain. **It is not a normal part of aging.**

### Normal aging, dementia and delirium
| | Typical aging | Dementia | Delirium |
|---|---|---|---|
| Onset | — | Gradual, over months to years | **Sudden**, hours to days |
| Memory | Occasionally forgets names, remembers later | Forgets recent events, repeats questions, gets lost in familiar places | Attention and awareness fluctuate |
| Daily life | Manages independently | Needs increasing help | Can change hour to hour |
| What to do | — | Ongoing support | **Medical emergency — report immediately** |

Delirium is often caused by infection (such as urinary tract infection), dehydration, pain, constipation or medicines. A person with dementia can also develop delirium. **Any sudden change must be reported.**

### Common types
- **Alzheimer's disease** — the most common cause. Early memory loss for recent events, later problems with language, judgment and physical function.
- **Vascular dementia** — caused by reduced blood flow (for example after strokes); changes may happen in steps; planning and problem-solving often affected.
- **Lewy body dementia** — fluctuating alertness, visual hallucinations, movement problems similar to Parkinson's disease, sleep disturbances. People can be very sensitive to some medicines.
- **Frontotemporal dementia** — often begins at a younger age; changes in personality, behavior or language may come before memory loss.
- **Mixed dementia** — more than one cause, common in older adults.`),
        text("Stages of dementia", 12, `Dementia usually progresses over years, and every person's course is different. Stages are commonly described as:

**Early (mild):** forgets recent conversations, misplaces things, trouble with planning, finances or new tasks; usually still independent with self-care. *Support:* reminders, calendars, routines, preserving independence and involvement in decisions.

**Middle (moderate):** often the longest stage. More confusion and memory loss, trouble with dressing and bathing, getting lost, changes in sleep, increased distress, suspicion or repetitive behaviors. *Support:* step-by-step help with daily activities, simple choices, safety supervision, attention to unmet needs.

**Late (severe):** needs help with almost all care; limited speech; difficulty walking, sitting up and swallowing; higher risk of infections, pressure injuries and weight loss. *Support:* comfort, gentle touch, music, careful feeding and positioning, skin care, and palliative or hospice care when appropriate.`),
        check("Check your understanding: understanding dementia", [
          kc("dem1", "Which change should be reported to the nurse right away?", ["Gradual memory loss over two years", "Sudden new confusion over one day", "Occasionally forgetting a name", "Liking the same routine"], 1, "Sudden change suggests delirium, which is a medical emergency."),
          kc("dem2", "Which type of dementia often includes visual hallucinations and fluctuating alertness?", ["Vascular dementia", "Lewy body dementia", "Normal aging", "Frontotemporal dementia"], 1, "These are hallmark features of Lewy body dementia."),
          kc("dem3", "Dementia is:", ["A normal part of aging", "Caused by diseases that damage the brain", "Always caused by stress", "Curable with vitamins"], 1, "Dementia is not normal aging."),
        ]),
      ],
    },
    {
      title: "2. Communication strategies",
      summary: "How to be understood and how to understand.",
      lessons: [
        text("Communicating with a person living with dementia", 16, `### Getting started
- Approach **from the front**, at eye level. Say the person's name and your name: "Hi, Mrs. Diaz, it's Ana, your helper."
- Reduce noise and distractions (turn off the TV).
- Use a calm, warm tone and relaxed body language. People living with dementia often respond to your **mood** more than your words.

### Speaking
- Short, simple sentences; one idea or step at a time.
- Give time to respond — count to 10 before repeating.
- Repeat with the **same words** if needed; then try showing or gesturing.
- Ask yes/no questions or offer **two choices** ("Would you like the blue shirt or the red one?").
- Avoid quizzing ("Do you remember who I am?") and avoid "baby talk."

### Listening
- Look for the feeling behind the words.
- If words are mixed up, guess gently and check: "Are you worried about the dog?"
- Watch facial expressions and body language, especially when speech is limited — they may signal pain, fear or a need.

### Avoid arguing
Correcting a person's version of reality usually increases distress. **Validate the feeling and redirect.**
- Instead of: "Your mother died 30 years ago."
- Try: "You're thinking about your mother. Tell me about her." Then move to a comforting activity.

### Nonverbal approaches
Gentle touch (if welcome), smiling, music the person loves, familiar photos and objects.`),
        check("Check your understanding: communication", [
          kc("dem4", "Which question is easiest for a person with moderate dementia to answer?", ["\"What would you like for lunch?\"", "\"Would you like soup or a sandwich?\"", "\"What did you do this morning?\"", "\"Do you remember my name?\""], 1, "Two simple choices are easier than open questions or memory tests."),
          kc("dem5", "A man insists he must go to work, though he retired years ago. What is the best response?", ["\"You're retired. Stop it.\"", "\"You've always been a hard worker. Tell me about your job — and let's have coffee first.\"", "Lock the doors and ignore him", "Call the police"], 1, "Validate the feeling and redirect."),
        ]),
      ],
    },
    {
      title: "3. Behavioral symptoms and how to respond",
      summary: "Behavior as communication; a structured approach.",
      lessons: [
        text("Understanding distressed behavior", 15, `Many people living with dementia experience changes such as agitation, restlessness, pacing, repeating questions, resisting care, suspicion or accusations, hallucinations, sleep problems, sundowning (more confusion and agitation in the late afternoon and evening), and wandering.

**Behavior is communication.** The person may not be able to say what is wrong. Look for causes:

| Category | Possible causes |
|---|---|
| **Physical** | Pain, hunger, thirst, need to use the toilet, constipation, infection, tiredness, hearing or vision problems, medication side effects |
| **Environment** | Too much noise or activity, too little to do, unfamiliar place or caregiver, poor lighting and shadows, too hot or cold |
| **Task** | Task too complicated, rushed, not explained, done in a way that feels unsafe or embarrassing (such as bathing) |
| **Emotional** | Fear, loneliness, boredom, frustration, grief, feeling a loss of control |
| **Communication** | Not understanding what is being asked; not being understood |

### Responding in the moment
1. **Stay calm.** Lower your voice; do not argue or use force.
2. **Check safety** — for the person and you.
3. **Look for a need** and meet it (offer a drink, the toilet, a snack, a blanket, a quieter place).
4. **Reassure and redirect** to a calming activity (music, a walk, folding towels, looking at photos).
5. **Try again later** if the person resists care. A refusal of a shower now may be acceptance in 20 minutes or with a different approach.
6. **Report** new, worse or dangerous behavior to the nurse — new behaviors may signal pain or infection.

Medicines are not the first answer. Some antipsychotic medicines carry serious risks for older adults with dementia; the clinical team decides on medicines. Your observations about what triggers and what calms behavior are valuable.`),
        text("A structured approach: DICE", 12, `**DICE** is a widely used, evidence-informed approach for managing behavioral symptoms of dementia. The care team works through four steps:

1. **Describe** — what exactly happens? When, where, with whom? What happened just before and just after? (Keeping a simple log helps: time, situation, behavior, what you tried, what worked.)
2. **Investigate** — the nurse and clinician look for causes: pain, infection, medicines, sleep, the environment, the approach used, unmet needs.
3. **Create** — the team (including you and the family) creates a plan: change the routine, approach or environment; treat underlying problems; add meaningful activities.
4. **Evaluate** — did the plan work? Adjust it.

**Your role as caregiver:** describe what you observe objectively and consistently, try the agreed approaches, and report what helps.

### Example
*Describe:* Mr. Lewis hits out every evening when helped to shower. *Investigate:* he has knee pain, the bathroom is cold and bright, and he has always bathed in the morning. *Create:* morning showers after his pain medicine, warm the bathroom, cover him with a towel, explain each step, let him hold the washcloth. *Evaluate:* no hitting in two weeks.`),
        check("Check your understanding: behaviors", [
          kc("dem6", "A client who usually accepts care is suddenly agitated and pulling at his clothes. What is a likely first step?", ["Give him a sedative", "Check for unmet needs such as pain, toileting or discomfort, and report new behavior", "Ignore it", "Restrain his hands"], 1, "Behavior often signals an unmet need or a medical change."),
          kc("dem7", "In DICE, what is the caregiver's most important contribution to the Describe step?", ["Diagnosing the cause", "Objective observations of when, where and what happens before and after", "Prescribing medicine", "Deciding the plan alone"], 1, "Detailed, objective descriptions guide the investigation."),
          kc("dem8", "Sundowning refers to:", ["Sunburn", "Increased confusion or agitation in the late afternoon and evening", "Sleeping all day", "Wandering only at noon"], 1, "Light, routine and activity changes can help."),
        ]),
      ],
    },
    {
      title: "4. Wandering and safety",
      summary: "Reducing risks at home and responding when someone is missing.",
      lessons: [
        text("Wandering and home safety", 14, `Many people living with dementia wander or become lost, even in familiar places. It can happen at any stage of the disease.

### Reduce the risk
- Keep a daily routine with activity and exercise; take walks together.
- Watch for triggers: restlessness, saying they want to "go home" or "go to work," time of day.
- Meet basic needs (toileting, hunger, thirst).
- Place locks high or low on doors, or use door alarms, chimes or motion sensors as the family and agency decide. Do not leave the person alone if they are at risk.
- Camouflage doors (curtains, a stop sign) if the care team agrees.
- Keep car keys out of sight; driving decisions are for the family and clinician.
- Make sure the person wears an ID bracelet or carries ID with a contact number; keep a recent photo available.
- Tell trusted neighbors.

### If the person is missing
Search the immediate area for **no more than about 15 minutes**, then **call 911** and tell them the person has dementia. Notify your supervisor and the family. Give a recent photo and a description of clothing. Check places the person used to go.

### Home safety
- Lock away medicines, cleaning products, sharp tools and firearms.
- Set water heater temperature to prevent scalds (many sources suggest 120°F or below).
- Remove stove knobs or use automatic shut-off devices if the family agrees.
- Good lighting, night lights and clear paths; remove throw rugs.
- Supervise smoking or avoid it; never smoke near oxygen.`),
        check("Check your understanding: safety", [
          kc("dem9", "A client with dementia is missing from home. After a quick search of the immediate area, what should you do?", ["Wait a few hours", "Call 911 and say the person has dementia, then notify your supervisor and the family", "Post on social media first", "Search alone all day"], 1, "Time matters. Call 911 quickly."),
          kc("dem10", "Which is a home safety step for a person with dementia?", ["Leaving medicines on the counter", "Locking away medicines and cleaning products", "Keeping car keys by the door", "Turning the water heater higher"], 1, "Secure hazards that could cause harm."),
        ]),
      ],
    },
    {
      title: "5. Person-centered care and family support",
      summary: "Knowing the person and supporting the people who love them.",
      lessons: [
        text("Person-centered care", 12, `**Person-centered care** means seeing the **person first**, not the disease. It builds care around the individual's history, values, preferences and abilities.

- **Know the life story:** work, family, faith, hobbies, music, foods, daily routines, what comforts them, what upsets them. Some families create a "life story" page or memory box.
- **Preserve abilities:** break tasks into steps; let the person do what they can, even if it takes longer.
- **Offer meaningful activity:** folding laundry, sorting, gardening, music, prayer, looking at photos, helping set the table. Activities should feel purposeful, not childish.
- **Respect choices** and dignity — privacy during care, choice of clothes, being addressed as an adult.
- **Comfort in late stages:** gentle touch, familiar voices and music, soft blankets, careful mouth and skin care, and recognizing signs of pain when the person cannot say they hurt (grimacing, moaning, guarding, restlessness).`),
        text("Supporting family caregivers", 10, `Family members who care for someone with dementia often experience stress, exhaustion, grief, guilt and isolation.
- Listen without judgment; acknowledge how hard caregiving is.
- Share what you see is working ("She really enjoys the old hymns in the afternoon").
- Encourage caregivers to rest, accept help and look after their own health.
- Share resources your agency approves: support groups, respite care, adult day programs, the Department of Elder Affairs and local Area Agencies on Aging (Florida's Elder Helpline is available through the Department of Elder Affairs), and Alzheimer's organizations.
- Report signs that a family caregiver is overwhelmed or that the person may be at risk of neglect or abuse.`),
        caseStudy("Case study: Mrs. Okafor", 14, `**Situation (fictional).** Mrs. Okafor, 81, has moderate Alzheimer's disease and lives with her daughter, Ngozi, who works days. You provide personal care and companionship four hours each afternoon.

Recently Mrs. Okafor has been pacing at about 4 p.m., saying she must "get the children from school." Yesterday she tried to leave through the front door. Today she pushes your hand away when you try to help her change her wet clothes, and she winces when she sits down.

**Discussion questions:**
1. What could be causing her distress and resistance? *(Possible pain when sitting, a wet brief, sundowning, an old routine of picking up children, boredom.)*
2. What could you do right now? *(Stay calm, validate: "You're a caring mother. Tell me about your children." Offer the toilet and a snack, try changing clothes again in a few minutes with simple steps, and report the wincing to the nurse.)*
3. What should the team plan? *(Use DICE: describe the 4 p.m. pattern; nurse assesses pain and possible infection; create a plan such as an afternoon walk or a meaningful task at 3:30, a door chime, ID bracelet; evaluate.)*
4. How can you support Ngozi? *(Share observations, ask how she is managing, share approved respite and support resources.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Dementia and Alzheimer's Care — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      tf("Dementia is a normal part of aging.", false, "Dementia is caused by diseases that damage the brain."),
      mc("The most common cause of dementia is:", ["Vascular dementia", "Alzheimer's disease", "Lewy body dementia", "Frontotemporal dementia"], 1, "Alzheimer's disease is the most common cause."),
      mc("Which best describes delirium?", ["Gradual decline over years", "A sudden change in attention and awareness that needs prompt medical attention", "Normal forgetfulness", "A type of dementia that cannot be treated"], 1, "Delirium develops quickly and often has a treatable cause."),
      mc("Changes in personality or behavior before memory loss, often at a younger age, suggest:", ["Alzheimer's disease", "Frontotemporal dementia", "Normal aging", "Delirium"], 1, "This is typical of frontotemporal dementia."),
      mc("In the late stage of dementia, a person typically:", ["Lives independently", "Needs help with nearly all care and may have trouble swallowing", "Has no memory problems", "Drives safely"], 1, "Late stage requires comprehensive and comfort-focused care."),
      ms("Which communication strategies help? (Select all that apply.)", ["Approach from the front and say your name", "Use short sentences, one step at a time", "Quiz the person about recent events", "Offer two simple choices"], [0, 1, 3], "Quizzing increases stress."),
      mc("A client says her late husband is coming to pick her up. The best response is:", ["\"He died; you know that.\"", "\"You miss him. Tell me about him,\" then redirect", "Ignore her", "Argue until she agrees"], 1, "Validate and redirect."),
      mc("Distressed behavior in dementia is best understood as:", ["Deliberate bad behavior", "Communication of an unmet need or discomfort", "Something to ignore", "Always a reason for sedation"], 1, "Look for the cause."),
      mc("In the DICE approach, the steps are:", ["Detect, Inform, Contain, End", "Describe, Investigate, Create, Evaluate", "Discuss, Ignore, Correct, Explain", "Diagnose, Inject, Control, Exit"], 1, "Describe, Investigate, Create, Evaluate."),
      sc("A client refuses a bath and becomes upset. What should you do?", ["Insist and finish quickly", "Stop, stay calm, meet any needs, and try again later or a different way; report repeated refusals", "Restrain her gently", "Tell her family she was bad"], 1, "Never force care; try a different time or approach."),
      mc("Signs of pain in a person who cannot speak may include:", ["Smiling and relaxed posture", "Grimacing, moaning, guarding a body part or restlessness", "Sleeping normally", "Eating well"], 1, "Watch nonverbal cues."),
      mc("If a person with dementia is missing, you should call 911:", ["After 24 hours", "Quickly — after a brief search of about 15 minutes", "Only if the family agrees", "Never"], 1, "Early reporting improves outcomes."),
      mc("Which is part of person-centered care?", ["Using the same routine for everyone", "Learning the person's life story, preferences and routines", "Doing everything for the person to save time", "Speaking to the family instead of the person"], 1, "Person-centered care is built around the individual."),
      mc("Under Florida law, the additional dementia training for home health agency employees who provide personal care must use:", ["Any online video", "A trainer and curriculum approved by the Department of Elder Affairs", "No training", "Only on-the-job shadowing"], 1, "Section 430.5025 requires DOEA-approved trainers and curricula."),
      mc("A family caregiver says she hasn't slept well in weeks. What is a helpful response?", ["\"That's your problem.\"", "Listen, acknowledge the stress, and share approved support and respite resources", "Tell her to put her mother in a facility", "Ignore it"], 1, "Support caregivers and share resources."),
    ],
  },
};
