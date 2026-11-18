import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, slides, text, tf } from "../../build";
import { ACCESSED, LIFELINE, NIMH_WARNING, SCOPE_NOTICE } from "./_shared";

export const mhFundamentals: CourseContent = {
  code: "CHITA-MH-001",
  title: "Mental Health Fundamentals Certificate (Introductory)",
  categorySlug: "mental-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 180,
  clinicalReviewRequired: true,
  programClassification: "GENERAL_EDUCATION",
  certificateType: "PROFESSIONAL_DEVELOPMENT",
  credentialNotice: SCOPE_NOTICE,
  instructorResources: "Invite a person with lived experience (through a peer organization) to speak about stigma. Remind learners before modules 2 and 4 that the content may bring up personal experiences, and share the 988 Lifeline and employee assistance information.",
  description:
    "An introductory certificate on mental health and wellness: what mental health and mental illness are, stigma, common conditions (depression, anxiety disorders, bipolar disorder, schizophrenia, PTSD and substance use disorders), recognizing warning signs, communicating supportively, emotional intelligence, stress management and resilience, and where to refer people for help.",
  targetAudience: "Health care and social service workers, home care and residential staff, supervisors, and anyone who wants a foundation in mental health.",
  prerequisites: [],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Describe mental health, mental illness and wellness as a continuum.",
    "Explain how stigma harms people and how to reduce it.",
    "Describe the main features of common mental health conditions and substance use disorders.",
    "Recognize warning signs that someone may need support, including suicide warning signs.",
    "Communicate in a supportive, non-judgmental way and connect people with resources.",
    "Use stress management, emotional intelligence and resilience strategies.",
  ],
  regulatoryReferences: [],
  sourceReferences: [
    { title: "Mental Illness", publisher: "National Institute of Mental Health", url: "https://www.nimh.nih.gov/health/statistics/mental-illness", accessedOn: ACCESSED },
    { title: "Health Topics (depression, anxiety disorders, bipolar disorder, schizophrenia, PTSD)", publisher: "National Institute of Mental Health", url: "https://www.nimh.nih.gov/health/topics", accessedOn: ACCESSED },
    NIMH_WARNING,
    LIFELINE,
    { title: "FindTreatment.gov", publisher: "Substance Abuse and Mental Health Services Administration", url: "https://findtreatment.gov/", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Mental health and wellness",
      summary: "What mental health is, the continuum, and stigma.",
      lessons: [
        slides("Mental health is health", 8, `## Mental health
Our emotional, psychological and social wellbeing. It affects how we think, feel and act, handle stress, relate to others and make choices.
---
## A continuum
Thriving → coping → struggling → unwell
- Everyone moves along it over time.
- A **mental illness** is a diagnosable condition that affects thinking, mood or behavior and causes distress or problems functioning.
- People with a mental illness can have good wellbeing; people without one can struggle.
---
## Mental illness is common
NIMH reports that more than one in five U.S. adults live with a mental illness. Most conditions are treatable, and recovery is possible.
---
## Wellness includes
Sleep • movement • nutrition • connection • purpose • managing stress • seeking help early`),
        text("Stigma and how to reduce it", 12, `**Stigma** is negative attitudes and discrimination toward people because of a characteristic — here, a mental health or substance use condition. It can be:
- **Public stigma** — stereotypes ("dangerous," "weak," "lazy").
- **Self-stigma** — people believing these stereotypes about themselves.
- **Structural stigma** — policies and systems that limit opportunities.

Stigma stops people from seeking help, keeps them silent and isolated, and affects jobs, housing and health care.

### What you can do
- **Use person-first or preferred language:** "a person with schizophrenia," "a person who uses drugs," "died by suicide" (not "committed suicide").
- Avoid words like "crazy," "psycho," "junkie," "addict" as labels.
- **Challenge myths** with facts: most people with mental illness are not violent and are more likely to be victims of violence than perpetrators.
- **Treat mental health like physical health** — offer the same respect and support.
- Listen to people with lived experience.
- Notice your own assumptions.`),
        check("Check your understanding: wellness and stigma", [
          kc("mhf1", "Which phrase reduces stigma?", ["\"He's a schizophrenic.\"", "\"He is a person living with schizophrenia.\"", "\"She's crazy.\"", "\"He committed suicide.\""], 1, "Person-first language puts the person before the condition."),
          kc("mhf2", "Mental health and mental illness are best described as:", ["The same thing", "A continuum that everyone moves along", "Permanent categories", "Only relevant to hospitals"], 1, "Everyone's mental health changes over time."),
        ]),
      ],
    },
    {
      title: "2. Common mental health conditions",
      summary: "Depression, anxiety, bipolar disorder, schizophrenia and PTSD.",
      lessons: [
        text("Mood and anxiety conditions", 18, `*This overview helps you recognize when someone may need support. Only qualified professionals diagnose.*

### Depression (major depressive disorder)
Persistent sad, anxious or "empty" mood, or loss of interest or pleasure, for at least two weeks, with other symptoms such as changes in sleep or appetite, low energy, trouble concentrating, feelings of worthlessness or guilt, slowed movement or restlessness, and thoughts of death or suicide. In older adults depression may show up as irritability, physical complaints or memory problems. Treatment (talk therapy, medication, or both) is effective.

### Anxiety disorders
Anxiety that is intense, lasts, and interferes with daily life.
- **Generalized anxiety disorder** — excessive, hard-to-control worry most days, with restlessness, tiredness, muscle tension and sleep problems.
- **Panic disorder** — repeated, unexpected **panic attacks**: sudden intense fear with a racing heart, sweating, shaking, shortness of breath, chest pain, dizziness or fear of dying, peaking within minutes; plus worry about future attacks.
- **Social anxiety disorder** and **specific phobias** — intense fear of social situations or of specific things.

### Bipolar disorder
Shifts in mood, energy and activity levels.
- **Manic episodes:** feeling very "up" or irritable, little need for sleep, racing thoughts, talking fast, risky behavior, grandiosity. **Hypomania** is less severe.
- **Depressive episodes** as above.
Ongoing treatment, often including mood-stabilizing medication, helps people manage it.`),
        text("Psychotic disorders and PTSD", 14, `### Schizophrenia
A serious mental illness affecting how a person thinks, feels and behaves. Symptoms usually begin between the late teens and early thirties.
- **Psychotic symptoms:** hallucinations (hearing or seeing things others do not), delusions (fixed false beliefs), disorganized thinking and speech.
- **Negative symptoms:** reduced motivation, less emotional expression, social withdrawal.
- **Cognitive symptoms:** trouble with attention and memory.
Treatment with medication and psychosocial support helps many people live in the community, work and pursue goals. Early treatment improves outcomes.

### Post-traumatic stress disorder (PTSD)
Can develop after experiencing or witnessing a terrifying event. Symptoms lasting more than a month and affecting daily life include:
- **Re-experiencing** — flashbacks, nightmares, intrusive memories
- **Avoidance** of reminders
- **Arousal and reactivity** — easily startled, on edge, sleep problems, angry outbursts
- **Changes in thinking and mood** — negative beliefs, guilt, loss of interest
Effective treatments include trauma-focused therapies and medication.

### Co-occurring conditions
Mental health conditions often occur together, and with substance use disorders (see module 3) and physical health conditions.`),
        check("Check your understanding: conditions", [
          kc("mhf3", "Sudden intense fear with a racing heart and shortness of breath that peaks within minutes describes:", ["A manic episode", "A panic attack", "A delusion", "Normal sadness"], 1, "Panic attacks peak within minutes; check for medical causes if chest pain is present."),
          kc("mhf4", "Hearing voices that others do not hear is an example of:", ["A delusion", "A hallucination", "A negative symptom", "Anxiety"], 1, "Hallucinations are perceptions without an external source."),
          kc("mhf5", "Little need for sleep, racing thoughts and risky behavior suggest:", ["A depressive episode", "A manic episode", "PTSD", "Social anxiety"], 1, "These are features of mania."),
        ]),
      ],
    },
    {
      title: "3. Substance use and warning signs",
      summary: "Substance use disorders and when someone may need help.",
      lessons: [
        text("Substance use disorders", 12, `A **substance use disorder (SUD)** is a treatable medical condition in which a person continues using alcohol or drugs despite harm. Signs can include using more than intended, trying and failing to cut down, cravings, failing to meet responsibilities, giving up activities, using in dangerous situations, tolerance and withdrawal.

- SUD is not a moral failing. Genetics, trauma, mental health conditions, environment and early use all affect risk.
- Mental health conditions and SUD often occur together (**co-occurring disorders**).
- Effective treatment exists, including medications for opioid and alcohol use disorders, counseling and peer recovery support.

Our Behavioral Health and Substance Use course covers this in depth, including overdose response and naloxone.`),
        text("Recognizing warning signs", 14, `Notice **changes** from a person's usual self, especially if they last or get worse:
- Withdrawing from people and activities
- Big changes in sleep, appetite or hygiene
- Ongoing sadness, hopelessness, irritability or anger
- Excessive worry or fear
- Trouble concentrating, confused thinking
- Seeing or hearing things others do not; unusual beliefs
- Increased alcohol or drug use
- Talking about being a burden or wanting to die

### Suicide warning signs — act now
NIMH lists behaviors that may signal someone is thinking about suicide, including talking about wanting to die, feeling great guilt or shame, or being a burden to others; feeling empty, hopeless, trapped or having no reason to live; making a plan or researching ways to die; withdrawing; giving away possessions; saying goodbye; taking dangerous risks; and increased substance use. Risk is greater when the behavior is new or has increased.

**If you notice warning signs:** ask directly and listen (see module 4). **Call or text 988** (Suicide & Crisis Lifeline) or chat at 988lifeline.org. **Call 911** if there is immediate danger. Do not leave someone alone if they are at immediate risk.`),
        check("Check your understanding: warning signs", [
          kc("mhf6", "Which change is a suicide warning sign?", ["Starting a new hobby", "Giving away prized possessions and talking about being a burden", "Sleeping well", "Making plans for next month"], 1, "These are warning signs listed by NIMH."),
          kc("mhf7", "The 988 Suicide & Crisis Lifeline can be reached by:", ["Call only", "Call, text or chat", "Email only", "In person only"], 1, "Call or text 988, or chat at 988lifeline.org."),
        ]),
      ],
    },
    {
      title: "4. Supportive communication and emotional intelligence",
      summary: "Listening, responding and understanding emotions.",
      lessons: [
        text("Mental health communication", 15, `### Listen first
- Find a private, calm moment. Give your full attention.
- Use **open questions:** "How have things been for you lately?"
- **Reflect** what you hear: "It sounds like you've been feeling overwhelmed."
- Allow silence. Do not rush to fix or give advice.
- Validate feelings: "That sounds really hard."

### Avoid
- Minimizing ("Everyone gets sad," "Just think positive")
- Arguing about beliefs or experiences
- Judging, lecturing or diagnosing
- Promising to keep secrets you cannot keep (for example, if someone is in danger)

### Asking about suicide
Asking directly about suicide **does not** put the idea in someone's head; it can bring relief and open the door to help. Ask calmly: "Are you thinking about suicide?" If yes, stay with them, remove access to means if it is safe to do so, and connect them with help (988 or 911 if there is immediate danger).

### Offer help and hope
"You don't have to go through this alone." "Help is available and things can get better." Offer to help them contact a doctor, counselor, 988, or their employee assistance program.`),
        text("Emotional intelligence", 10, `**Emotional intelligence (EI)** is the ability to understand and manage your own emotions and recognize and respond to others' emotions. A widely used model includes:
1. **Self-awareness** — noticing your feelings and how they affect your actions.
2. **Self-regulation** — managing reactions (pausing, breathing before responding).
3. **Motivation** — staying focused on goals and values.
4. **Empathy** — understanding how others feel.
5. **Social skills** — communicating clearly, resolving conflict, building trust.

In health care, EI helps you stay calm with a distressed client, notice when someone is struggling, and recognize your own stress before it affects your work.`),
        check("Check your understanding: communication", [
          kc("mhf8", "Does asking someone directly about suicide increase their risk?", ["Yes", "No — asking directly can open the door to help", "Only for teenagers", "Only if they are hospitalized"], 1, "Asking directly is recommended."),
          kc("mhf9", "Which response is validating?", ["\"Just cheer up.\"", "\"That sounds really hard. I'm here to listen.\"", "\"Others have it worse.\"", "\"You're overreacting.\""], 1, "Validation acknowledges the person's experience."),
        ]),
      ],
    },
    {
      title: "5. Stress, resilience and getting help",
      summary: "Coping strategies and referral resources.",
      lessons: [
        text("Stress management and resilience", 12, `### Stress
Stress is the body's response to a challenge. Short-term stress can help us act; long-term stress can harm sleep, mood, the heart and the immune system. Health care work carries risks of burnout and **compassion fatigue**.

### Practical strategies
- **Breathing:** slow breaths, for example in for 4, hold for 4, out for 6.
- **Movement:** regular physical activity, even short walks.
- **Sleep:** regular schedule, limit screens and caffeine late in the day.
- **Connection:** talk with people you trust.
- **Boundaries:** take breaks; say no when you need to.
- **Limit alcohol** and avoid using substances to cope.
- **Grounding** when overwhelmed: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.

### Resilience
Resilience is the ability to adapt to stress and adversity. It can be built through supportive relationships, a sense of purpose, problem-solving skills, self-care, flexible thinking and seeking help early.`),
        text("Referral and support resources", 10, `Know where to send people — and how to get help yourself:
- **988 Suicide & Crisis Lifeline:** call or text 988, chat at 988lifeline.org (24/7). Veterans: call 988 and press 1.
- **911** for immediate danger to life.
- **FindTreatment.gov** (SAMHSA) to locate mental health and substance use treatment.
- **SAMHSA National Helpline:** 1-800-662-4357 (treatment referral and information, 24/7).
- **Primary care providers** — often the first step.
- **Employee assistance programs (EAP)** — free, confidential counseling for many workers.
- **2-1-1** for local community services in Florida.
- **Peer support** organizations and support groups.

Follow your employer's policies for reporting and referral. In your role you **connect people to help**; you do not diagnose or provide therapy.`),
        caseStudy("Case study: a coworker who has changed", 12, `**Situation (fictional).** Your coworker Dana, usually upbeat, has been late several times, looks tired, and snapped at a patient. At lunch she says, "What's the point anymore? Everyone would be better off without me."

**Discuss:**
1. Which warning signs do you notice? *(Changes in behavior and mood, irritability, talking about being a burden.)*
2. What could you say? *(Privately: "I've noticed you seem really tired and down lately, and what you just said worries me. Are you thinking about suicide?")*
3. If she says yes? *(Stay with her, listen, and connect her now — call or text 988 together, involve your supervisor according to policy; call 911 if she is in immediate danger.)*
4. If she says no but is struggling? *(Listen, offer the EAP and 988, check in later, and look after yourself too.)*`),
      ],
    },
  ],
  finalExam: {
    title: "Mental Health Fundamentals — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      tf("A person can have a mental illness and still have good wellbeing.", true, "Mental health and mental illness are related but distinct."),
      mc("Self-stigma means:", ["Stigma in laws", "A person believing negative stereotypes about themselves", "Stigma from the media only", "Stigma that helps recovery"], 1, "Self-stigma can stop people from seeking help."),
      mc("Which statement is accurate?", ["Most people with mental illness are violent", "People with mental illness are more likely to be victims of violence than perpetrators", "Mental illness is rare", "Mental illness cannot be treated"], 1, "This is a common myth to challenge."),
      mc("Depression typically involves low mood or loss of interest for at least:", ["One hour", "Two weeks", "One day", "Ten years"], 1, "Symptoms last most of the day, nearly every day, for at least two weeks."),
      mc("Excessive, hard-to-control worry on most days suggests:", ["Generalized anxiety disorder", "Schizophrenia", "Mania", "PTSD only"], 0, "This is the core feature of GAD."),
      mc("A fixed false belief that others do not share is a:", ["Hallucination", "Delusion", "Panic attack", "Flashback"], 1, "Delusions are beliefs; hallucinations are perceptions."),
      mc("Flashbacks, avoidance and being easily startled after a frightening event suggest:", ["PTSD", "Bipolar disorder", "Normal aging", "Generalized anxiety only"], 0, "These are core PTSD symptom groups."),
      mc("Bipolar disorder involves:", ["Only sadness", "Shifts between manic or hypomanic and depressive episodes", "Hearing voices only", "Fear of spiders"], 1, "Mood, energy and activity shift."),
      tf("A substance use disorder is a moral failing rather than a medical condition.", false, "SUD is a treatable medical condition."),
      ms("Which are suicide warning signs? (Select all that apply.)", ["Talking about being a burden", "Giving away possessions", "Researching ways to die", "Planning a vacation with friends"], [0, 1, 2], "Planning future activities is not a warning sign."),
      mc("The best first step when you are worried someone is thinking about suicide is to:", ["Avoid the subject", "Ask directly and listen", "Tell everyone at work", "Wait to see if it passes"], 1, "Asking directly is safe and opens the door to help."),
      mc("Which phrase avoids stigma?", ["\"Committed suicide\"", "\"Died by suicide\"", "\"Crazy\"", "\"Junkie\""], 1, "\"Died by suicide\" is the preferred term."),
      mc("Self-regulation, a part of emotional intelligence, means:", ["Ignoring feelings", "Managing your reactions, such as pausing before responding", "Controlling other people", "Never feeling stress"], 1, "Self-regulation is managing your own responses."),
      mc("Which is a healthy stress-management strategy?", ["Drinking more alcohol", "Regular physical activity and talking with people you trust", "Skipping sleep", "Working without breaks"], 1, "Healthy coping supports resilience."),
      sc("A client says she feels hopeless and has a plan to end her life tonight. What should you do?", ["Promise to keep it secret", "Stay with her and call 911 (or 988 if not in immediate danger), following your agency's policy", "Tell her to sleep on it", "Leave and report next week"], 1, "Immediate danger requires emergency help."),
    ],
  },
};
