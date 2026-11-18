import type { CourseContent } from "../../types";
import { caseStudy, check, kc, mc, ms, sc, text, tf } from "../../build";
import { ACCESSED, FS_381_887, FS_394_463, LIFELINE, MHFA, NIMH_WARNING, SCOPE_NOTICE, WHO_PFA } from "./_shared";

export const crisisAwareness: CourseContent = {
  code: "CHITA-MH-002",
  title: "Mental Health Crisis Awareness and Response (Intermediate)",
  categorySlug: "mental-health",
  isRequiredByDefault: false,
  certificateEligible: true,
  passingScore: 80,
  renewalMonths: null,
  estimatedMinutes: 145,
  clinicalReviewRequired: true,
  programClassification: "GENERAL_EDUCATION",
  certificateType: "PROFESSIONAL_DEVELOPMENT",
  credentialNotice: `${SCOPE_NOTICE} This course is not Mental Health First Aid® and does not lead to Mental Health First Aid certification. Mental Health First Aid is a program of the National Council for Mental Wellbeing; only instructors certified by the National Council can teach it and certify First Aiders. To earn that certification, take an official course listed at mentalhealthfirstaid.org, or through a certified instructor your organization partners with.`,
  instructorResources: `**Authorized pathway:** if your organization wants to offer the official Mental Health First Aid certification, partner with a National Council–certified instructor (or have staff become certified instructors) and record the partnership in Platform → Programs & Approvals as a "partner authorization." Do not call this CHITA course "Mental Health First Aid" or use the MHFA action plan, materials or trademarks.

Scenario practice for module 3: a client having a panic attack in the waiting room; a resident who believes staff are poisoning his food.`,
  competencyCodes: ["COMP-MH-DEESC", "COMP-MH-NALOXONE"],
  description:
    "How to recognize and respond safely to a mental health or substance-related crisis until professional help takes over: identifying signs of mental health challenges, recognizing a crisis, suicide warning signs, responding to panic attacks and psychotic episodes, substance-related emergencies including opioid overdose, communicating calmly, psychological first aid (look, listen, link), and connecting people with 988, mobile crisis and emergency services in Florida. Includes a clear pathway to the official Mental Health First Aid certification.",
  targetAudience: "Front-line health care, home care, residential and social service staff, supervisors, and community workers.",
  prerequisites: ["CHITA-MH-001"],
  completionCriteria: "Complete all lessons and pass the final examination with 80% or higher.",
  objectives: [
    "Identify signs that someone is developing a mental health challenge or is in crisis.",
    "Recognize suicide warning signs and respond by asking directly and connecting to help.",
    "Respond supportively to a panic attack and to a person experiencing psychosis.",
    "Recognize substance-related emergencies, including opioid overdose, and respond within your training.",
    "Use psychological first aid principles: look, listen, link.",
    "Explain when to call 988, mobile crisis or 911, and the limits of your role, including Florida's Baker Act.",
  ],
  regulatoryReferences: [FS_394_463, FS_381_887],
  sourceReferences: [
    WHO_PFA,
    NIMH_WARNING,
    LIFELINE,
    MHFA,
    { title: "FDA Approves First Over-the-Counter Naloxone Nasal Spray (March 29, 2023)", publisher: "U.S. Food and Drug Administration", url: "https://www.fda.gov/news-events/press-announcements/fda-approves-first-over-counter-naloxone-nasal-spray", accessedOn: ACCESSED },
    { title: "Panic Disorder: When Fear Overwhelms", publisher: "National Institute of Mental Health", url: "https://www.nimh.nih.gov/health/publications/panic-disorder-when-fear-overwhelms", accessedOn: ACCESSED },
  ],
  modules: [
    {
      title: "1. Recognizing a crisis",
      summary: "Early signs, what a crisis looks like, and your role.",
      lessons: [
        text("What is a mental health crisis?", 14, `A **mental health crisis** is any situation in which a person's behavior puts them at risk of hurting themselves or others, or prevents them from caring for themselves or functioning in the community. Examples:
- Thoughts of suicide or a suicide attempt
- Severe panic
- Psychosis with frightening hallucinations or unsafe behavior
- Severe agitation or aggression
- Overwhelming reaction to a traumatic event
- Substance intoxication, withdrawal or overdose

### Early signs that someone is struggling
Changes in mood, sleep, appetite, hygiene, energy and functioning; withdrawal; unusual thinking; increased substance use. Responding early often prevents a crisis.

### Your role
1. **Keep yourself and others safe.**
2. **Recognize** what is happening.
3. **Respond** calmly and supportively within your training.
4. **Connect** the person to help — 988, mobile crisis, a clinician, or 911.
5. **Report and document** according to policy.

You are **not** expected to diagnose, counsel, restrain, or manage a psychiatric emergency alone.`),
        check("Check your understanding: crisis", [
          kc("cr1", "Which is part of your role in a mental health crisis?", ["Diagnosing the condition", "Keeping people safe and connecting the person to professional help", "Prescribing medication", "Physically restraining the person"], 1, "Recognize, respond calmly, connect to help."),
        ]),
      ],
    },
    {
      title: "2. Suicide warning signs and response",
      summary: "Ask, listen, keep safe, connect.",
      lessons: [
        text("Responding to someone at risk of suicide", 16, `### Warning signs
Talking about wanting to die, being a burden, or feeling trapped or hopeless; looking for ways to die; withdrawing; giving things away; saying goodbye; extreme mood swings; increased substance use; reckless behavior. Risk is greater when signs are new or getting worse.

### Respond
1. **Ask directly:** "Are you thinking about killing yourself?" Asking does not increase risk.
2. **Listen** without judgment. Take every statement seriously. Do not argue, minimize or promise secrecy.
3. **Keep them safe:** ask whether they have a plan and access to means. If it is safe to do so, help put distance between the person and lethal means (firearms, stockpiled medicines) following your agency policy.
4. **Connect:** call or text **988** together, contact the person's clinician or your organization's crisis procedure.
5. **Call 911** if the person has taken action, has a weapon, or you cannot keep them safe. Do not leave them alone if they are at immediate risk.
6. **Follow up** — check in later; ongoing connection matters.

### Florida's Baker Act — know the limits of your role
The Baker Act (s. 394.463, F.S.) allows an **involuntary examination** when there is reason to believe a person has a mental illness and, because of it, meets specific legal criteria (such as a substantial likelihood of serious bodily harm to self or others in the near future, or self-neglect causing real and present threat of substantial harm). It can be started only by a **court**, a **law enforcement officer**, or **certain licensed professionals** who have examined the person. Front-line staff do not start a Baker Act — you call 911 or your crisis team and report what you observed.`),
        check("Check your understanding: suicide response", [
          kc("cr2", "Who may initiate an involuntary examination under Florida's Baker Act?", ["Any coworker", "A court, a law enforcement officer, or certain licensed professionals who examined the person", "The person's neighbor", "A home health aide"], 1, "Front-line staff call 911 or the crisis team."),
          kc("cr3", "A client tells you he has a plan and pills saved to end his life. What should you do?", ["Promise to keep it secret", "Stay with him and call 911 or the crisis procedure immediately", "Tell him to call you tomorrow", "Leave quickly"], 1, "A plan and means indicate immediate risk."),
        ]),
      ],
    },
    {
      title: "3. Panic attacks and psychosis",
      summary: "Calm, simple, respectful responses.",
      lessons: [
        text("Responding to a panic attack", 12, `A panic attack is a sudden surge of intense fear with physical symptoms — racing heart, sweating, shaking, shortness of breath, chest pain, dizziness, numbness, fear of losing control or dying. It usually peaks within minutes.

**First, think medical:** chest pain, shortness of breath and numbness can also be a heart attack, asthma, low blood sugar or another emergency. **If you are unsure, or the person has not had panic attacks before, call 911.**

**If it is a panic attack:**
- Stay calm and stay with them. Speak slowly and simply: "You're safe. I'm here. This will pass."
- Move to a quieter place if possible.
- Encourage slow breathing with you (in through the nose, slow breath out). Do not use a paper bag.
- Grounding: name things they can see and hear.
- Do not say "calm down" or "it's all in your head."
- Afterward, encourage them to talk with a health care provider; panic disorder is treatable.`),
        text("Responding to someone experiencing psychosis", 14, `Psychosis means losing some contact with reality: hallucinations, delusions, confused or disorganized thinking. The person may be frightened, suspicious or withdrawn.

**Do:**
- Keep yourself and others safe; keep a clear exit; get help if there is any risk of violence.
- Speak calmly in short, simple sentences; give them space; one person speaks at a time.
- Acknowledge their feelings without agreeing or arguing: "That sounds frightening." "I don't hear the voices, but I can see they're upsetting you."
- Reduce stimulation — turn off the TV, move away from crowds.
- Ask how you can help; offer simple choices.
- Encourage contact with their clinician or a crisis service; call 911 if they are a danger to themselves or others or cannot care for their basic needs.

**Don't:** argue about delusions, laugh, threaten, make sudden movements, touch without permission, or crowd them.`),
        check("Check your understanding: panic and psychosis", [
          kc("cr4", "A person with chest pain and shortness of breath says it may be a panic attack, but it has never happened before. What should you do?", ["Have them breathe into a paper bag", "Call 911 — rule out a medical emergency", "Tell them to calm down", "Ignore it"], 1, "When in doubt, treat as a medical emergency."),
          kc("cr5", "A resident says the staff are poisoning his food. The best response is:", ["\"That's ridiculous.\"", "\"That sounds frightening. Let's find something you feel safe eating,\" and report to the clinician", "Force him to eat", "Agree that staff are poisoning him"], 1, "Acknowledge feelings without arguing or agreeing."),
        ]),
      ],
    },
    {
      title: "4. Substance-related emergencies",
      summary: "Overdose, intoxication and withdrawal.",
      lessons: [
        text("Opioid overdose and naloxone", 15, `### Signs of opioid overdose
Unresponsive or very hard to wake; slow, shallow or stopped breathing; choking or gurgling sounds; pinpoint pupils; pale, blue or gray lips and fingertips.

### Response (follow your training and agency protocol)
1. Try to wake the person: shout, rub the breastbone.
2. **Call 911.**
3. **Give naloxone** if available (for example nasal spray in one nostril).
4. Support breathing per your training (rescue breaths or CPR).
5. If breathing, place them in the **recovery position** on their side.
6. If no response after 2–3 minutes, give a second dose per the product instructions.
7. Stay with them; naloxone can wear off before the opioid does, and overdose can return.

### Naloxone facts
- The FDA approved 4 mg naloxone nasal spray (Narcan) for over-the-counter, nonprescription use in 2023.
- Florida law (s. 381.887, F.S.) authorizes a patient or caregiver who has naloxone to administer it to a person believed in good faith to be experiencing an opioid overdose when a physician is not immediately available.
- Naloxone has no effect on someone who has not taken opioids, so it is safe to give if you suspect an opioid overdose. It can cause sudden withdrawal symptoms.
- Fentanyl and other potent opioids may be mixed into other drugs. Florida decriminalized fentanyl test strips in 2023.

### Other substance emergencies — call 911
- **Alcohol poisoning:** confusion, vomiting, seizures, slow or irregular breathing, very low body temperature, can't be woken. Do not leave them to "sleep it off"; turn them on their side.
- **Stimulant overdose** (cocaine, methamphetamine): very high body temperature, chest pain, agitation, paranoia, seizures. Move to a cool place.
- **Severe alcohol or sedative withdrawal** (shaking, sweating, hallucinations, seizures) can be life-threatening — needs medical care.`),
        check("Check your understanding: overdose", [
          kc("cr6", "Which is a sign of opioid overdose?", ["Fast breathing and dilated pupils", "Slow or stopped breathing and pinpoint pupils", "High energy", "Talking fast"], 1, "Opioids depress breathing."),
          kc("cr7", "Why stay with someone after giving naloxone?", ["It is required by law to stay for 24 hours", "Naloxone can wear off before the opioid, so overdose can return", "To collect payment", "No reason"], 1, "Monitor until EMS takes over."),
        ]),
      ],
    },
    {
      title: "5. Communicating in a crisis and connecting to help",
      summary: "Psychological first aid, de-escalation, and Florida resources.",
      lessons: [
        text("Psychological first aid: look, listen, link", 12, `The World Health Organization's *Psychological First Aid: Guide for Field Workers* describes humane, supportive and practical help for people in serious distress, built around three action principles:

- **Look** — check for safety, for people with urgent basic needs, and for people with serious distress reactions.
- **Listen** — approach people who may need support, ask about their needs and concerns, and listen to help them feel calm.
- **Link** — help people address basic needs and access services, cope with problems, get information, and connect with loved ones and social support.

PFA is not counseling and does not ask people to describe traumatic events in detail.

### De-escalation basics
- Stay calm; lower your voice; keep a relaxed, open posture and a respectful distance.
- Use the person's name; listen and reflect feelings.
- Offer simple choices; set limits respectfully.
- Avoid arguing, threats, sudden movements, or blocking the exit.
- Know when to step away and call for help.`),
        text("Who to call", 8, `| Situation | Call |
|---|---|
| Emotional distress, suicidal thoughts, substance use crisis, worry about someone | **988** (call or text), chat 988lifeline.org |
| Need for an in-person crisis response without immediate danger | Your county's **mobile crisis** team (often reached through 988 or the local crisis line) |
| Immediate danger to life, weapons, overdose, medical emergency | **911** — say it is a mental health crisis and ask for crisis-trained responders if available |
| Ongoing treatment | The person's clinician; **FindTreatment.gov**; SAMHSA Helpline 1-800-662-4357 |

### The official Mental Health First Aid course
If you want certification as a Mental Health First Aider, find an official course at **mentalhealthfirstaid.org**, offered by instructors certified by the National Council for Mental Wellbeing. This CHITA course does not grant that certification.`),
        caseStudy("Case study: the group home evening", 14, `**Situation (fictional).** At a group home, resident Marcus, 34, who lives with schizophrenia, is pacing and shouting that "they" are coming through the vents. Another resident, Ellie, is crying in the hallway, breathing fast and clutching her chest. A visitor tells you someone is "passed out" in the bathroom; you find a man unresponsive with very slow breathing.

**Discuss priorities and actions:**
1. *Life-threatening first:* the unresponsive man with slow breathing — call 911, give naloxone per protocol, support breathing, recovery position, stay until EMS arrives (get a coworker to help).
2. *Ellie:* chest pain and fast breathing — have a coworker stay with her; tell 911 dispatch, since this could be medical; if confirmed panic, slow breathing and grounding.
3. *Marcus:* reduce stimulation, speak calmly, acknowledge his fear without arguing, keep others at a distance, contact his clinician or crisis line; 911 if there is danger.
4. *After:* report and document; debrief with your team; use your employee assistance program.`),
      ],
    },
  ],
  finalExam: {
    title: "Mental Health Crisis Awareness and Response — Final Examination",
    passingScore: 80,
    questionCount: 15,
    questions: [
      mc("A mental health crisis is best described as:", ["Any bad mood", "A situation where behavior puts the person or others at risk or prevents self-care", "A scheduled therapy session", "A diagnosis"], 1, "Crisis involves risk or inability to function."),
      tf("This CHITA course certifies learners as Mental Health First Aiders.", false, "Only the National Council's program, taught by certified instructors, provides MHFA certification."),
      mc("Asking someone directly whether they are thinking about suicide:", ["Plants the idea", "Can open the door to help and does not increase risk", "Is illegal", "Should be avoided"], 1, "Ask directly and calmly."),
      mc("Which is a lethal-means safety step (if it is safe to do so)?", ["Leaving stockpiled medicines within reach", "Helping put distance between the person and firearms or stockpiled medicines, per policy", "Ignoring means", "Asking the person to hold the weapon"], 1, "Reducing access to means saves lives."),
      mc("Under Florida's Baker Act, front-line support staff who are worried about someone should:", ["Sign the involuntary examination themselves", "Call 911 or their crisis procedure and report observations", "Lock the person in a room", "Do nothing"], 1, "Only courts, law enforcement and certain professionals can initiate."),
      mc("During a suspected panic attack, which is helpful?", ["Saying \"calm down\"", "Breathing slowly with the person and reassuring them", "Breathing into a paper bag", "Leaving them alone"], 1, "Calm presence and slow breathing help."),
      mc("When a person describes hallucinations, you should:", ["Argue that they are not real", "Acknowledge their feelings without arguing or agreeing", "Laugh to lighten the mood", "Agree with everything they say"], 1, "Validate feelings, not the content."),
      ms("Signs of opioid overdose include: (Select all that apply.)", ["Slow or stopped breathing", "Pinpoint pupils", "Blue or gray lips", "Very high energy"], [0, 1, 2], "High energy is not a sign of opioid overdose."),
      mc("After calling 911 for a suspected opioid overdose, you should:", ["Wait without acting", "Give naloxone if available, support breathing and stay with the person", "Give coffee", "Put them in a cold shower"], 1, "Follow your training and protocol."),
      mc("In 2023 the FDA approved which naloxone product for over-the-counter use?", ["Naloxone injection", "4 mg naloxone nasal spray (Narcan)", "Methadone", "Buprenorphine"], 1, "The first OTC naloxone product."),
      mc("A person who drank heavily is vomiting, confused and hard to wake. You should:", ["Let them sleep it off on their back", "Call 911 and turn them on their side", "Give coffee", "Give a cold shower"], 1, "These are signs of alcohol poisoning."),
      mc("The three action principles of WHO psychological first aid are:", ["Assess, diagnose, treat", "Look, listen, link", "Stop, drop, roll", "Call, wait, leave"], 1, "Look, listen, link."),
      mc("Which is a de-escalation technique?", ["Standing between the person and the exit", "Keeping a calm voice and offering simple choices", "Raising your voice", "Making threats"], 1, "Calm and choice reduce tension."),
      mc("For emotional distress or suicidal thoughts without immediate danger, the main number is:", ["411", "988", "311", "711"], 1, "Call or text 988."),
      sc("A client is threatening others with a knife during a psychotic episode. What should you do?", ["Try to take the knife", "Move yourself and others to safety and call 911, telling them it is a mental health crisis", "Argue with the client", "Ignore it"], 1, "Safety first; call 911."),
    ],
  },
};
